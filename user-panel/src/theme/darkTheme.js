// BioSyncAI — Dark Theme Design Tokens (Apple Health / Ultrahuman / WHOOP Luxury Obsidian Glassmorphism)
export const darkColors = {
  // Pure obsidian base
  bgDark:         '#000000',
  background:     '#000000',
  bgSurface:      '#08090c',
  bgCard:         'rgba(14, 16, 22, 0.92)',
  bgCardElevated: 'rgba(18, 20, 28, 0.94)',
  bgCardSurface:  'rgba(24, 28, 38, 0.94)',
  cardSecondary:  'rgba(24, 28, 38, 0.85)',
  bgGlass:        'rgba(255, 255, 255, 0.04)',
  bgGlassStrong:  'rgba(255, 255, 255, 0.08)',

  // Primary clinical accents
  primary:      '#06b6d4',
  primaryLight: '#22d3ee',
  primaryDark:  '#0891b2',
  primaryGlow:  'rgba(6, 182, 212, 0.24)',
  cyan:         '#06b6d4',
  cyanLight:    '#22d3ee',
  cyanGlow:     'rgba(6, 182, 212, 0.24)',

  // Health / success
  emerald:      '#10b981',
  emeraldLight: '#34d399',
  emeraldDark:  '#059669',
  emeraldGlow:  'rgba(16, 185, 129, 0.20)',

  // En route / progress
  amber:      '#f59e0b',
  amberLight: '#fbbf24',
  amberDark:  '#d97706',
  amberGlow:  'rgba(245, 158, 11, 0.20)',

  // Alert / critical
  rose:      '#f43f5e',
  roseLight: '#fb7185',
  roseDark:  '#e11d48',
  roseGlow:  'rgba(244, 63, 94, 0.20)',

  // AI / pathologist
  violet:      '#8b5cf6',
  violetLight: '#a78bfa',
  purpleLight: '#a78bfa',
  violetDark:  '#7c3aed',
  violetGlow:  'rgba(139, 92, 246, 0.20)',

  blue:      '#3b82f6',
  blueLight: '#60a5fa',
  blueDark:  '#2563eb',
  blueGlow:  'rgba(59, 130, 246, 0.20)',

  // Text
  textPrimary:   '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted:     '#64748b',
  textCyan:      '#22d3ee',
  textInverse:   '#000000',

  // Borders
  border:          'rgba(255, 255, 255, 0.09)',
  borderSubtle:    'rgba(255, 255, 255, 0.08)',
  borderMedium:    'rgba(255, 255, 255, 0.14)',
  borderLight:     'rgba(255, 255, 255, 0.12)',
  borderActive:    'rgba(6, 182, 212, 0.42)',
  borderCyan:      'rgba(6, 182, 212, 0.22)',
  borderCyanStrong:'rgba(6, 182, 212, 0.44)',

  // Gradients
  cardGradient:         ['rgba(18, 20, 28, 0.96)', 'rgba(10, 12, 16, 0.98)'],
  cardGradientCyan:     ['rgba(6, 182, 212, 0.14)', 'rgba(10, 12, 16, 0.98)'],
  cardGradientEmerald:  ['rgba(16, 185, 129, 0.14)', 'rgba(10, 12, 16, 0.98)'],
  cardGradientAmber:    ['rgba(245, 158, 11, 0.14)', 'rgba(10, 12, 16, 0.98)'],
  cardGradientViolet:   ['rgba(139, 92, 246, 0.14)', 'rgba(10, 12, 16, 0.98)'],
  headerGradient:       ['#000000', '#08090c'],
  accentButtonGradient: ['#06b6d4', '#0891b2'],
  emeraldButtonGradient:['#10b981', '#059669'],

  // Status
  neutral: {
    textPrimary:   '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted:     '#64748b',
    border:        'rgba(255,255,255,0.08)',
    borderLight:   'rgba(255,255,255,0.14)',
    bg:            '#000000',
  },

  status: {
    collected: '#10b981',
    inTransit: '#06b6d4',
    failed:    '#ef4444',
    pending:   '#f59e0b',
  },

  accent: {
    amber:   '#f59e0b',
    cyan:    '#06b6d4',
    emerald: '#10b981',
    rose:    '#f43f5e',
    violet:  '#8b5cf6',
  },

  // Backward-compatible aliases
  glass:          'rgba(255, 255, 255, 0.04)',
  glassStrong:    'rgba(255, 255, 255, 0.08)',
  alphaCyan10:    'rgba(6, 182, 212, 0.12)',
  alphaEmerald10: 'rgba(16, 185, 129, 0.12)',
  navyCard:       'rgba(14, 16, 22, 0.92)',
  navyElevated:   'rgba(18, 20, 28, 0.94)',
  navyDark:       '#000000',
};

export const darkGradients = {
  cyanBlue:     ['#06b6d4', '#3b82f6'],
  emeraldTeal:  ['#10b981', '#06b6d4'],
  amberOrange:  ['#f59e0b', '#f97316'],
  cardDark:     ['rgba(18,20,28,0.96)', 'rgba(10,12,16,0.98)'],
  headerDark:   ['#000000', '#08090c'],
};

export const darkShadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  glowCyan: {
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.42,
    shadowRadius: 14,
    elevation: 6,
  },
  glowEmerald: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.42,
    shadowRadius: 14,
    elevation: 6,
  },
};
