import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { spacing } from '@theme/tokens';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** If true, no horizontal padding is applied (for full-bleed layouts) */
  noPadding?: boolean;
  /** Scroll-safe bottom padding for FAB or bottom tab overlap */
  withBottomPad?: boolean;
}

export function Screen({ children, style, noPadding = false, withBottomPad = false }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: 'transparent' }]}>
      <SafeAreaView
        style={[
          styles.safe,
          !noPadding && styles.padded,
          style,
        ]}
        edges={['top', 'left', 'right']}
      >
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.base,
  },
});
