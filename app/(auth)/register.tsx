import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { useAuthStore } from '@/src/stores/authStore';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { textStyles } from '@/src/theme/typography';
import { spacing, radii } from '@/src/theme/tokens';

const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const emailRef = useRef<React.ComponentRef<typeof Input>>(null);
  const passwordRef = useRef<React.ComponentRef<typeof Input>>(null);
  const confirmRef = useRef<React.ComponentRef<typeof Input>>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await signUp(data.name, data.email, data.password);
    } catch {
      // Error shown from store
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg0 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingHorizontal: spacing.base }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <Animated.View entering={FadeInDown.delay(50).duration(600)} style={styles.brand}>
          <View style={[styles.logoMark, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="flash" size={36} color={colors.accent} />
          </View>
          <Text style={[textStyles.headingLg, { color: colors.textPrimary, marginTop: spacing.base }]}>
            Create your account
          </Text>
          <Text style={[textStyles.bodyMd, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            Your private command center awaits
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(150).duration(600)} style={styles.form}>
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.errorSoft, borderColor: colors.error }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={[textStyles.bodySm, { color: colors.error, flex: 1 }]}>{error}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Full name"
                placeholder="Your name"
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                ref={emailRef}
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
                containerStyle={{ marginTop: spacing.base }}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                ref={passwordRef}
                label="Password"
                placeholder="Min. 8 characters"
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
                containerStyle={{ marginTop: spacing.base }}
              />
            )}
          />

          <Controller
            control={control}
            name="confirm"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                ref={confirmRef}
                label="Confirm password"
                placeholder="Repeat your password"
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirm?.message}
                leftIcon={<Ionicons name="shield-checkmark-outline" size={18} color={colors.textMuted} />}
                containerStyle={{ marginTop: spacing.base }}
              />
            )}
          />

          <Button
            label="Create Account"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            fullWidth
            size="lg"
            style={{ marginTop: spacing.xl }}
          />
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeInUp.delay(250).duration(600)} style={styles.footer}>
          <Text style={[textStyles.bodyMd, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[textStyles.labelLg, { color: colors.accent }]}>Sign in</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  logoMark: {
    width: 80,
    height: 80,
    borderRadius: radii['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: 0,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.base,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing['2xl'],
  },
});
