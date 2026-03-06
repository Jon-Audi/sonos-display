import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.scdn.co' },       // Spotify album art CDN
      { protocol: 'https', hostname: '*.scdn.co' },
      { protocol: 'https', hostname: '*.spotifycdn.com' },
      { protocol: 'http',  hostname: '192.168.*' },        // Sonos local album art
    ],
  },
}

export default nextConfig
