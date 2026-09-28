// BioSyncAI Unified Medical Tech Color Tokens
export const colors = {
  // Brand & Primary
  primary: '#06b6d4',
  primaryLight: '#22d3ee',
  primaryDark: '#0891b2',
  primaryGlow: 'rgba(6, 182, 212, 0.25)',
  cyan: '#06b6d4',
  cyanLight: '#22d3ee',

  // Accents
  emerald: '#10b981',       // Success / Available / Collected
  emeraldLight: '#34d399',
  emeraldGlow: 'rgba(16, 185, 129, 0.2)',
  
  amber: '#f59e0b',         // Warning / In-progress / Pending
  amberLight: '#fbbf24',
  amberGlow: 'rgba(245, 158, 11, 0.2)',

  rose: '#ef4444',          // Danger / Rejected / Failed
  roseLight: '#f87171',
  roseGlow: 'rgba(239, 68, 68, 0.2)',

  violet: '#8b5cf6',        // Intelligence / AI
  violetLight: '#a78bfa',

  // Dark Theme Base — TRUE BLACK
  bgDark: '#000000',
  navyDark: '#000000',
  bgSurface: '#0a0a0a',
  bgCard: 'rgba(12, 12, 12, 0.85)',
  navyCard: 'rgba(12, 12, 12, 0.85)',
  bgCardElevated: 'rgba(22, 22, 22, 0.85)',
  navyElevated: 'rgba(22, 22, 22, 0.85)',
  bgGlass: 'rgba(255, 255, 255, 0.03)',
  
  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.14)',
  borderActive: 'rgba(6, 182, 212, 0.4)',

  // Typography
  textPrimary: '#f8fafc',    // Slate 50
  textSecondary: '#94a3b8',  // Slate 400
  textMuted: '#64748b',      // Slate 500
  textCyan: '#22d3ee',

  // Nested structures for components using namespaced paths
  neutral: {
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.14)',
    bg: '#000000',
  },

  status: {
    collected: '#10b981',
    inTransit: '#06b6d4',
    failed: '#ef4444',
    pending: '#f59e0b',
  },

  accent: {
    amber: '#f59e0b',
    cyan: '#06b6d4',
    emerald: '#10b981',
    rose: '#ef4444',
  },

  // Gradients for linear-gradient — true black base
  cardGradient: ['rgba(12, 12, 12, 0.9)', 'rgba(8, 8, 8, 0.85)'],
  cardGradientCyan: ['rgba(6, 182, 212, 0.1)', 'rgba(8, 8, 8, 0.9)'],
  cardGradientEmerald: ['rgba(16, 185, 129, 0.1)', 'rgba(8, 8, 8, 0.9)'],
  cardGradientAmber: ['rgba(245, 158, 11, 0.1)', 'rgba(8, 8, 8, 0.9)'],
  headerGradient: ['#000000', '#0a0a0a'],
  accentButtonGradient: ['#06b6d4', '#0891b2'],
  emeraldButtonGradient: ['#10b981', '#059669'],
};

export const gradients = {
  cyanBlue: ['#06b6d4', '#3b82f6'],
  emeraldTeal: ['#10b981', '#06b6d4'],
  amberOrange: ['#f59e0b', '#f97316'],
  cardDark: ['rgba(12, 12, 12, 0.9)', 'rgba(8, 8, 8, 0.85)'],
  headerDark: ['#000000', '#0a0a0a'],
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  glowCyan: {
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
};

export default colors;
