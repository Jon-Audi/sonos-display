const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const API      = 'https://api.spotify.com/v1'

// In-memory token cache (lives for the server process lifetime)
let _cache: { token: string; expiresAt: number } | null = null

export async function getAccessToken(): Promise<string> {
  if (_cache && Date.now() < _cache.expiresAt - 60_000) {
    return _cache.token
  }

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    throw new Error('Spotify credentials not configured — check .env.local')
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Spotify token refresh failed (${res.status}): ${body}`)
  }

  const data = await res.json()
  _cache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return _cache.token
}

async function spotifyFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessToken()
  return fetch(`${API}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
    cache: 'no-store',
  })
}

// ── Read ──────────────────────────────────────────────────────────────────────

export interface SpotifyTrack {
  id:        string
  name:      string
  artists:   string
  album:     string
  albumArt:  string | null
  durationMs: number
  progressMs: number
  isPlaying:  boolean
  deviceName: string | null
  deviceVolume: number | null
}

export async function getNowPlaying(): Promise<SpotifyTrack | null> {
  const res = await spotifyFetch('/me/player')
  if (res.status === 204 || res.status === 404) return null
  if (!res.ok) return null

  const data = await res.json()
  if (!data.item) return null

  return {
    id:           data.item.id,
    name:         data.item.name,
    artists:      (data.item.artists as { name: string }[]).map(a => a.name).join(', '),
    album:        data.item.album?.name ?? '',
    albumArt:     data.item.album?.images?.[0]?.url ?? null,
    durationMs:   data.item.duration_ms,
    progressMs:   data.progress_ms ?? 0,
    isPlaying:    data.is_playing,
    deviceName:   data.device?.name ?? null,
    deviceVolume: data.device?.volume_percent ?? null,
  }
}

// ── Control ───────────────────────────────────────────────────────────────────

export async function spotifyPlay()     { await spotifyFetch('/me/player/play',     { method: 'PUT'  }) }
export async function spotifyPause()    { await spotifyFetch('/me/player/pause',    { method: 'PUT'  }) }
export async function spotifyNext()     { await spotifyFetch('/me/player/next',     { method: 'POST' }) }
export async function spotifyPrevious() { await spotifyFetch('/me/player/previous', { method: 'POST' }) }

export async function spotifySetVolume(vol: number) {
  await spotifyFetch(`/me/player/volume?volume_percent=${Math.round(Math.max(0, Math.min(100, vol)))}`, { method: 'PUT' })
}
