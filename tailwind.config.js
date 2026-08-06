/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'cyan-400': '#22d3ee',
        'cyan-500': '#06b6d4',
        'blue-500': '#3b82f6',
        'blue-600': '#2563eb',
        'purple-700': '#7e22ce',
      }
    },
  },
  plugins: [],
}
