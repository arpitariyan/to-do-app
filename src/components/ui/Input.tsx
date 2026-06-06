import React, { forwardRef, useState } from 'react';
import {
  TextInput,
  Text,
  View,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { textStyles } from '../../theme/typography';
import { radii, spacing } from '../../theme/tokens';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>((props, ref) => {
  const { label, error, hint, leftIcon, rightIcon, containerStyle, onFocus, onBlur, style, ...rest } = props;
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const borderColor = error ? colors.error : isFocused ? colors.accent : colors.border;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[textStyles.labelMd, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.container,
          { backgroundColor: colors.bg2, borderColor },
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            textStyles.bodyLg,
            { color: colors.textPrimary, flex: 1 },
            leftIcon ? { paddingLeft: spacing.xs } : null,
            rightIcon ? { paddingRight: spacing.xs } : null,
            style,
          ]}
          placeholderTextColor={colors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>

      {(error || hint) && (
        <Text
          style={[
            textStyles.caption,
            { color: error ? colors.error : colors.textMuted, marginTop: spacing.xs },
          ]}
        >
          {error ?? hint}
        </Text>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: spacing.base,
    minHeight: 52,
  },
  input: {
    paddingVertical: spacing.md,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});
