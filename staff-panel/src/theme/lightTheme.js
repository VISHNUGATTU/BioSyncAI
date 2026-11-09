// BioSyncAI Staff Panel — Light Theme Clinical Design Tokens (Daylight Clinical Grade)
export const lightAlpha = {
  cyan05: 'rgba(8, 145, 178, 0.06)',
  cyan08: 'rgba(8, 145, 178, 0.09)',
  cyan10: 'rgba(8, 145, 178, 0.11)',
  cyan15: 'rgba(8, 145, 178, 0.16)',
  cyan20: 'rgba(8, 145, 178, 0.22)',
  cyan30: 'rgba(8, 145, 178, 0.32)',

  emerald10: 'rgba(5, 150, 105, 0.11)',
  emerald15: 'rgba(5, 150, 105, 0.16)',
  emerald20: 'rgba(5, 150, 105, 0.22)',
  emerald30: 'rgba(5, 150, 105, 0.32)',

  amber10: 'rgba(217, 119, 6, 0.11)',
  amber20: 'rgba(217, 119, 6, 0.22)',

  rose10:  'rgba(225, 29, 72, 0.10)',
  rose20:  'rgba(225, 29, 72, 0.22)',

  purple10: 'rgba(124, 58, 237, 0.10)',
  purple20: 'rgba(124, 58, 237, 0.22)',

  white04: '#F8FAFC',
  white06: '#F1F5F9',
  white08: '#E2E8F0',
  white12: '#CBD5E1',
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
  purple:   ['#7C3AED', '#6D28D9'],

  cardGradient:        ['#FFFFFF', '#F8FAFC'],
  cardGradientCyan:    ['rgba(8, 145, 178, 0.10)', 'rgba(255, 255, 255, 0.98)'],
  cardGradientEmerald: ['rgba(5, 150, 105, 0.10)', 'rgba(255, 255, 255, 0.98)'],
  cardGradientAmber:   ['rgba(217, 119, 6, 0.10)', 'rgba(255, 255, 255, 0.98)'],
};

export const lightShadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 8,
  },
};

export const lightColors = {
  // Brand — High-contrast Clinical Teal/Cyan for WCAG AA readability on white
  primary:      '#0891B2',
  primaryLight: '#0891B2',
  primaryDark:  '#0E7490',
  primaryGlow:  'rgba(8, 145, 178, 0.16)',
  cyan:         '#0891B2',
  cyanLight:    '#0891B2',
  cyanDark:     '#0E7490',

  // Backgrounds — Clinical Alabaster & Pure White Card Elevation
  bgDark:          '#F1F5F9', // Slate 100 canvas so pure white cards pop
  bgDeep:          '#E2E8F0', // Slate 200
  bgSurface:       '#FFFFFF', // Pure White surface
  bgCard:          '#FFFFFF',
  bgCardElevated:  '#FFFFFF',
  bgCardSoft:      '#F8FAFC',
  bgInput:         '#F8FAFC',
  bgGlass:         'rgba(241, 245, 249, 0.85)',
  bgGlassMed:      'rgba(226, 232, 240, 0.70)',

  // Text — Ultra-crisp Slate Typography
  textPrimary:   '#0F172A', // Slate 900
  textSecondary: '#334155', // Slate 700
  textMuted:     '#64748B', // Slate 500
  textDisabled:  '#94A3B8', // Slate 400
  textInverse:   '#FFFFFF',
  textDim:       '#64748B',
  textCyan:      '#0891B2',

  // Borders — Crisp Clinical Division Lines
  borderSubtle:      '#E2E8F0', // Slate 200
  borderDefault:     '#CBD5E1', // Slate 300
  borderStrong:      '#94A3B8', // Slate 400
  borderCyan:        'rgba(8, 145, 178, 0.28)',
  borderCyanStrong:  'rgba(8, 145, 178, 0.50)',

  // Status Colors — Tuned for crisp contrast on white surfaces
  emerald:      '#059669',
  emeraldLight: '#059669',
  emeraldDark:  '#047857',
  emeraldGlow:  'rgba(5, 150, 105, 0.15)',

  amber:      '#D97706',
  amberLight: '#D97706',
  amberDark:  '#B45309',
  amberGlow:  'rgba(217, 119, 6, 0.15)',

  rose:      '#E11D48',
  roseLight: '#E11D48',
  roseDark:  '#BE123C',
  roseGlow:  'rgba(225, 29, 72, 0.15)',

  blue:      '#2563EB',
  blueLight: '#2563EB',
  blueDark:  '#1D4ED8',
  blueGlow:  'rgba(37, 99, 235, 0.15)',

  purple:      '#7C3AED',
  purpleLight: '#7C3AED',
  purpleDark:  '#6D28D9',
  purpleGlow:  'rgba(124, 58, 237, 0.15)',

  violet:      '#7C3AED',
  violetLight: '#7C3AED',
  violetDark:  '#6D28D9',
  violetGlow:  'rgba(124, 58, 237, 0.15)',

  indigo:      '#4F46E5',
  indigoLight: '#4F46E5',
  indigoDark:  '#3730A3',
  indigoGlow:  'rgba(79, 70, 229, 0.15)',

  // Overlays
  overlay:       'rgba(15, 23, 42, 0.45)',
  overlayStrong: 'rgba(15, 23, 42, 0.68)',
  overlayLight:  'rgba(15, 23, 42, 0.20)',

  // Shadows
  shadow:        '#0F172A',
  shadowCyan:    '#0891B2',
  shadowEmerald: '#059669',

  // Legacy & Alpha Aliases
  glass:          '#F8FAFC',
  glassStrong:    '#F1F5F9',
  alphaCyan05:    'rgba(8, 145, 178, 0.06)',
  alphaCyan08:    'rgba(8, 145, 178, 0.09)',
  alphaCyan10:    'rgba(8, 145, 178, 0.11)',
  alphaCyan15:    'rgba(8, 145, 178, 0.16)',
  alphaCyan20:    'rgba(8, 145, 178, 0.22)',
  alphaCyan30:    'rgba(8, 145, 178, 0.32)',
  alphaEmerald10: 'rgba(5, 150, 105, 0.11)',
  alphaEmerald15: 'rgba(5, 150, 105, 0.16)',
  alphaEmerald20: 'rgba(5, 150, 105, 0.22)',
  alphaEmerald30: 'rgba(5, 150, 105, 0.32)',
  alphaAmber10:   'rgba(217, 119, 6, 0.11)',
  alphaAmber20:   'rgba(217, 119, 6, 0.22)',
  alphaRose10:    'rgba(225, 29, 72, 0.10)',
  alphaRose20:    'rgba(225, 29, 72, 0.22)',
  alphaPurple10:  'rgba(124, 58, 237, 0.10)',
  alphaPurple20:  'rgba(124, 58, 237, 0.22)',
  alphaViolet10:  'rgba(124, 58, 237, 0.10)',
  alphaViolet20:  'rgba(124, 58, 237, 0.22)',
  alphaBlue10:    'rgba(37, 99, 235, 0.10)',
  alphaBlue20:    'rgba(37, 99, 235, 0.22)',
  navyCard:       '#FFFFFF',
  navyElevated:   '#F8FAFC',

  // Gradient Aliases for direct colors.cardGradient* access
  cardGradient:        lightGradients.cardGradient,
  cardGradientCyan:    lightGradients.cardGradientCyan,
  cardGradientEmerald: lightGradients.cardGradientEmerald,
  cardGradientAmber:   lightGradients.cardGradientAmber,

  // Nested alpha reference
  alpha: lightAlpha,

  // Semantic Status Aliases
  success:        '#059669',
  successLight:   '#059669',
  danger:         '#E11D48',
  dangerLight:    '#E11D48',
  warning:        '#D97706',
  warningLight:   '#D97706',
  info:           '#2563EB',
  infoLight:      '#2563EB',
};
