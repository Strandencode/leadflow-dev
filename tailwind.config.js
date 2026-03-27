/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0D0B1A', soft: '#1A1730', muted: '#2D2950' },
        coral: { DEFAULT: '#FF6B4A', hover: '#E85A3A', glow: 'rgba(255,107,74,0.15)' },
        violet: { DEFAULT: '#7C5CFC', soft: 'rgba(124,92,252,0.1)' },
        teal: { DEFAULT: '#2DD4BF', soft: 'rgba(45,212,191,0.1)' },
        surface: { DEFAULT: '#F8F7FC', raised: '#FFFFFF', sunken: '#EEEDF5' },
        txt: { primary: '#0D0B1A', secondary: '#6B6589', tertiary: '#9E98B5' },
        bdr: '#E5E3EF',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Instrument Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
      }
    },
  },
  plugins: [],
}

