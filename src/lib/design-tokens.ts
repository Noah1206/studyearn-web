/**
 * Stuple Design Tokens
 * 토스/카카오뱅크 스타일 디자인 시스템
 */

// ============================================
// Colors
// ============================================
export const colors = {
  // Primary - Toss Blue
  primary: {
    DEFAULT: '#3182F6',
    50: '#EAF2FF',
    100: '#D4E4FF',
    200: '#A8C8FF',
    300: '#7DACFF',
    400: '#5190FF',
    500: '#3182F6',
    600: '#1B64DA',
    700: '#1554B8',
    800: '#104496',
    900: '#0B3474',
  },

  // Neutral - Toss Gray
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E8EB',
    300: '#D1D6DB',
    400: '#B0B8C1',
    500: '#8B95A1',
    600: '#6B7684',
    700: '#4E5968',
    800: '#333D4B',
    900: '#191F28',
  },

  // Semantic
  success: {
    DEFAULT: '#22C55E',
    light: '#ECFDF5',
    dark: '#16A34A',
  },
  warning: {
    DEFAULT: '#F59E0B',
    light: '#FEF3C7',
    dark: '#D97706',
  },
  error: {
    DEFAULT: '#EF4444',
    light: '#FEE2E2',
    dark: '#DC2626',
  },
  info: {
    DEFAULT: '#3182F6',
    light: '#EAF2FF',
    dark: '#1B64DA',
  },
} as const;

// ============================================
// Shadows - Toss Style (Very Soft)
// ============================================
export const shadows = {
  xs: '0 1px 2px rgba(0, 0, 0, 0.03)',
  sm: '0 2px 4px rgba(0, 0, 0, 0.04)',
  md: '0 4px 8px rgba(0, 0, 0, 0.05)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.06)',
  xl: '0 16px 32px rgba(0, 0, 0, 0.08)',
  '2xl': '0 24px 48px rgba(0, 0, 0, 0.12)',
  modal: '0 24px 48px rgba(0, 0, 0, 0.16)',
  bottomSheet: '0 -4px 24px rgba(0, 0, 0, 0.12)',
} as const;

// ============================================
// Border Radius - Toss Style (Rounded)
// ============================================
export const radius = {
  none: '0px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
} as const;

// ============================================
// Spacing
// ============================================
export const spacing = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

// ============================================
// Typography
// ============================================
export const typography = {
  fontFamily: {
    sans: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },
  fontSize: {
    xs: ['12px', { lineHeight: '16px', letterSpacing: '-0.01em' }],
    sm: ['14px', { lineHeight: '20px', letterSpacing: '-0.01em' }],
    base: ['16px', { lineHeight: '24px', letterSpacing: '-0.01em' }],
    lg: ['18px', { lineHeight: '28px', letterSpacing: '-0.02em' }],
    xl: ['20px', { lineHeight: '28px', letterSpacing: '-0.02em' }],
    '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
    '3xl': ['28px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
    '4xl': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em' }],
    '5xl': ['40px', { lineHeight: '48px', letterSpacing: '-0.02em' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// ============================================
// Animation - Framer Motion Presets
// ============================================
export const animation = {
  duration: {
    fast: 0.15,
    normal: 0.2,
    slow: 0.3,
    slower: 0.4,
  },
  easing: {
    // Toss-style easing (smooth deceleration)
    toss: [0.33, 1, 0.68, 1],
    tossIn: [0.32, 0, 0.67, 0],
    tossOut: [0.33, 1, 0.68, 1],
    tossInOut: [0.65, 0, 0.35, 1],
    // Spring-like
    spring: [0.175, 0.885, 0.32, 1.275],
    bounce: [0.68, -0.55, 0.265, 1.55],
  },
  spring: {
    gentle: { type: 'spring', stiffness: 120, damping: 14 },
    snappy: { type: 'spring', stiffness: 400, damping: 30 },
    bouncy: { type: 'spring', stiffness: 300, damping: 10 },
    default: { type: 'spring', stiffness: 260, damping: 20 },
  },
} as const;

// ============================================
// Z-Index Scale
// ============================================
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
} as const;

// ============================================
// Breakpoints
// ============================================
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================
// Component Presets
// ============================================
export const componentPresets = {
  button: {
    height: {
      sm: '32px',
      md: '40px',
      lg: '48px',
      xl: '56px',
    },
    padding: {
      sm: '0 12px',
      md: '0 16px',
      lg: '0 20px',
      xl: '0 24px',
    },
  },
  input: {
    height: {
      sm: '36px',
      md: '44px',
      lg: '52px',
    },
  },
  card: {
    padding: {
      sm: '12px',
      md: '16px',
      lg: '20px',
      xl: '24px',
    },
  },
  modal: {
    width: {
      sm: '320px',
      md: '400px',
      lg: '480px',
      xl: '560px',
      full: '100%',
    },
  },
} as const;

// Export all tokens as a single object
export const tokens = {
  colors,
  shadows,
  radius,
  spacing,
  typography,
  animation,
  zIndex,
  breakpoints,
  componentPresets,
} as const;

export type DesignTokens = typeof tokens;
