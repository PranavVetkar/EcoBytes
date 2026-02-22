/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        terra: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",  // primary action green
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",  // deep forest
          950: "#052e16",
        },
        eco: {
          50: '#f8faf3',   // lightest pista white-ish green
          100: '#f1f8e9',  // light pista
          200: '#e1efd1',  // soft pista
          300: '#c5e1a5',
          400: '#aed581',
          500: '#94c973',  // primary pista green
          600: '#7cb342',
          700: '#689f38',
          800: '#558b2f',
          900: '#33691e',
        },
        army: {
          50: '#f4f6f3',
          100: '#e8ece7',
          200: '#c8d1c7',
          300: '#a8b6a7',
          400: '#698067',
          500: '#4b5320',  // Army Green
          600: '#434a1d',
          700: '#3a401a',
          800: '#323716',
          900: '#292d12',
        },
        garden: {
          cream: '#FFFFE3',   // Color 1: Background for 1st & 3rd col
          lavender: '#DBD4FF', // Color 2: Background for 2nd col
          olive: '#808034',    // Color 3: Font color
          purple: '#723480',   // Color 4: Decorative elements
        },
        earth: {
          100: "#fef9c3",
          500: "#ca8a04",  // warm amber for points/rewards
          900: "#713f12",
        },
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "system-ui", "sans-serif"],
        creative: ["Syne", "sans-serif"],
      },
    },
  },
  plugins: [],
};
// Force rebuild - Tailwind Country Garden Theme Applied
