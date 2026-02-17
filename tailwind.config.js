/** @type {import('tailwindcss').Config} */
module.exports = {
  // Тук казваме къде ще ползваме класовете
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brown: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          500: '#a1887f',
          800: '#4e342e',
          900: '#3e2723', // Тъмно кафяво
        },
        gold: '#ffd700', // За короната
      }
    },
  },
  plugins: [],
}