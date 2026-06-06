import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
} from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { useAppLockStore } from '@/src/stores/appLockStore';
import { useAuthStore } from '@/src/stores/authStore';
import { textStyles } from '@/src/theme/typography';
import { spacing, radii } from '@/src/theme/tokens';

const PIN_LENGTH = 4;
const PAD = ['1','2','3','4','5','6','7','8','9','','0','⌫'] as const;

export default function LockScreen() {
  const { colors } = useTheme();
  const { verifyPin, unlock } = useAppLockStore();
  const { signOut, user } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const shakeX = useSharedValue(0);
  const shakeStyle = { transform: [{ translateX: shakeX }] };

  const triggerShake = () => {
    Vibration.vibrate(400);
    shakeX.value = withSequence(
      withTiming(-10, { duration: 60 }),
      withTiming(10, { duration: 60 }),
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
  };

  const handleKey = (key: string) => {
    if (key === '⌫') {
      setPin((p) => p.slice(0, -1));
      setError(false);
      return;
    }
    if (pin.length >= PIN_LENGTH) return;

    const next = pin + key;
    setPin(next);

    if (next.length === PIN_LENGTH) {
      if (verifyPin(next)) {
        unlock();
      } else {
        setError(true);
        triggerShake();
        setTimeout(() => setPin(''), 600);
      }
    }
  };

  const handleBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Nexus',
        fallbackLabel: 'Use PIN',
      });
      if (result.success) unlock();
    } catch {
      // Biometric not available; user falls back to PIN
    }
  };

  // Attempt biometric on mount
  useEffect(() => {
    handleBiometric();
  }, []);

  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => i < pin.length);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg0 }]}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.content}>
        {/* App Icon */}
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name="flash" size={40} color={colors.accent} />
        </View>

        <Text style={[textStyles.headingMd, { color: colors.textPrimary, marginTop: spacing.lg }]}>
          Nexus is locked
        </Text>
        <Text style={[textStyles.bodyMd, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          {user?.name ?? 'Enter your PIN to continue'}
        </Text>

        {/* PIN Dots */}
        <Animated.View style={[styles.dotsRow, shakeStyle]}>
          {dots.map((filled, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: filled
                    ? error ? colors.error : colors.accent
                    : colors.bg3,
                  borderColor: error ? colors.error : colors.border,
                },
              ]}
            />
          ))}
        </Animated.View>

        {error && (
          <Text style={[textStyles.bodySm, { color: colors.error, marginTop: spacing.sm }]}>
            Incorrect PIN. Try again.
          </Text>
        )}

        {/* Number Pad */}
        <View style={styles.pad}>
          {PAD.map((key, idx) => {
            if (key === '') {
              return <View key={idx} style={styles.padCell} />;
            }
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.padCell, styles.padBtn, { backgroundColor: colors.bg2, borderColor: colors.border }]}
                onPress={() => handleKey(key)}
                activeOpacity={0.7}
              >
                {key === '⌫' ? (
                  <Ionicons name="backspace-outline" size={22} color={colors.textPrimary} />
                ) : (
                  <Text style={[textStyles.headingMd, { color: colors.textPrimary }]}>{key}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Biometric button */}
        <TouchableOpacity onPress={handleBiometric} style={styles.biometricBtn}>
          <Ionicons name="finger-print-outline" size={24} color={colors.accent} />
          <Text style={[textStyles.labelMd, { color: colors.accent }]}>Use Biometrics</Text>
        </TouchableOpacity>

        {/* Sign out */}
        <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
          <Text style={[textStyles.bodySm, { color: colors.textMuted }]}>Sign out instead</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    width: '100%',
  },
  icon: {
    width: 88,
    height: 88,
    borderRadius: radii['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing['2xl'],
    marginBottom: spacing.sm,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: radii.full,
    borderWidth: 1.5,
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 300,
    marginTop: spacing['2xl'],
    gap: spacing.md,
    justifyContent: 'center',
  },
  padCell: {
    width: 84,
    height: 84,
  },
  padBtn: {
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing['2xl'],
    padding: spacing.md,
  },
  signOutBtn: {
    marginTop: spacing.lg,
    padding: spacing.md,
  },
});
