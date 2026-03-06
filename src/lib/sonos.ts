const PORT = 1400

// Static room list — IPs from CLAUDE.md
export const SONOS_ROOMS = [
  { name: 'Living Room', ip: '192.168.4.106' },
  { name: 'Bedroom',     ip: '192.168.4.115' },
  { name: 'Roam',        ip: '192.168.4.144' },
  { name: 'Roam 2',      ip: '192.168.4.203' },
] as const

export type RoomName = typeof SONOS_ROOMS[number]['name']

export function getRoomIp(name: string): string | null {
  return SONOS_ROOMS.find(r => r.name === name)?.ip ?? null
}

// ── UPnP SOAP helpers ─────────────────────────────────────────────────────────

function envelope(service: string, action: string, body: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
  <s:Body>
    <u:${action} xmlns:u="urn:schemas-upnp-org:service:${service}:1">
      ${body}
    </u:${action}>
  </s:Body>
</s:Envelope>`
}

async function soap(ip: string, path: string, service: string, action: string, body = ''): Promise<string> {
  const res = await fetch(`http://${ip}:${PORT}${path}`, {
    method:  'POST',
    headers: {
      'Content-Type': 'text/xml; charset="utf-8"',
      SOAPAction:     `"urn:schemas-upnp-org:service:${service}:1#${action}"`,
    },
    body:   envelope(service, action, body),
    signal: AbortSignal.timeout(4000),
    cache:  'no-store',
  })
  if (!res.ok) throw new Error(`Sonos SOAP ${action} failed: ${res.status}`)
  return res.text()
}

function xmlVal(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return m ? m[1] : ''
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&amp;/g,  '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function parseDuration(s: string): number {
  // "H:MM:SS" → seconds
  const p = s.split(':').map(Number)
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2]
  if (p.length === 2) return p[0] * 60 + p[1]
  return 0
}

// ── Read ──────────────────────────────────────────────────────────────────────

export interface SonosState {
  isPlaying:  boolean
  title:      string
  artist:     string
  album:      string
  albumArt:   string | null
  durationMs: number
  progressMs: number
  volume:     number
}

export async function getSonosState(ip: string): Promise<SonosState> {
  const AVT_PATH = '/MediaRenderer/AVTransport/Control'
  const RC_PATH  = '/MediaRenderer/RenderingControl/Control'

  const [transportXml, positionXml, volumeXml] = await Promise.all([
    soap(ip, AVT_PATH, 'AVTransport',     'GetTransportInfo', '<InstanceID>0</InstanceID>'),
    soap(ip, AVT_PATH, 'AVTransport',     'GetPositionInfo',  '<InstanceID>0</InstanceID>'),
    soap(ip, RC_PATH,  'RenderingControl','GetVolume',         '<InstanceID>0</InstanceID><Channel>Master</Channel>'),
  ])

  const state     = xmlVal(transportXml, 'CurrentTransportState')
  const isPlaying = state === 'PLAYING'

  const rawDuration = xmlVal(positionXml, 'TrackDuration')
  const rawPosition = xmlVal(positionXml, 'RelTime')
  const durationMs  = parseDuration(rawDuration) * 1000
  const progressMs  = parseDuration(rawPosition) * 1000

  const volume = parseInt(xmlVal(volumeXml, 'CurrentVolume')) || 0

  // Parse DIDL-Lite track metadata
  const rawDidl   = xmlVal(positionXml, 'TrackMetaData')
  const didl      = decodeEntities(rawDidl)
  const title     = xmlVal(didl, 'dc:title')
  const artist    = xmlVal(didl, 'dc:creator') || xmlVal(didl, 'r:albumArtist')
  const album     = xmlVal(didl, 'upnp:album')
  let   albumArt  = xmlVal(didl, 'upnp:albumArtURI')

  // Sonos often returns a relative art path — make it absolute
  if (albumArt && albumArt.startsWith('/')) {
    albumArt = `http://${ip}:${PORT}${albumArt}`
  }

  return {
    isPlaying,
    title,
    artist,
    album,
    albumArt: albumArt || null,
    durationMs,
    progressMs,
    volume,
  }
}

// ── Control ───────────────────────────────────────────────────────────────────

const AVT = '/MediaRenderer/AVTransport/Control'
const RC  = '/MediaRenderer/RenderingControl/Control'

export async function sonosPlay(ip: string) {
  await soap(ip, AVT, 'AVTransport', 'Play', '<InstanceID>0</InstanceID><Speed>1</Speed>')
}
export async function sonosPause(ip: string) {
  await soap(ip, AVT, 'AVTransport', 'Pause', '<InstanceID>0</InstanceID>')
}
export async function sonosNext(ip: string) {
  await soap(ip, AVT, 'AVTransport', 'Next', '<InstanceID>0</InstanceID>')
}
export async function sonosPrevious(ip: string) {
  await soap(ip, AVT, 'AVTransport', 'Previous', '<InstanceID>0</InstanceID>')
}
export async function sonosSetVolume(ip: string, vol: number) {
  const v = Math.round(Math.max(0, Math.min(100, vol)))
  await soap(ip, RC, 'RenderingControl', 'SetVolume',
    `<InstanceID>0</InstanceID><Channel>Master</Channel><DesiredVolume>${v}</DesiredVolume>`)
}
