/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#1a1a1b',
          blue: '#00aeef',
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg, #f3d5b5, #00aeef)',
      }
    },
  },
  plugins: [],
}