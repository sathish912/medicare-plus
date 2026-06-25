/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff8ff",
          100: "#dbeefe",
          200: "#bfe2fe",
          300: "#93cffd",
          400: "#60b3fa",
          500: "#3b95f5",
          600: "#2577e3",
          700: "#1d61c4",
          800: "#1d4f9e",
          900: "#1d447e",
        },
        teal: {
          500: "#14b8a6",
          600: "#0d9488",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
