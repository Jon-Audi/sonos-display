import Link from 'next/link'

const ROOMS = ['Living Room', 'Bedroom', 'Roam', 'Roam 2'] as const

const ROOM_ICONS: Record<string, string> = {
  'Living Room': '🛋',
  'Bedroom':     '🛏',
  'Roam':        '🎵',
  'Roam 2':      '🎵',
}

export default function RoomPickerPage() {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-background gap-10 px-8">

      {/* Brand */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-block w-3 h-3 rounded-full bg-cyan shadow-[0_0_12px_3px_rgba(0,212,255,0.7)]" />
          <span className="font-mono text-cyan tracking-[0.3em] text-xl font-bold">SONOS DISPLAY</span>
        </div>
        <p className="text-muted font-mono text-xs tracking-widest">SELECT A ROOM TO MONITOR</p>
      </div>

      {/* Room grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {ROOMS.map(room => (
          <Link
            key={room}
            href={`/display?room=${encodeURIComponent(room)}`}
            className="
              group flex flex-col items-center justify-center gap-3
              h-32 rounded-xl border border-border bg-card
              hover:border-cyan hover:bg-cyan/5
              active:scale-95
              transition-all duration-150 btn-touch
            "
          >
            <span className="text-3xl">{ROOM_ICONS[room] ?? '🔊'}</span>
            <span className="font-mono text-sm tracking-wider text-white/80 group-hover:text-cyan transition-colors">
              {room.toUpperCase()}
            </span>
          </Link>
        ))}
      </div>

      {/* All rooms shortcut */}
      <Link
        href="/display"
        className="
          font-mono text-xs tracking-widest text-muted
          hover:text-white transition-colors border-b border-transparent
          hover:border-muted pb-px
        "
      >
        SHOW ALL ROOMS
      </Link>

    </div>
  )
}
