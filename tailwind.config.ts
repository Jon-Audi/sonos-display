import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#080808',
        surface:    '#111111',
        card:       '#1a1a1a',
        border:     '#242424',
        cyan:       '#00d4ff',
        'cyan-dim': '#00a0bf',
        muted:      '#555',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
