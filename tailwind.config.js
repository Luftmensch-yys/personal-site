/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        geist: ['Geist', 'sans-serif'],
        serif: ['"Cormorant Garamond"', '"Songti SC"', 'serif'],
      },
    },
  },
  plugins: [],
}
