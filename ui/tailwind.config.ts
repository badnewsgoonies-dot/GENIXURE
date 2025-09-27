import type { Config } from 'tailwindcss'
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'rgba(255,255,255,0.15)',
        surface: 'rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
} satisfies Config
