// BioSyncAI — Dark Theme Design Tokens (Pure black, clinical glassmorphism)
export const darkColors = {
  // Pure black base
  bgDark:         '#000000',
  bgSurface:      '#080808',
  bgCard:         'rgba(12, 12, 16, 0.88)',
  bgCardElevated: 'rgba(20, 20, 26, 0.90)',
  bgCardSurface:  'rgba(26, 26, 34, 0.92)',
  bgGlass:        'rgba(255, 255, 255, 0.03)',
  bgGlassStrong:  'rgba(255, 255, 255, 0.07)',

  // Primary clinical accents
  primary:      '#06b6d4',
  primaryLight: '#22d3ee',
  primaryDark:  '#0891b2',
  primaryGlow:  'rgba(6, 182, 212, 0.22)',
  cyan:         '#06b6d4',
  cyanLight:    '#22d3ee',
  cyanGlow:     'rgba(6, 182, 212, 0.22)',

  // Health / success
  emerald:      '#10b981',
  emeraldLight: '#34d399',
  emeraldDark:  '#059669',
  emeraldGlow:  'rgba(16, 185, 129, 0.18)',

  // En route / progress
  amber:      '#f59e0b',
  amberLight: '#fbbf24',
  amberDark:  '#d97706',
  amberGlow:  'rgba(245, 158, 11, 0.18)',

  // Alert / critical
  rose:      '#f43f5e',
  roseLight: '#fb7185',
  roseDark:  '#e11d48',
  roseGlow:  'rgba(244, 63, 94, 0.18)',

  // AI / pathologist
  violet:      '#8b5cf6',
  violetLight: '#a78bfa',
  violetDark:  '#7c3aed',
  violetGlow:  'rgba(139, 92, 246, 0.18)',

  blue:      '#3b82f6',
  blueLight: '#60a5fa',
  blueDark:  '#2563eb',
  blueGlow:  'rgba(59, 130, 246, 0.18)',

  // Text
  textPrimary:   '#f9fafb',
  textSecondary: '#9ca3af',
  textMuted:     '#6b7280',
  textCyan:      '#22d3ee',
  textInverse:   '#000000',

  // Borders
  border:          'rgba(255, 255, 255, 0.07)',
  borderSubtle:    'rgba(255, 255, 255, 0.07)',
  borderMedium:    'rgba(255, 255, 255, 0.12)',
  borderLight:     'rgba(255, 255, 255, 0.12)',
  borderActive:    'rgba(6, 182, 212, 0.38)',
  borderCyan:      'rgba(6, 182, 212, 0.20)',
  borderCyanStrong:'rgba(6, 182, 212, 0.40)',

  // Gradients
  cardGradient:         ['rgba(14, 14, 18, 0.94)', 'rgba(8, 8, 10, 0.96)'],
  cardGradientCyan:     ['rgba(6, 182, 212, 0.10)', 'rgba(8, 8, 10, 0.96)'],
  cardGradientEmerald:  ['rgba(16, 185, 129, 0.10)', 'rgba(8, 8, 10, 0.96)'],
  cardGradientAmber:    ['rgba(245, 158, 11, 0.10)', 'rgba(8, 8, 10, 0.96)'],
  cardGradientViolet:   ['rgba(139, 92, 246, 0.10)', 'rgba(8, 8, 10, 0.96)'],
  headerGradient:       ['#000000', '#060608'],
  accentButtonGradient: ['#06b6d4', '#0891b2'],
  emeraldButtonGradient:['#10b981', '#059669'],

  // Status
  neutral: {
    textPrimary:   '#f9fafb',
    textSecondary: '#9ca3af',
    textMuted:     '#6b7280',
    border:        'rgba(255,255,255,0.07)',
    borderLight:   'rgba(255,255,255,0.12)',
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
  glass:          'rgba(255, 255, 255, 0.03)',
  glassStrong:    'rgba(255, 255, 255, 0.07)',
  alphaCyan10:    'rgba(6, 182, 212, 0.10)',
  alphaEmerald10: 'rgba(16, 185, 129, 0.10)',
  navyCard:       'rgba(12, 12, 16, 0.88)',
  navyElevated:   'rgba(20, 20, 26, 0.90)',
  navyDark:       '#000000',
};

export const darkGradients = {
  cyanBlue:     ['#06b6d4', '#3b82f6'],
  emeraldTeal:  ['#10b981', '#06b6d4'],
  amberOrange:  ['#f59e0b', '#f97316'],
  cardDark:     ['rgba(14,14,18,0.94)', 'rgba(8,8,10,0.96)'],
  headerDark:   ['#000000', '#060608'],
};

export const darkShadows = {
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
    shadowOpacity: 0.40,
    shadowRadius: 12,
    elevation: 6,
  },
  glowEmerald: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.40,
    shadowRadius: 12,
    elevation: 6,
  },
};
