import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sonos Display',
  description: 'Now-playing display for Sonos + Spotify',
}

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  // Lock to landscape for 7" RPi display
  // The kiosk chromium flags handle this too
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-white overflow-hidden">
        {children}
      </body>
    </html>
  )
}
