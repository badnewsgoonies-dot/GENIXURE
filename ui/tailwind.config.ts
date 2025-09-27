/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#0A0A0A',
        primary: '#F33333',
        accent: '#FFD166',
        border: '#2A2A2A',
        text: '#EAEAEA',
        muted: '#9AA0A6',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.3), 0 6px 12px rgba(0,0,0,0.25)'
      },
    },
  },
  plugins: [],
}

