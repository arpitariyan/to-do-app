import { Platform } from 'react-native';

export const fontFamily = {
  // Inter is loaded via expo-google-fonts in _layout.tsx
  regular: Platform.select({ android: 'Inter_400Regular', ios: 'Inter-Regular', default: 'System' }),
  medium: Platform.select({ android: 'Inter_500Medium', ios: 'Inter-Medium', default: 'System' }),
  semiBold: Platform.select({ android: 'Inter_600SemiBold', ios: 'Inter-SemiBold', default: 'System' }),
  bold: Platform.select({ android: 'Inter_700Bold', ios: 'Inter-Bold', default: 'System' }),
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
} as const;

export const lineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.3,
  wider: 0.6,
  widest: 1.2,
} as const;

// Composed text styles
export const textStyles = {
  displayLg: {
    fontSize: fontSize['4xl'],
    fontFamily: fontFamily.bold,
    lineHeight: fontSize['4xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  displayMd: {
    fontSize: fontSize['3xl'],
    fontFamily: fontFamily.bold,
    lineHeight: fontSize['3xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  headingLg: {
    fontSize: fontSize['2xl'],
    fontFamily: fontFamily.bold,
    lineHeight: fontSize['2xl'] * lineHeight.snug,
  },
  headingMd: {
    fontSize: fontSize.xl,
    fontFamily: fontFamily.semiBold,
    lineHeight: fontSize.xl * lineHeight.snug,
  },
  headingSm: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.semiBold,
    lineHeight: fontSize.lg * lineHeight.snug,
  },
  bodyLg: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    lineHeight: fontSize.md * lineHeight.normal,
  },
  bodyMd: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.regular,
    lineHeight: fontSize.base * lineHeight.normal,
  },
  bodySm: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  labelLg: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.medium,
    lineHeight: fontSize.base * lineHeight.normal,
  },
  labelMd: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.medium,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  labelSm: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.medium,
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  caption: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
  mono: {
    fontSize: fontSize.sm,
    fontFamily: Platform.select({ android: 'monospace', default: 'Courier New' }),
    lineHeight: fontSize.sm * lineHeight.relaxed,
  },
} as const;
