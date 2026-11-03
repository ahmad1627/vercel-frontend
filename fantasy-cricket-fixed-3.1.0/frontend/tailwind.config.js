/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cricket: {
          dark: '#031a14',
          pitch: '#064e3b',
          grass: '#047857',
          turf: '#10b981',
          gold: '#fbbf24',
          goldDark: '#d97706',
          card: '#082f25',
          border: '#0d5442',
        }
      },
      backgroundImage: {
        'stadium-gradient': 'radial-gradient(ellipse at top, #065f46 0%, #042f2e 50%, #021a14 100%)',
        'pitch-pattern': 'linear-gradient(180deg, #065f46 0%, #047857 50%, #065f46 100%)',
      }
    },
  },
  plugins: [],
}
