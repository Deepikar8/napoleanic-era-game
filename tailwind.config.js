/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#f5f0e6',
        parchmentDark: '#e8dfc3',
        ink: '#2a2018',
        french: '#2c5aa0',
        austrian: '#ece4d0',
        russian: '#4a7a4a',
        gilt: '#d4a017',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Iowan Old Style"', '"Palatino Linotype"', 'Georgia', 'serif'],
        ui: ['"Cormorant Garamond"', '"Iowan Old Style"', '"Palatino Linotype"', 'Georgia', 'serif'],
        mono: ['"Courier Prime"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
};
