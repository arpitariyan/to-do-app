import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/src/theme/ThemeContext';
import { radii } from '@/src/theme/tokens';
import Animated, { FadeIn } from 'react-native-reanimated';

interface GlassCardProps extends ViewProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default' | 'systemThinMaterial' | 'systemThickMaterial';
  children: React.ReactNode;
  animated?: boolean;
  disableAndroidBlur?: boolean;
}

export function GlassCard({
  intensity = 80,
  tint,
  children,
  style,
  animated = false,
  disableAndroidBlur = false,
  ...rest
}: GlassCardProps) {
  const { isDark, colors } = useTheme();

  const activeTint = tint || (isDark ? 'dark' : 'light');

  const cardContent = (
    <View style={[styles.container, { borderColor: colors.glassBorder, backgroundColor: colors.glassSoft }, style]} {...rest}>
      <BlurView
        intensity={intensity}
        tint={activeTint}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );

  if (animated) {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.animatedWrapper}>
        {cardContent}
      </Animated.View>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  animatedWrapper: {
    width: '100%',
  },
  container: {
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
