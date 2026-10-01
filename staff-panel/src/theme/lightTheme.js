// BioSyncAI Staff Panel — Light Theme Clinical Design Tokens
export const lightColors = {
  // Brand — Darkened for WCAG AA compliance against clinical white backgrounds
  primary:      '#0891B2',
  primaryLight: '#06B6D4',
  primaryDark:  '#0E7490',
  primaryGlow:  'rgba(8, 145, 178, 0.15)',
  cyan:         '#0891B2',
  cyanLight:    '#06B6D4',
  cyanDark:     '#0E7490',

  // Backgrounds — Clinical slate-white hierarchy
  bgDark:          '#F8FAFC', // Slate 50
  bgDeep:          '#F1F5F9', // Slate 100
  bgSurface:       '#FFFFFF', // Pure White
  bgCard:          '#FFFFFF',
  bgCardElevated:  '#FFFFFF',
  bgCardSoft:      '#F8FAFC',
  bgGlass:         'rgba(255, 255, 255, 0.92)',
  bgGlassMed:      'rgba(255, 255, 255, 0.96)',

  // Text — High contrast slate typography
  textPrimary:   '#0F172A', // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted:     '#64748B', // Slate 500
  textDisabled:  '#94A3B8', // Slate 400
  textInverse:   '#FFFFFF',
  textDim:       '#64748B',
  textCyan:      '#0891B2',

  // Borders — Crisp clinical division lines
  borderSubtle:      '#E2E8F0', // Slate 200
  borderDefault:     '#CBD5E1', // Slate 300
  borderStrong:      '#94A3B8', // Slate 400
  borderCyan:        'rgba(8, 145, 178, 0.25)',
  borderCyanStrong:  'rgba(8, 145, 178, 0.50)',

  // Status Colors
  emerald:      '#059669',
  emeraldLight: '#10B981',
  emeraldDark:  '#047857',
  emeraldGlow:  'rgba(5, 150, 105, 0.15)',

  amber:      '#D97706',
  amberLight: '#F59E0B',
  amberGlow:  'rgba(217, 119, 6, 0.15)',

  rose:      '#E11D48',
  roseLight: '#F43F5E',
  roseGlow:  'rgba(225, 29, 72, 0.15)',

  blue:      '#2563EB',
  blueLight: '#3B82F6',
  blueGlow:  'rgba(37, 99, 235, 0.15)',

  purple:      '#7C3AED',
  purpleLight: '#8B5CF6',
  purpleGlow:  'rgba(124, 58, 237, 0.15)',

  // Overlays
  overlay:       'rgba(15, 23, 42, 0.45)',
  overlayStrong: 'rgba(15, 23, 42, 0.70)',
  overlayLight:  'rgba(15, 23, 42, 0.20)',

  // Shadows
  shadow:        '#64748B',
  shadowCyan:    '#0891B2',
  shadowEmerald: '#059669',

  // Legacy Aliases
  glass:          'rgba(255, 255, 255, 0.88)',
  glassStrong:    '#FFFFFF',
  alphaCyan10:    'rgba(8, 145, 178, 0.10)',
  alphaCyan15:    'rgba(8, 145, 178, 0.15)',
  alphaEmerald10: 'rgba(5, 150, 105, 0.10)',
  alphaEmerald15: 'rgba(5, 150, 105, 0.15)',
  alphaEmerald20: 'rgba(5, 150, 105, 0.20)',
  alphaEmerald30: 'rgba(5, 150, 105, 0.30)',
  alphaAmber10:   'rgba(217, 119, 6, 0.10)',
  alphaAmber20:   'rgba(217, 119, 6, 0.20)',
  alphaRose10:    'rgba(225, 29, 72, 0.10)',
  alphaRose20:    'rgba(225, 29, 72, 0.20)',
  alphaPurple10:  'rgba(124, 58, 237, 0.10)',
  alphaPurple20:  'rgba(124, 58, 237, 0.20)',
  navyCard:       '#FFFFFF',
  navyElevated:   '#F8FAFC',

  // Semantic Status Aliases
  success:        '#059669',
  successLight:   '#10B981',
  danger:         '#E11D48',
  dangerLight:    '#F43F5E',
  warning:        '#D97706',
  warningLight:   '#F59E0B',
  info:           '#2563EB',
  infoLight:      '#3B82F6',
};

export const lightGradients = {
  cyan:     ['#0891B2', '#0E7490'],
  cyanDeep: ['#0E7490', '#155E75'],
  cyanBlue: ['#0891B2', '#2563EB'],

  dark:     ['#FFFFFF', '#F8FAFC'],
  darkDeep: ['#F8FAFC', '#F1F5F9'],

  emerald:  ['#059669', '#047857'],
  amber:    ['#D97706', '#B45309'],
  rose:     ['#E11D48', '#BE123C'],
  blue:     ['#2563EB', '#1D4ED8'],

  cardGradient:        ['#FFFFFF', '#F8FAFC'],
  cardGradientCyan:    ['rgba(8, 145, 178, 0.08)', 'rgba(8, 145, 178, 0.01)'],
  cardGradientEmerald: ['rgba(5, 150, 105, 0.08)', 'rgba(5, 150, 105, 0.01)'],
  cardGradientAmber:   ['rgba(217, 119, 6, 0.08)', 'rgba(217, 119, 6, 0.01)'],
};

export const lightAlpha = {
  cyan10: 'rgba(8, 145, 178, 0.10)',
  cyan15: 'rgba(8, 145, 178, 0.15)',
  cyan20: 'rgba(8, 145, 178, 0.20)',
  cyan30: 'rgba(8, 145, 178, 0.30)',

  emerald10: 'rgba(5, 150, 105, 0.10)',
  emerald15: 'rgba(5, 150, 105, 0.15)',
  emerald30: 'rgba(5, 150, 105, 0.30)',

  amber10: 'rgba(217, 119, 6, 0.10)',
  rose10:  'rgba(225, 29, 72, 0.10)',

  white04: '#F1F5F9',
  white06: '#E2E8F0',
  white08: '#CBD5E1',
  white12: '#94A3B8',
};

export const lightShadows = {
  sm: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};
