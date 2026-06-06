import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  type TouchableOpacityProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@theme/ThemeContext';
import { textStyles } from '@theme/typography';
import { radii, spacing } from '@theme/tokens';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  labelStyle,
  disabled,
  onPress,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const isDisabled = disabled || loading;

  const containerStyles = [
    styles.base,
    sizeStyles[size],
    getVariantStyle(variant, colors),
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    { transform: [{ scale }] },
    style,
  ];

  const labelColor = getLabelColor(variant, colors);

  return (
    <AnimatedTouchable
      style={containerStyles}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      activeOpacity={0.9}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : (
        <>
          {leftIcon}
          <Text style={[getLabelStyle(size), { color: labelColor }, labelStyle]}>
            {label}
          </Text>
          {rightIcon}
        </>
      )}
    </AnimatedTouchable>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getVariantStyle(variant: ButtonVariant, colors: ReturnType<typeof useTheme>['colors']): ViewStyle {
  switch (variant) {
    case 'primary':
      return { backgroundColor: colors.accent };
    case 'secondary':
      return { backgroundColor: colors.accentSoft };
    case 'ghost':
      return { backgroundColor: 'transparent' };
    case 'danger':
      return { backgroundColor: colors.errorSoft };
    case 'outline':
      return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border };
  }
}

function getLabelColor(variant: ButtonVariant, colors: ReturnType<typeof useTheme>['colors']): string {
  switch (variant) {
    case 'primary':
      return colors.white;
    case 'secondary':
      return colors.accent;
    case 'ghost':
      return colors.textSecondary;
    case 'danger':
      return colors.error;
    case 'outline':
      return colors.textPrimary;
  }
}

function getLabelStyle(size: ButtonSize): TextStyle {
  switch (size) {
    case 'sm':
      return textStyles.labelMd;
    case 'md':
      return textStyles.labelLg;
    case 'lg':
      return { ...textStyles.labelLg, fontSize: 16 };
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.lg,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
});

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 1,
    minHeight: 36,
  },
  md: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  lg: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    minHeight: 56,
  },
};
