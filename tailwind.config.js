/** @type {import('tailwindcss').Config} */
export default {
  content: ["./views/**/*.{html,ejs}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
