/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#1e262a',
          darker: '#161c1f',
          light: '#2a343a',
          teal: '#59bca4',
          orange: '#f18b32',
          gray: '#8396a5'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.3)',
        'teal-glow': '0 0 20px rgba(89, 188, 164, 0.4)',
      }
    },
  },
  plugins: [],
}
