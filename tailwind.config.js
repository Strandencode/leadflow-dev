/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Granskog Noir — primary
        ink: {
          DEFAULT: '#07140E',      // primary dark ground
          soft: '#0C1D14',         // raised dark surface
          muted: '#5C6B60',        // body text on canvas
          subtle: '#8A9389',       // tertiary text
        },
        canvas: {
          DEFAULT: '#F4F0E6',      // warm parchment field
          warm: '#EDE7D6',         // slightly raised
          soft: '#FBF8F0',         // lightest surface
        },
        sage: {
          bright: '#B8E0C3',       // the acceleration accent
          DEFAULT: '#8FB79A',      // supporting sage
          soft: '#D4E6D7',         // sage tint
        },
        butter: '#F1E6B8',
        rose:   '#E8CEC8',
        ember:  '#C67D50',

        // Status
        ok:   '#8FB79A',
        warn: '#C67D50',
        err:  '#C83A2E',

        // Text shortcuts
        txt: {
          primary:   '#07140E',
          secondary: '#5C6B60',
          tertiary:  '#8A9389',
        },
        bdr: '#E3DDCB',

        // --- Legacy aliases (map old names to new palette so untouched pages inherit revamp) ---
        paper:   '#F4F0E6',
        line:    { DEFAULT: '#E3DDCB', soft: '#EDE7D6' },
        surface: { DEFAULT: '#F4F0E6', raised: '#FBF8F0', sunken: '#EDE7D6' },
        gold:    { DEFAULT: '#07140E', light: '#5C6B60', dim: 'rgba(184,224,195,0.25)', hover: '#0C1D14' },
        silver:  { DEFAULT: '#8A9389', light: '#B8C0B5' },
        coral:   { DEFAULT: '#07140E', hover: '#0C1D14', glow: 'rgba(184,224,195,0.25)' },
        violet:  { DEFAULT: '#07140E', soft: 'rgba(184,224,195,0.18)' },
        teal:    { DEFAULT: '#8FB79A', soft: 'rgba(143,183,154,0.12)' },
        heat:    { hot: '#C67D50', warm: '#C67D50', mild: '#F1E6B8' },
        accent:  {
          blue:  '#8FB79A',
          green: '#8FB79A',
          red:   '#C83A2E',
          amber: '#C67D50',
        }
      },
      fontFamily: {
        display: ['"Work Sans"', 'system-ui', 'sans-serif'],
        body:    ['Outfit', 'system-ui', 'sans-serif'],
        mono:    ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        mono: '0.04em',
      },
      borderRadius: {
        DEFAULT: '6px',
      },
      boxShadow: {
        // flatter, more crafted than glossy
        card:  '0 1px 0 rgba(7,20,14,0.04), 0 4px 12px rgba(7,20,14,0.04)',
        raise: '0 1px 0 rgba(7,20,14,0.06), 0 8px 24px rgba(7,20,14,0.06)',
      }
    },
  },
  plugins: [],
}
