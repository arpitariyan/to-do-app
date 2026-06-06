import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, radii } from '../../theme/tokens';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  size?: number;
}

export function Checkbox({ checked, onToggle, size = 24 }: CheckboxProps) {
  const { colors, isDark } = useTheme();
  
  // 0 for unchecked, 1 for checked
  const progress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(checked ? 1 : 0, {
      mass: 0.5,
      damping: 12,
      stiffness: 120,
    });
  }, [checked, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', colors.accent]
    );
    
    const borderColor = interpolateColor(
      progress.value,
      [0, 1],
      [colors.border, colors.accent]
    );

    return {
      backgroundColor,
      borderColor,
      borderWidth: 2,
    };
  });

  const checkStyle = {
    opacity: progress,
    transform: [{ scale: progress }],
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggle}
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 }, // Circular checkbox for tasks
      ]}
    >
      <Animated.View
        style={[
          styles.box,
          { borderRadius: size / 2 },
          animatedStyle,
        ]}
      >
        <Animated.View style={checkStyle}>
          <Ionicons name="checkmark" size={size * 0.7} color="#FFF" />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
