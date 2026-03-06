# Sonos Display

A full-screen now-playing display for Sonos + Spotify, optimized for 800×480 (Raspberry Pi 7" touchscreen).

## Setup

### 1. Credentials

Copy the example env file and fill in your Spotify credentials:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REFRESH_TOKEN=your_refresh_token
```

See the main project plan for steps to get these.

### 2. Pioneer animations (optional)

Copy GIF files from the pioneer-gallery project:
```bash
cp -r ../pioneer-gallery/public/animations/* ./public/animations/
```

Without this, Pioneer Mode will still load but show broken images.

### 3. Install & run

```bash
npm install
npm run dev        # development (port 3001)
npm run build && npm run start  # production
```

Open `http://localhost:3001` in a browser.

---

## Raspberry Pi Kiosk Setup

Run Chromium in kiosk mode at boot:

```bash
# Install unclutter to hide the cursor
sudo apt install unclutter

# Add to ~/.config/autostart/kiosk.desktop (or use @lxpanel autostart)
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --start-fullscreen \
  http://localhost:3001/display?room=Living+Room
```

Or use a systemd service to run the Next.js app, then autostart Chromium.

---

## Architecture

- **`/`** — Room picker (Living Room, Bedroom, Roam, Roam 2)
- **`/display?room=Living+Room`** — Full-screen now-playing display
- **`/api/now-playing`** — Polls Spotify + Sonos, returns combined state
- **`/api/sonos/control`** — Play/pause/next/prev/volume for a Sonos room
- **`/api/spotify/control`** — Spotify playback control

## Features

- Real-time now-playing from both Spotify and Sonos
- Blurred album art background (like Spotify mobile)
- Smooth progress bar that advances every 250ms
- Touch-friendly transport controls
- Room switcher overlay
- **Pioneer Mode** — shows looping Pioneer OEL animations in a head unit bezel
- Volume control (Sonos-side)
- Works with any Sonos source (radio, library, Spotify, etc.)
