// ─── Color Palette ───────────────────────────────────────────────────────────

export const palette = {
  // Backgrounds
  bg0: '#0D0F14',
  bg1: '#161A23',
  bg2: '#1E2330',
  bg3: '#252A3A',

  // Borders
  border: '#2A3040',
  borderLight: '#353D52',

  // Accent (violet-purple, overridable via settings)
  accent: '#6C63FF',
  accentSoft: 'rgba(108,99,255,0.12)',
  accentMid: 'rgba(108,99,255,0.28)',

  // Text
  textPrimary: '#F0F2F8',
  textSecondary: '#8B92A5',
  textMuted: '#555C6E',
  textDisabled: '#3A4055',

  // Semantic
  success: '#4ADE80',
  successSoft: 'rgba(74,222,128,0.12)',
  warning: '#FBBF24',
  warningSoft: 'rgba(251,191,36,0.12)',
  error: '#F87171',
  errorSoft: 'rgba(248,113,113,0.12)',
  info: '#60A5FA',
  infoSoft: 'rgba(96,165,250,0.12)',

  // Priority
  priorityHigh: '#F87171',
  priorityMedium: '#FBBF24',
  priorityLow: '#60A5FA',
  priorityNone: '#555C6E',

  // Always
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Light mode overrides
export const lightPalette = {
  bg0: '#F4F6FB',
  bg1: '#FFFFFF',
  bg2: '#EEF1F8',
  bg3: '#E5E9F4',
  border: '#D5DAEB',
  borderLight: '#C8CDE0',
  textPrimary: '#0D0F14',
  textSecondary: '#4A5168',
  textMuted: '#8B92A5',
  textDisabled: '#C0C6D8',
} as const;

// ─── Spacing Scale ────────────────────────────────────────────────────────────

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// ─── Border Radii ─────────────────────────────────────────────────────────────

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  accent: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ─── Z-Index ──────────────────────────────────────────────────────────────────

export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 100,
  modal: 200,
  toast: 300,
  overlay: 400,
} as const;

// ─── Accent Color Presets ─────────────────────────────────────────────────────

export const accentPresets = [
  { name: 'Violet', value: '#6C63FF' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Amber', value: '#F59E0B' },
] as const;

export type AccentColor = (typeof accentPresets)[number]['value'];
