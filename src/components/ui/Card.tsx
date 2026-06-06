import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { radii, spacing, shadows } from '@theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  padded?: boolean;
  accent?: boolean;
}

export function Card({ children, style, elevated = false, padded = true, accent = false }: CardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors.bg1, borderColor: accent ? colors.accentMid : colors.border },
        elevated && shadows.md,
        accent && { borderColor: colors.accentMid },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.base,
  },
});
