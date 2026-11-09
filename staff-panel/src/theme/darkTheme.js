// BioSyncAI Staff Panel — Dark Theme Design Tokens (Obsidian Clinical Grade)
export const darkAlpha = {
  cyan05: 'rgba(6, 182, 212, 0.06)',
  cyan08: 'rgba(6, 182, 212, 0.09)',
  cyan10: 'rgba(6, 182, 212, 0.12)',
  cyan15: 'rgba(6, 182, 212, 0.18)',
  cyan20: 'rgba(6, 182, 212, 0.24)',
  cyan30: 'rgba(6, 182, 212, 0.34)',

  emerald10: 'rgba(16, 185, 129, 0.12)',
  emerald15: 'rgba(16, 185, 129, 0.18)',
  emerald20: 'rgba(16, 185, 129, 0.24)',
  emerald30: 'rgba(16, 185, 129, 0.34)',

  amber10: 'rgba(245, 158, 11, 0.12)',
  amber20: 'rgba(245, 158, 11, 0.24)',

  rose10:  'rgba(244, 63, 94, 0.12)',
  rose20:  'rgba(244, 63, 94, 0.24)',

  purple10: 'rgba(139, 92, 246, 0.12)',
  purple20: 'rgba(139, 92, 246, 0.24)',

  white04: 'rgba(255, 255, 255, 0.04)',
  white06: 'rgba(255, 255, 255, 0.07)',
  white08: 'rgba(255, 255, 255, 0.10)',
  white12: 'rgba(255, 255, 255, 0.14)',
};

export const darkGradients = {
  cyan:     ['#06B6D4', '#0891B2'],
  cyanDeep: ['#0891B2', '#164E63'],
  cyanBlue: ['#06B6D4', '#3B82F6'],

  dark:     ['#0C121E', '#060A12'],
  darkDeep: ['#060A12', '#020408'],

  emerald:  ['#10B981', '#059669'],
  amber:    ['#F59E0B', '#D97706'],
  rose:     ['#F43F5E', '#E11D48'],
  blue:     ['#3B82F6', '#2563EB'],
  purple:   ['#8B5CF6', '#6D28D9'],

  cardGradient:        ['rgba(15, 23, 38, 0.96)', 'rgba(10, 15, 26, 0.98)'],
  cardGradientCyan:    ['rgba(6, 182, 212, 0.14)', 'rgba(12, 18, 30, 0.96)'],
  cardGradientEmerald: ['rgba(16, 185, 129, 0.14)', 'rgba(12, 18, 30, 0.96)'],
  cardGradientAmber:   ['rgba(245, 158, 11, 0.14)', 'rgba(12, 18, 30, 0.96)'],
};

export const darkShadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.50,
    shadowRadius: 22,
    elevation: 10,
  },
};

export const darkColors = {
  // Brand
  primary:      '#06B6D4',
  primaryLight: '#22D3EE',
  primaryDark:  '#0891B2',
  primaryGlow:  'rgba(6, 182, 212, 0.22)',
  cyan:         '#06B6D4',
  cyanLight:    '#22D3EE',
  cyanDark:     '#0891B2',

  // Backgrounds — Deep Obsidian Slate Hierarchy
  bgDark:          '#030712',
  bgDeep:          '#02040A',
  bgSurface:       '#080D18',
  bgCard:          '#0C1220',
  bgCardElevated:  '#111827',
  bgCardSoft:      '#161F33',
  bgInput:         '#090E1A',
  bgGlass:         'rgba(255, 255, 255, 0.04)',
  bgGlassMed:      'rgba(255, 255, 255, 0.07)',

  // Text
  textPrimary:   '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted:     '#64748B',
  textDisabled:  '#475569',
  textInverse:   '#020617',
  textDim:       '#64748B',
  textCyan:      '#22D3EE',

  // Borders
  borderSubtle:      'rgba(148, 163, 184, 0.12)',
  borderDefault:     'rgba(148, 163, 184, 0.18)',
  borderStrong:      'rgba(148, 163, 184, 0.28)',
  borderCyan:        'rgba(6, 182, 212, 0.26)',
  borderCyanStrong:  'rgba(34, 211, 238, 0.45)',

  // Status
  emerald:      '#10B981',
  emeraldLight: '#34D399',
  emeraldDark:  '#059669',
  emeraldGlow:  'rgba(16, 185, 129, 0.20)',

  amber:      '#F59E0B',
  amberLight: '#FBBF24',
  amberDark:  '#D97706',
  amberGlow:  'rgba(245, 158, 11, 0.20)',

  rose:      '#F43F5E',
  roseLight: '#FB7185',
  roseDark:  '#BE123C',
  roseGlow:  'rgba(244, 63, 94, 0.20)',

  blue:      '#3B82F6',
  blueLight: '#60A5FA',
  blueDark:  '#2563EB',
  blueGlow:  'rgba(59, 130, 246, 0.20)',

  purple:      '#8B5CF6',
  purpleLight: '#A78BFA',
  purpleDark:  '#6D28D9',
  purpleGlow:  'rgba(139, 92, 246, 0.20)',

  violet:      '#8B5CF6',
  violetLight: '#A78BFA',
  violetDark:  '#6D28D9',
  violetGlow:  'rgba(139, 92, 246, 0.20)',

  indigo:      '#6366F1',
  indigoLight: '#818CF8',
  indigoDark:  '#4338CA',
  indigoGlow:  'rgba(99, 102, 241, 0.20)',

  // Overlays
  overlay:       'rgba(2, 6, 23, 0.74)',
  overlayStrong: 'rgba(2, 6, 23, 0.88)',
  overlayLight:  'rgba(2, 6, 23, 0.45)',

  // Shadows
  shadow:        '#000000',
  shadowCyan:    '#06B6D4',
  shadowEmerald: '#10B981',

  // Legacy & Alpha Aliases
  glass:          'rgba(255, 255, 255, 0.04)',
  glassStrong:    'rgba(255, 255, 255, 0.08)',
  alphaCyan05:    'rgba(6, 182, 212, 0.06)',
  alphaCyan08:    'rgba(6, 182, 212, 0.09)',
  alphaCyan10:    'rgba(6, 182, 212, 0.12)',
  alphaCyan15:    'rgba(6, 182, 212, 0.18)',
  alphaCyan20:    'rgba(6, 182, 212, 0.24)',
  alphaCyan30:    'rgba(6, 182, 212, 0.34)',
  alphaEmerald10: 'rgba(16, 185, 129, 0.12)',
  alphaEmerald15: 'rgba(16, 185, 129, 0.18)',
  alphaEmerald20: 'rgba(16, 185, 129, 0.24)',
  alphaEmerald30: 'rgba(16, 185, 129, 0.34)',
  alphaAmber10:   'rgba(245, 158, 11, 0.12)',
  alphaAmber20:   'rgba(245, 158, 11, 0.24)',
  alphaRose10:    'rgba(244, 63, 94, 0.12)',
  alphaRose20:    'rgba(244, 63, 94, 0.24)',
  alphaPurple10:  'rgba(139, 92, 246, 0.12)',
  alphaPurple20:  'rgba(139, 92, 246, 0.24)',
  alphaViolet10:  'rgba(139, 92, 246, 0.12)',
  alphaViolet20:  'rgba(139, 92, 246, 0.24)',
  alphaBlue10:    'rgba(59, 130, 246, 0.12)',
  alphaBlue20:    'rgba(59, 130, 246, 0.24)',
  navyCard:       'rgba(12, 18, 32, 0.92)',
  navyElevated:   'rgba(17, 24, 39, 0.95)',

  // Gradient Aliases for direct colors.cardGradient* access
  cardGradient:        darkGradients.cardGradient,
  cardGradientCyan:    darkGradients.cardGradientCyan,
  cardGradientEmerald: darkGradients.cardGradientEmerald,
  cardGradientAmber:   darkGradients.cardGradientAmber,

  // Nested alpha reference
  alpha: darkAlpha,

  // Semantic Status Aliases
  success:        '#10B981',
  successLight:   '#34D399',
  danger:         '#F43F5E',
  dangerLight:    '#FB7185',
  warning:        '#F59E0B',
  warningLight:   '#FBBF24',
  info:           '#3B82F6',
  infoLight:      '#60A5FA',
};
