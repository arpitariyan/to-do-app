// ─── Color Palette ───────────────────────────────────────────────────────────

export const palette = {
  // Backgrounds (ASTRA Dark - Rich Charcoal)
  bg0: '#121212',
  bg1: '#1C1C1E', // Slate Surface
  bg2: '#2C2C2E',
  bg3: '#3A3A3C',

  // Glassmorphism (Neutral / iOS 17 style) - Less transparent
  glass: 'rgba(28, 28, 30, 0.65)', // Blur background
  glassLight: 'rgba(255, 255, 255, 0.12)', // Surface highlights
  glassDark: 'rgba(0, 0, 0, 0.7)', // Deep shadow areas
  glassBorder: 'rgba(255, 255, 255, 0.18)', // Hairline borders
  glassSoft: 'rgba(255, 255, 255, 0.06)', // Extremely subtle cards

  // Borders
  border: '#2C2C2E',
  borderLight: '#3A3A3C',

  // Accent (Premium Violet)
  accent: '#7C3AED',
  accentSoft: 'rgba(124, 58, 237, 0.15)',
  accentMid: 'rgba(124, 58, 237, 0.3)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textDisabled: '#52525B',

  // Semantic
  success: '#10B981', // Emerald Green
  successSoft: 'rgba(16,185,129,0.15)',
  warning: '#F59E0B', // Amber
  warningSoft: 'rgba(245,158,11,0.15)',
  error: '#F43F5E', // Coral Red
  errorSoft: 'rgba(244,63,94,0.15)',
  info: '#3B82F6',
  infoSoft: 'rgba(59,130,246,0.15)',

  // Priority
  priorityHigh: '#F43F5E',
  priorityMedium: '#F59E0B',
  priorityLow: '#3B82F6',
  priorityNone: '#71717A',

  // Always
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Light mode overrides (ASTRA Light - Soft Warm White)
export const lightPalette = {
  bg0: '#FAFAFA', // Soft Warm White
  bg1: '#FFFFFF', // Pure White Cards
  bg2: '#F4F4F5',
  bg3: '#E4E4E7',
  
  // Glassmorphism Light (Neutral / iOS 17 style)
  glass: 'rgba(255, 255, 255, 0.85)',
  glassLight: 'rgba(255, 255, 255, 0.95)',
  glassDark: 'rgba(0, 0, 0, 0.08)',
  glassBorder: 'rgba(0, 0, 0, 0.15)',
  glassSoft: 'rgba(255, 255, 255, 0.65)',

  border: '#F4F4F5',
  borderLight: '#E4E4E7',
  textPrimary: '#18181B', // Deep Charcoal
  textSecondary: '#52525B',
  textMuted: '#A1A1AA',
  textDisabled: '#D4D4D8',
} as const;

// Pastel Note Colors (For Masonry Grid)
export const noteColors = {
  light: {
    lavender: '#F3E8FF',
    mint: '#D1FAE5',
    sky: '#E0F2FE',
    peach: '#FFEDD5',
    cream: '#FEF3C7',
  },
  dark: {
    lavender: '#4C1D95',
    mint: '#064E3B',
    sky: '#0C4A6E',
    peach: '#7C2D12',
    cream: '#78350F',
  }
} as const;

// ─── Spacing Scale (Strict ASTRA Scale) ───────────────────────────────────────

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  // Mapping 'base' to 'md' for backward compatibility in codebase
  base: 16,
} as const;

// ─── Border Radii (ASTRA Specs) ───────────────────────────────────────────────

export const radii = {
  sm: 10,
  md: 14,
  lg: 20, // Buttons
  xl: 28, // Cards / Dialogs
  '2xl': 32, // Large Cards
  '3xl': 40, // Bottom Sheets
  full: 9999,
} as const;

// ─── Shadows (Subtle & Elevated) ──────────────────────────────────────────────

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  accent: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
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
  { name: 'Violet', value: '#7C3AED' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Coral', value: '#F43F5E' },
] as const;

export type AccentColor = string;
