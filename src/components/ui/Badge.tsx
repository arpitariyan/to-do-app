import React from 'react';
import { Text, View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { textStyles } from '@theme/typography';
import { radii, spacing } from '@theme/tokens';

export type BadgeColor = 'accent' | 'success' | 'warning' | 'error' | 'info' | 'muted';

interface BadgeProps {
  label: string;
  color?: BadgeColor;
  style?: ViewStyle;
  dot?: boolean;
}

export function Badge({ label, color = 'accent', style, dot = false }: BadgeProps) {
  const { colors } = useTheme();
  const { bg, text } = getBadgeColors(color, colors);

  return (
    <View style={[styles.base, { backgroundColor: bg }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: text }]} />}
      <Text style={[textStyles.labelSm, { color: text }]}>{label}</Text>
    </View>
  );
}

function getBadgeColors(
  color: BadgeColor,
  colors: ReturnType<typeof useTheme>['colors'],
): { bg: string; text: string } {
  switch (color) {
    case 'accent':   return { bg: colors.accentSoft, text: colors.accent };
    case 'success':  return { bg: colors.successSoft, text: colors.success };
    case 'warning':  return { bg: colors.warningSoft, text: colors.warning };
    case 'error':    return { bg: colors.errorSoft, text: colors.error };
    case 'info':     return { bg: colors.infoSoft, text: colors.info };
    case 'muted':    return { bg: colors.bg3, text: colors.textMuted };
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: radii.full,
  },
});
