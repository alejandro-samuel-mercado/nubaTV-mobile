/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'cyan-400': '#ffb703', // was cyan, now light orange/amber
        'cyan-500': '#ff9100', // was cyan, now orange
        'cyan-600': '#ff5500', // added for darker orange
        'blue-500': '#facc15', // was blue, now yellow/gold
        'blue-600': '#fbbf24', // was blue, now yellow/gold
        'purple-700': '#b45309', // was purple, now dark amber
        'bg-base': 'var(--bg-base)',
        'bg-panel': 'var(--bg-panel)',
        'text-base': 'var(--text-base)',
        'text-muted': 'var(--text-muted)',
        'border-subtle': 'var(--border-subtle)',
      }
    },
  },
  plugins: [],
}
