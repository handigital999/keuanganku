/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        yellow: {
          50:  '#FFFBEA',
          100: '#FFF3CD',
          200: '#FFE69C',
          400: '#FFC107',
          500: '#E6A800',
          600: '#CC8800',
          700: '#854F0B',
          800: '#633806',
          900: '#412402',
        },
        green:  { 600: '#0F6E56', 700: '#085041' },
        red:    { 600: '#993C1D', 700: '#712B13' },
      },
    },
  },
  plugins: [],
}
