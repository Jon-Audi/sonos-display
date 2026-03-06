import { NextResponse }  from 'next/server'
import { SONOS_ROOMS }   from '@/lib/sonos'

export async function GET() {
  return NextResponse.json(SONOS_ROOMS.map(r => r.name))
}
