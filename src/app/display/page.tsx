'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { NowPlayingResponse } from '@/app/api/now-playing/route'
import { PIONEER_ANIMS } from '@/lib/pioneer-animations'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Pioneer OEL panel ─────────────────────────────────────────────────────────

function PioneerPanel({ animsBase }: { animsBase: string }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx(i => (i + 1) % PIONEER_ANIMS.length)
    }, 18_000) // cycle every 18s
    return () => clearInterval(timer)
  }, [])

  const anim = PIONEER_ANIMS[idx]

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Head unit bezel */}
      <div
        className="relative rounded-sm overflow-hidden select-none"
        style={{
          background:  'linear-gradient(180deg, #1c1c1c 0%, #111 60%, #0a0a0a 100%)',
          border:      '1px solid #333',
          boxShadow:   '0 4px 24px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)',
          padding:     '10px 12px',
          width:       340,
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="text-[9px] tracking-[0.3em] font-bold flex-shrink-0" style={{ color: '#888' }}>
            PIONEER
          </div>
          {/* OEL screen */}
          <div
            className="relative flex-1 flex items-center justify-center overflow-hidden rounded-sm scanlines"
            style={{
              background: '#000',
              boxShadow:  '0 0 18px 4px rgba(0,212,255,0.55), inset 0 0 12px rgba(0,0,0,0.6)',
              height:     52,
              border:     '1px solid #222',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${animsBase}/${anim.file}`}
              alt={anim.name}
              className="pioneer-anim max-h-full max-w-full object-contain relative z-0"
              style={{ filter: 'none' }}
            />
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            {['SRC', 'DISP'].map(lbl => (
              <div
                key={lbl}
                className="text-[7px] tracking-widest px-1.5 py-0.5 rounded-sm text-center"
                style={{ background: '#1a1a1a', border: '1px solid #333', color: '#555' }}
              >
                {lbl}
              </div>
            ))}
          </div>
        </div>
        {/* Bottom strip */}
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-2 rounded-full"
            style={{ background: 'linear-gradient(90deg, #0a0a0a, #222, #0a0a0a)', border: '1px solid #1a1a1a' }}
          />
          {['◄◄', '▶', '■', '►►'].map(lbl => (
            <div
              key={lbl}
              className="text-[8px] w-6 h-5 flex items-center justify-center rounded-sm"
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#666' }}
            >
              {lbl}
            </div>
          ))}
          <div
            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[6px]"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #555, #1a1a1a)',
              border:     '2px solid #333',
              color:      '#888',
              boxShadow:  '0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            VOL
          </div>
        </div>
      </div>
      <div className="font-mono text-[10px] text-muted tracking-[0.2em]">{anim.name.toUpperCase()}</div>
    </div>
  )
}

// ── Album Art panel ───────────────────────────────────────────────────────────

function AlbumArtPanel({ src }: { src: string | null }) {
  const [loaded, setLoaded] = useState(false)
  const prevSrc = useRef<string | null>(null)

  useEffect(() => {
    if (src !== prevSrc.current) {
      setLoaded(false)
      prevSrc.current = src
    }
  }, [src])

  if (!src) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          width: 260, height: 260,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
          border:     '1px solid #242424',
          boxShadow:  '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <span className="text-6xl opacity-20">♫</span>
      </div>
    )
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        width: 260, height: 260,
        boxShadow: '0 12px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Album art"
        className={`w-full h-full object-cover art-transition ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}

// ── Transport control button ──────────────────────────────────────────────────

function CtrlBtn({
  onClick,
  children,
  large = false,
  active = false,
}: {
  onClick: () => void
  children: React.ReactNode
  large?: boolean
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`
        btn-touch flex items-center justify-center rounded-full
        transition-all duration-100 active:scale-90
        ${large
          ? 'w-16 h-16 text-2xl'
          : 'w-12 h-12 text-lg'}
        ${active
          ? 'bg-cyan text-black shadow-[0_0_16px_4px_rgba(0,212,255,0.4)]'
          : 'bg-white/8 text-white/80 hover:bg-white/15 hover:text-white'}
        border border-white/10
      `}
      aria-label={typeof children === 'string' ? children : undefined}
    >
      {children}
    </button>
  )
}

// ── Idle screen ───────────────────────────────────────────────────────────────

function IdleScreen({ room }: { room: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full">
      <div className="w-16 h-16 rounded-full border-2 border-border flex items-center justify-center text-3xl opacity-30">
        ♫
      </div>
      <div className="font-mono text-muted text-sm tracking-widest">NOTHING PLAYING</div>
      {room && (
        <div className="font-mono text-muted text-xs tracking-wider opacity-60">{room.toUpperCase()}</div>
      )}
    </div>
  )
}

// ── Room picker overlay ───────────────────────────────────────────────────────

const ROOMS = ['Living Room', 'Bedroom', 'Roam', 'Roam 2']

function RoomPicker({ current, onSelect, onClose }: {
  current: string | null
  onSelect: (room: string) => void
  onClose: () => void
}) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex flex-col gap-3 bg-surface border border-border rounded-2xl p-6 w-72"
        onClick={e => e.stopPropagation()}
      >
        <div className="font-mono text-xs tracking-widest text-muted mb-1">SELECT ROOM</div>
        {ROOMS.map(r => (
          <button
            key={r}
            onClick={() => { onSelect(r); onClose() }}
            className={`
              btn-touch px-4 py-3 rounded-xl font-mono text-sm tracking-wider text-left transition-all
              ${r === current
                ? 'bg-cyan/15 border border-cyan text-cyan'
                : 'bg-card border border-border text-white/70 hover:border-white/30 hover:text-white'}
            `}
          >
            {r.toUpperCase()}
          </button>
        ))}
        <button
          onClick={onClose}
          className="btn-touch mt-1 font-mono text-xs text-muted tracking-widest hover:text-white transition-colors"
        >
          CANCEL
        </button>
      </div>
    </div>
  )
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: 'sonos' | 'spotify'; onChange: (t: 'sonos' | 'spotify') => void }) {
  return (
    <div className="flex gap-1 bg-black/30 rounded-lg p-1">
      {(['sonos', 'spotify'] as const).map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`
            btn-touch px-4 py-1.5 rounded-md font-mono text-xs tracking-[0.15em] transition-all
            ${active === tab
              ? tab === 'spotify'
                ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                : 'bg-cyan/15 text-cyan border border-cyan/40'
              : 'text-muted hover:text-white'}
          `}
        >
          {tab === 'sonos' ? '🔊 SONOS' : '🎵 SPOTIFY'}
        </button>
      ))}
    </div>
  )
}

// ── Main display component ────────────────────────────────────────────────────

function DisplayContent() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const roomParam     = searchParams.get('room')
  const tabParam      = searchParams.get('tab') as 'sonos' | 'spotify' | null

  const [tab,         setTab]         = useState<'sonos' | 'spotify'>(tabParam === 'spotify' ? 'spotify' : 'sonos')
  const [room,        setRoom]        = useState<string | null>(roomParam)
  const [data,        setData]        = useState<NowPlayingResponse | null>(null)
  const [progressMs,  setProgressMs]  = useState(0)
  const [lastSync,    setLastSync]    = useState(0)
  const [pioneerMode, setPioneerMode] = useState(false)
  const [showRooms,   setShowRooms]   = useState(false)
  const [volume,      setVolume]      = useState(50)
  const [volDragging, setVolDragging] = useState(false)
  const pendingVol    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const animsBase = process.env.NEXT_PUBLIC_PIONEER_ANIMATIONS_BASE_URL ?? '/animations'

  // ── Poll now-playing ───────────────────────────────────────────────────────
  const fetchNowPlaying = useCallback(async () => {
    let url: string
    if (tab === 'spotify') {
      url = '/api/now-playing?spotifyOnly=1'
    } else {
      url = `/api/now-playing${room ? `?room=${encodeURIComponent(room)}` : ''}`
    }
    try {
      const res  = await fetch(url)
      const json = (await res.json()) as NowPlayingResponse
      setData(json)
      setProgressMs(json.track?.progressMs ?? 0)
      setLastSync(Date.now())
      if (!volDragging) setVolume(json.volume)
    } catch { /* silently ignore network errors */ }
  }, [tab, room, volDragging])

  useEffect(() => {
    fetchNowPlaying()
    const id = setInterval(fetchNowPlaying, 2500)
    return () => clearInterval(id)
  }, [fetchNowPlaying])

  // ── Smooth progress counter ────────────────────────────────────────────────
  useEffect(() => {
    if (!data?.isPlaying) return
    const id = setInterval(() => {
      setProgressMs(prev => prev + 250)
    }, 250)
    return () => clearInterval(id)
  }, [data?.isPlaying, lastSync])

  // ── Update URL when room changes ──────────────────────────────────────────
  useEffect(() => {
    const url = room ? `/display?room=${encodeURIComponent(room)}` : '/display'
    router.replace(url, { scroll: false })
  }, [room, router])

  // ── Control helpers ────────────────────────────────────────────────────────
  const sendControl = useCallback(async (action: string, value?: number) => {
    if (tab === 'spotify') {
      // Spotify tab: always control Spotify directly
      await fetch('/api/spotify/control', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action, value }),
      })
    } else if (room) {
      // Sonos tab: control the selected room
      await fetch('/api/sonos/control', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ room, action, value }),
      })
    }
    setTimeout(fetchNowPlaying, 400)
  }, [tab, room, fetchNowPlaying])

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setVolume(v)
    if (pendingVol.current) clearTimeout(pendingVol.current)
    pendingVol.current = setTimeout(() => {
      sendControl('volume', v)
      setVolDragging(false)
    }, 300)
  }

  const track       = data?.track ?? null
  const isPlaying   = data?.isPlaying ?? false
  const source      = data?.source ?? 'none'
  const progress    = track ? Math.min(progressMs, track.durationMs) : 0
  const progressPct = track?.durationMs ? (progress / track.durationMs) * 100 : 0

  // ── Background: blurred album art ─────────────────────────────────────────
  const bgArt = track?.albumArt

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">

      {/* ── Blurred background ── */}
      {bgArt && (
        <div
          className="absolute inset-0 scale-110 art-transition"
          style={{
            backgroundImage:  `url(${bgArt})`,
            backgroundSize:   'cover',
            backgroundPosition: 'center',
            filter:           'blur(48px) brightness(0.25) saturate(1.4)',
          }}
        />
      )}
      {/* Dark vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-3">

        {/* Tab switcher */}
        <TabBar active={tab} onChange={t => { setTab(t); setData(null) }} />

        {/* Centre: room selector (Sonos) or device name (Spotify) */}
        <div className="flex-1 flex justify-center">
          {tab === 'sonos' ? (
            <button
              onClick={() => setShowRooms(true)}
              className="btn-touch flex items-center gap-2 font-mono text-xs tracking-widest text-white/60 hover:text-white transition-colors"
            >
              <span>🔊</span>
              <span>{room?.toUpperCase() ?? 'ALL ROOMS'}</span>
              <span className="text-muted">▾</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 font-mono text-xs tracking-widest text-white/40">
              {data?.device && (
                <>
                  <span className="text-green-400/60">▶</span>
                  <span>{data.device}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Pioneer mode toggle */}
        <button
          onClick={() => setPioneerMode(m => !m)}
          className={`
            btn-touch font-mono text-[10px] tracking-[0.15em] px-3 py-1.5 rounded border transition-all
            ${pioneerMode
              ? 'border-cyan bg-cyan/15 text-cyan shadow-[0_0_10px_rgba(0,212,255,0.3)]'
              : 'border-border bg-surface/50 text-muted hover:text-white hover:border-white/20'}
          `}
        >
          PIONEER MODE
        </button>
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 w-full h-full flex items-center px-8 gap-8 pt-12">

        {/* Left panel: art or Pioneer animation */}
        <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 280 }}>
          {pioneerMode
            ? <PioneerPanel animsBase={animsBase} />
            : <AlbumArtPanel src={track?.albumArt ?? null} />
          }
        </div>

        {/* Right panel: track info + controls */}
        <div className="flex-1 flex flex-col justify-center gap-5 min-w-0">

          {!track
            ? <IdleScreen room={room} />
            : <>
                {/* Track title */}
                <div className="flex flex-col gap-1.5">
                  <h1
                    className="text-white font-bold leading-tight truncate"
                    style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)' }}
                    title={track.title}
                  >
                    {track.title || '—'}
                  </h1>
                  <p className="text-white/60 text-lg truncate" title={track.artist}>
                    {track.artist || '—'}
                  </p>
                  {track.album && (
                    <p className="text-white/35 text-sm truncate font-mono tracking-wider" title={track.album}>
                      {track.album.toUpperCase()}
                    </p>
                  )}
                </div>

                {/* Progress bar */}
                <div className="flex flex-col gap-1.5">
                  <div
                    className="relative w-full rounded-full overflow-hidden"
                    style={{ height: 4, background: 'rgba(255,255,255,0.12)' }}
                  >
                    <div
                      className="absolute left-0 top-0 h-full rounded-full progress-fill"
                      style={{
                        width:      `${progressPct}%`,
                        background: 'linear-gradient(90deg, #00d4ff, #00a0bf)',
                        boxShadow:  '0 0 8px rgba(0,212,255,0.6)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between font-mono text-[11px] text-white/35 tracking-wider">
                    <span>{formatMs(progress)}</span>
                    <span>{formatMs(track.durationMs)}</span>
                  </div>
                </div>

                {/* Transport controls */}
                <div className="flex items-center gap-4">
                  <CtrlBtn onClick={() => sendControl('previous')}>⏮</CtrlBtn>
                  <CtrlBtn large active={isPlaying} onClick={() => sendControl(isPlaying ? 'pause' : 'play')}>
                    {isPlaying ? '⏸' : '▶'}
                  </CtrlBtn>
                  <CtrlBtn onClick={() => sendControl('next')}>⏭</CtrlBtn>

                  {/* Volume */}
                  <div className="flex-1 flex items-center gap-3 ml-2">
                    <span className="text-white/40 text-sm flex-shrink-0">🔈</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={volume}
                      className="flex-1"
                      onMouseDown={() => setVolDragging(true)}
                      onTouchStart={() => setVolDragging(true)}
                      onChange={handleVolumeChange}
                    />
                    <span className="font-mono text-[11px] text-white/35 w-7 text-right flex-shrink-0">
                      {volume}
                    </span>
                  </div>
                </div>
              </>
          }
        </div>
      </div>

      {/* ── Back to room picker ── */}
      <button
        onClick={() => router.push('/')}
        className="
          btn-touch absolute bottom-4 left-6 z-20
          font-mono text-[10px] tracking-widest text-muted hover:text-white
          transition-colors
        "
      >
        ← ROOMS
      </button>

      {/* ── Room picker overlay ── */}
      {showRooms && (
        <RoomPicker
          current={room}
          onSelect={r => { setRoom(r); setData(null) }}
          onClose={() => setShowRooms(false)}
        />
      )}
    </div>
  )
}

// Wrap in Suspense for useSearchParams
export default function DisplayPage() {
  return (
    <Suspense>
      <DisplayContent />
    </Suspense>
  )
}
