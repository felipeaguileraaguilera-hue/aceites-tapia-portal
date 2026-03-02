/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark: '#0f1114',
        surface: '#171a1f',
        'surface-alt': '#1d2127',
        'dark-border': '#2a2f38',
        olive: { 400: '#a5c252', 500: '#8fa948', 600: '#6b8035' },
        gold: { 400: '#d4b852', 500: '#b8a44c', 600: '#8a7a38' },
      },
    },
  },
  plugins: [],
}
