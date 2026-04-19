/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Premium dark palette
        ink: { DEFAULT: '#0A0A0F', soft: '#12121A', muted: '#1A1A24' },
        gold: { DEFAULT: '#0051A8', light: '#1A6BC4', dim: 'rgba(0,81,168,0.12)', hover: '#003D7A' },
        silver: { DEFAULT: '#8A8A9A', light: '#B8B8C8' },
        surface: { DEFAULT: '#F7F7F4', raised: '#FFFFFF', sunken: '#EBEBEF' },
        txt: { primary: '#0A0A0F', secondary: '#4A4A55', tertiary: '#8A8A9A' },
        bdr: '#E6E6EC',
        // Warm paper palette (inside logged-in app) — matches designer prototype
        paper: '#F7F7F4',
        line: { DEFAULT: '#E6E6EC', soft: '#F0F0F3' },
        // Heat accents — warm earthy highlights
        heat: { hot: '#E04E2E', warm: '#E8893A', mild: '#C7A04E' },
        // Status
        ok:   '#0E9968',
        warn: '#D08A2E',
        err:  '#C83A2E',
        // Legacy aliases (mapped to new palette)
        coral: { DEFAULT: '#0051A8', hover: '#003D7A', glow: 'rgba(0,81,168,0.12)' },
        violet: { DEFAULT: '#0051A8', soft: 'rgba(0,81,168,0.06)' },
        teal: { DEFAULT: '#10B981', soft: 'rgba(16,185,129,0.06)' },
        // Accent colors for data/charts
        accent: {
          blue: '#3B82F6',
          green: '#10B981',
          red: '#EF4444',
          amber: '#F59E0B',
        }
      },
      fontFamily: {
        display: ['"EB Garamond"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
      }
    },
  },
  plugins: [],
}
