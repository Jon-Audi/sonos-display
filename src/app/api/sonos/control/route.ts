import { NextRequest, NextResponse }                             from 'next/server'
import { getRoomIp, sonosPlay, sonosPause, sonosNext, sonosPrevious, sonosSetVolume } from '@/lib/sonos'

export async function POST(req: NextRequest) {
  const { room, action, value } = await req.json() as {
    room:   string
    action: 'play' | 'pause' | 'next' | 'previous' | 'volume'
    value?: number
  }

  const ip = getRoomIp(room)
  if (!ip) return NextResponse.json({ error: `Room "${room}" not found` }, { status: 404 })

  switch (action) {
    case 'play':     await sonosPlay(ip);     break
    case 'pause':    await sonosPause(ip);    break
    case 'next':     await sonosNext(ip);     break
    case 'previous': await sonosPrevious(ip); break
    case 'volume':
      if (value !== undefined) await sonosSetVolume(ip, value)
      break
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
