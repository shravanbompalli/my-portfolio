/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      screens: {
        tablet: '810px',
        desktop: '1280px',
      },
    },
  },
  plugins: [],
}
