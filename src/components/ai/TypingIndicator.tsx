import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing } from '@/src/theme/tokens';
import { Ionicons } from '@expo/vector-icons';

export function TypingIndicator() {
  const { colors } = useTheme();
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(300),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  const bg = colors.bg1;
  const dotColor = colors.accent;

  return (
    <View style={[styles.wrapper, { paddingHorizontal: spacing.md }]}>
      <View style={[styles.avatar, { backgroundColor: colors.accent + '20' }]}>
        <Ionicons name="sparkles" size={14} color={colors.accent} />
      </View>
      <View style={[styles.bubble, { backgroundColor: bg, borderColor: colors.border }]}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: dotColor, opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 6,
  },
  avatar: {
    width: 28, height: 28, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  bubble: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
