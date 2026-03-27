/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono:    ['DM Mono', 'monospace'],
      },
      colors: {
        base:    '#0C0A08',
        surface: '#161210',
        raised:  '#1E1A15',
        hover:   '#262018',
        border:  '#2E2820',
        'border-hi': '#3D3228',
        paper:   '#F5EDD8',
        amber: {
          700: '#92650A',
          500: '#C8920A',
          400: '#E8A820',
          200: '#F5D080',
        },
        ink: {
          primary:   '#F0E6D3',
          secondary: '#8A7A68',
          muted:     '#4A3F35',
          dark:      '#1A1410',
        },
        success:  '#4A8F5F',
        'success-text': '#90C8A0',
        danger:   '#903030',
        'danger-text':  '#E08080',
      },
      boxShadow: {
        card:  '0 2px 16px rgba(0,0,0,0.5)',
        paper: '0 8px 40px rgba(0,0,0,0.45)',
      },
      borderRadius: {
        DEFAULT: '8px',
        card: '12px',
        flash: '14px',
      },
    },
  },
  plugins: [],
}
