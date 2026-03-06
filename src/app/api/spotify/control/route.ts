import { NextRequest, NextResponse }                                            from 'next/server'
import { spotifyPlay, spotifyPause, spotifyNext, spotifyPrevious, spotifySetVolume } from '@/lib/spotify'

export async function POST(req: NextRequest) {
  const { action, value } = await req.json() as {
    action: 'play' | 'pause' | 'next' | 'previous' | 'volume'
    value?: number
  }

  switch (action) {
    case 'play':     await spotifyPlay();     break
    case 'pause':    await spotifyPause();    break
    case 'next':     await spotifyNext();     break
    case 'previous': await spotifyPrevious(); break
    case 'volume':
      if (value !== undefined) await spotifySetVolume(value)
      break
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
