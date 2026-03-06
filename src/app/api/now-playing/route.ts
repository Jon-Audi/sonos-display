import { NextRequest, NextResponse } from 'next/server'
import { getNowPlaying }             from '@/lib/spotify'
import { getSonosState, getRoomIp }  from '@/lib/sonos'

export const dynamic = 'force-dynamic'

export interface NowPlayingResponse {
  source:    'spotify' | 'sonos' | 'none'
  isPlaying: boolean
  track: {
    title:      string
    artist:     string
    album:      string
    albumArt:   string | null
    durationMs: number
    progressMs: number
  } | null
  room:       string | null
  device:     string | null   // Spotify device name (headset, PC, etc.)
  volume:     number
  error?:     string
}

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get('room')
  const ip   = room ? getRoomIp(room) : null

  const [spotifyResult, sonosResult] = await Promise.allSettled([
    getNowPlaying(),
    ip ? getSonosState(ip) : Promise.resolve(null),
  ])

  const spotify = spotifyResult.status === 'fulfilled' ? spotifyResult.value : null
  const sonos   = sonosResult.status  === 'fulfilled' ? sonosResult.value  : null

  // Log errors (server-side only)
  if (spotifyResult.status === 'rejected') {
    console.error('[spotify]', spotifyResult.reason?.message)
  }
  if (sonosResult.status === 'rejected') {
    console.error('[sonos]', sonosResult.reason?.message)
  }

  const spotifyOnly = req.nextUrl.searchParams.get('spotifyOnly') === '1'

  // Spotify-only mode: return global Spotify state regardless of Sonos
  if (spotifyOnly) {
    if (spotify) {
      return NextResponse.json({
        source:    'spotify',
        isPlaying: spotify.isPlaying,
        track: {
          title:      spotify.name,
          artist:     spotify.artists,
          album:      spotify.album,
          albumArt:   spotify.albumArt,
          durationMs: spotify.durationMs,
          progressMs: spotify.progressMs,
        },
        room:   null,
        device: spotify.deviceName,
        volume: spotify.deviceVolume ?? 50,
      } satisfies NowPlayingResponse)
    }
    return NextResponse.json({ source: 'none', isPlaying: false, track: null, room: null, device: null, volume: 50 } satisfies NowPlayingResponse)
  }

  // Prefer Spotify when it's actively playing — richer metadata + album art CDN
  if (spotify?.isPlaying) {
    const payload: NowPlayingResponse = {
      source:    'spotify',
      isPlaying: true,
      track: {
        title:      spotify.name,
        artist:     spotify.artists,
        album:      spotify.album,
        albumArt:   spotify.albumArt,
        durationMs: spotify.durationMs,
        progressMs: spotify.progressMs,
      },
      room,
      device: spotify.deviceName,
      volume: sonos?.volume ?? spotify.deviceVolume ?? 50,
    }
    return NextResponse.json(payload)
  }

  // Fall back to Sonos state (handles radio, other sources, Spotify via Sonos)
  if (sonos && (sonos.isPlaying || sonos.title)) {
    const payload: NowPlayingResponse = {
      source:    'sonos',
      isPlaying: sonos.isPlaying,
      track: sonos.title
        ? {
            title:      sonos.title,
            artist:     sonos.artist,
            album:      sonos.album,
            albumArt:   sonos.albumArt,
            durationMs: sonos.durationMs,
            progressMs: sonos.progressMs,
          }
        : null,
      room,
      device: null,
      volume: sonos.volume,
    }
    return NextResponse.json(payload)
  }

  // Nothing playing
  const idle: NowPlayingResponse = {
    source:    'none',
    isPlaying: false,
    track:     null,
    room,
    device:    null,
    volume:    sonos?.volume ?? 50,
  }
  return NextResponse.json(idle)
}
