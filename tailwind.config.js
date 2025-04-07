/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
      padding: {
        'safe': 'env(safe-area-inset-bottom)',
        '18': '4.5rem',
      },
      fontFamily: {
        sans: [
          '"SF Pro Display"',
          '"SF Pro Text"',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        'card-bg': '#f7f5f0',
        'text-primary': '#000000',
        'text-secondary': '#6b7280',
        'border-color': '#e5e5e5',
        'dark-bg': '#121212',
        'dark-card': '#1e1e1e',
        'dark-text': '#f0f0f0',
        'dark-text-secondary': '#a0a0a0',
      },
      borderRadius: {
        'card': '1.5rem',
      },
    },
  },
  plugins: [],
} 