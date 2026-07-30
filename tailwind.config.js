/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aquamarine: {
          0: '#E0E0E0',
          50: '#E5FFFC',
          100: '#CCFFF8',
          200: '#99FFF1',
          300: '#66FFEB',
          400: '#33FFE4',
          500: '#00FFDD',
          600: '#00CCB1',
          700: '#009985',
          800: '#006658',
          900: '#00332C',
          950: '#00241F',
          1000: '#0F0F0F',
        }
      }
    },
  },
  plugins: [],
}
