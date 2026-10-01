/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bgDark: '#0a0a0c',
        bgDeep: '#050507',
        bgSurface: '#121214',
        bgCard: 'rgba(16, 16, 20, 0.65)',
        bgCardElevated: '#1a1a20',
        primary: '#0891b2',
        primaryLight: '#06b6d4',
        primaryDark: '#155e75',
        cyan: '#06b6d4',
        cyanLight: '#22d3ee',
        emerald: '#10b981',
        emeraldLight: '#34d399',
        rose: '#f43f5e',
        roseLight: '#fb7185',
        amber: '#f59e0b',
        amberLight: '#fbbf24',
        purple: '#a855f7',
        purpleLight: '#c084fc',
        blueLight: '#60a5fa',
        textPrimary: '#ffffff',
        textSecondary: '#a3a3a3',
        textMuted: '#737373',
      },
    },
  },
  plugins: [],
};
