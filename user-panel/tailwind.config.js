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
        bgDark: '#000000',
        bgSurface: '#0a0a0a',
        bgCard: 'rgba(12, 12, 12, 0.85)',
        bgCardElevated: 'rgba(22, 22, 22, 0.85)',
        primary: '#06b6d4',
        primaryLight: '#22d3ee',
        primaryDark: '#0891b2',
        cyan: '#06b6d4',
        cyanLight: '#22d3ee',
        emerald: '#10b981',
        emeraldLight: '#34d399',
        rose: '#f43f5e',
        roseLight: '#fb7185',
        amber: '#f59e0b',
        amberLight: '#fbbf24',
        violet: '#8b5cf6',
        violetLight: '#a78bfa',
        textPrimary: '#ffffff',
        textSecondary: '#a1a1aa',
        textMuted: '#71717a',
      },
    },
  },
  plugins: [],
};
