import { Platform } from 'react-native';

export const fontFamily = {
  // Inter is loaded via expo-google-fonts in _layout.tsx
  regular: Platform.select({ android: 'Inter_400Regular', ios: 'Inter-Regular', default: 'System' }),
  medium: Platform.select({ android: 'Inter_500Medium', ios: 'Inter-Medium', default: 'System' }),
  semiBold: Platform.select({ android: 'Inter_600SemiBold', ios: 'Inter-SemiBold', default: 'System' }),
  bold: Platform.select({ android: 'Inter_700Bold', ios: 'Inter-Bold', default: 'System' }),
} as const;

export const fontSize = {
  caption: 12,
  meta: 13,
  body: 15,
  cardTitle: 18,
  sectionTitle: 20,
  screenTitle: 32,
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
} as const;

// Composed text styles matching ASTRA PRD
export const textStyles = {
  screenTitle: {
    fontSize: fontSize.screenTitle,
    fontFamily: fontFamily.bold,
    lineHeight: fontSize.screenTitle * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  sectionTitle: {
    fontSize: fontSize.sectionTitle,
    fontFamily: fontFamily.semiBold,
    lineHeight: fontSize.sectionTitle * lineHeight.snug,
  },
  cardTitle: {
    fontSize: fontSize.cardTitle,
    fontFamily: fontFamily.semiBold,
    lineHeight: fontSize.cardTitle * lineHeight.snug,
  },
  body: {
    fontSize: fontSize.body,
    fontFamily: fontFamily.regular,
    lineHeight: fontSize.body * lineHeight.normal,
  },
  meta: {
    fontSize: fontSize.meta,
    fontFamily: fontFamily.regular,
    lineHeight: fontSize.meta * lineHeight.normal,
  },
  caption: {
    fontSize: fontSize.caption,
    fontFamily: fontFamily.regular,
    lineHeight: fontSize.caption * lineHeight.normal,
  },
  
  // Legacy mappings to prevent app from crashing immediately while we migrate
  // We will migrate all screens to use the exact ASTRA styles above
  displayLg: { fontSize: fontSize.screenTitle, fontFamily: fontFamily.bold },
  displayMd: { fontSize: fontSize.screenTitle, fontFamily: fontFamily.bold },
  headingLg: { fontSize: fontSize.screenTitle, fontFamily: fontFamily.bold },
  headingMd: { fontSize: fontSize.sectionTitle, fontFamily: fontFamily.semiBold },
  headingSm: { fontSize: fontSize.cardTitle, fontFamily: fontFamily.semiBold },
  bodyLg: { fontSize: fontSize.body, fontFamily: fontFamily.regular },
  bodyMd: { fontSize: fontSize.body, fontFamily: fontFamily.regular },
  bodySm: { fontSize: fontSize.meta, fontFamily: fontFamily.regular },
  labelLg: { fontSize: fontSize.body, fontFamily: fontFamily.medium },
  labelMd: { fontSize: fontSize.meta, fontFamily: fontFamily.medium },
  labelSm: { fontSize: fontSize.caption, fontFamily: fontFamily.medium },
} as const;
