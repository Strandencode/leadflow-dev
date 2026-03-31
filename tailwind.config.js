/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Premium dark palette
        ink: { DEFAULT: '#0A0A0F', soft: '#12121A', muted: '#1A1A24' },
        gold: { DEFAULT: '#C9A84C', light: '#E2C97E', dim: 'rgba(201,168,76,0.12)', hover: '#B8963E' },
        silver: { DEFAULT: '#8A8A9A', light: '#B8B8C8' },
        surface: { DEFAULT: '#F5F5F7', raised: '#FFFFFF', sunken: '#EBEBEF' },
        txt: { primary: '#0A0A0F', secondary: '#5A5A6E', tertiary: '#8A8A9A' },
        bdr: '#E0E0E6',
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
