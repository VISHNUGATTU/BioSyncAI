// BioSyncAI — Light Theme Design Tokens (Crisp medical white/slate, high contrast)
export const lightColors = {
  // Pure/soft clinical white base
  bgDark:         '#f8fafc', // Screen background
  bgSurface:      '#ffffff', // Cards, surfaces
  bgCard:         '#ffffff',
  bgCardElevated: '#ffffff',
  bgCardSurface:  '#f1f5f9',
  bgGlass:        'rgba(241, 245, 249, 0.85)',
  bgGlassStrong:  'rgba(226, 232, 240, 0.90)',

  // Primary clinical accents (darkened slightly for WCAG contrast on white)
  primary:      '#0891b2',
  primaryLight: '#06b6d4',
  primaryDark:  '#0e7490',
  primaryGlow:  'rgba(8, 145, 178, 0.15)',
  cyan:         '#0891b2',
  cyanLight:    '#06b6d4',
  cyanGlow:     'rgba(8, 145, 178, 0.15)',

  // Health / success
  emerald:      '#059669',
  emeraldLight: '#10b981',
  emeraldDark:  '#047857',
  emeraldGlow:  'rgba(5, 150, 105, 0.15)',

  // En route / progress
  amber:      '#d97706',
  amberLight: '#f59e0b',
  amberDark:  '#b45309',
  amberGlow:  'rgba(217, 119, 6, 0.15)',

  // Alert / critical
  rose:      '#e11d48',
  roseLight: '#f43f5e',
  roseDark:  '#be123c',
  roseGlow:  'rgba(225, 29, 72, 0.15)',

  // AI / pathologist
  violet:      '#7c3aed',
  violetLight: '#8b5cf6',
  violetDark:  '#6d28d9',
  violetGlow:  'rgba(124, 58, 237, 0.15)',

  blue:      '#2563eb',
  blueLight: '#3b82f6',
  blueDark:  '#1d4ed8',
  blueGlow:  'rgba(37, 99, 235, 0.15)',

  // Text (crisp slate shades)
  textPrimary:   '#0f172a', // Deep slate for primary headings and values
  textSecondary: '#475569', // Medium slate for subtitles and labels
  textMuted:     '#64748b', // Muted slate
  textCyan:      '#0891b2',
  textInverse:   '#ffffff',

  // Borders
  border:          '#e2e8f0',
  borderSubtle:    '#e2e8f0',
  borderMedium:    '#cbd5e1',
  borderLight:     '#f1f5f9',
  borderActive:    'rgba(8, 145, 178, 0.40)',
  borderCyan:      'rgba(8, 145, 178, 0.20)',
  borderCyanStrong:'rgba(8, 145, 178, 0.40)',

  // Gradients
  cardGradient:         ['#ffffff', '#f8fafc'],
  cardGradientCyan:     ['rgba(8, 145, 178, 0.08)', '#ffffff'],
  cardGradientEmerald:  ['rgba(5, 150, 105, 0.08)', '#ffffff'],
  cardGradientAmber:    ['rgba(217, 119, 6, 0.08)', '#ffffff'],
  cardGradientViolet:   ['rgba(124, 58, 237, 0.08)', '#ffffff'],
  headerGradient:       ['#ffffff', '#f1f5f9'],
  accentButtonGradient: ['#0891b2', '#0e7490'],
  emeraldButtonGradient:['#059669', '#047857'],

  // Status
  neutral: {
    textPrimary:   '#0f172a',
    textSecondary: '#475569',
    textMuted:     '#64748b',
    border:        '#e2e8f0',
    borderLight:   '#f1f5f9',
    bg:            '#f8fafc',
  },

  status: {
    collected: '#059669',
    inTransit: '#0891b2',
    failed:    '#e11d48',
    pending:   '#d97706',
  },

  accent: {
    amber:   '#d97706',
    cyan:    '#0891b2',
    emerald: '#059669',
    rose:    '#e11d48',
    violet:  '#7c3aed',
  },

  // Backward-compatible aliases
  glass:          'rgba(241, 245, 249, 0.70)',
  glassStrong:    'rgba(226, 232, 240, 0.90)',
  alphaCyan10:    'rgba(8, 145, 178, 0.08)',
  alphaEmerald10: 'rgba(5, 150, 105, 0.08)',
  navyCard:       '#ffffff',
  navyElevated:   '#ffffff',
  navyDark:       '#f8fafc',
};

export const lightGradients = {
  cyanBlue:     ['#0891b2', '#2563eb'],
  emeraldTeal:  ['#059669', '#0891b2'],
  amberOrange:  ['#d97706', '#ea580c'],
  cardDark:     ['#ffffff', '#f8fafc'],
  headerDark:   ['#ffffff', '#f1f5f9'],
};

export const lightShadows = {
  sm: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
  },
  glowCyan: {
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  glowEmerald: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
};
