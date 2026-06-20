import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, { FadeInDown, FadeIn, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { useAuthStore } from '@/src/stores/authStore';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { textStyles } from '@/src/theme/typography';
import { spacing, radii } from '@/src/theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signIn, isLoading, error, clearError } = useAuthStore();
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<React.ComponentRef<typeof Input>>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await signIn(data.email, data.password);
    } catch {
      // Error shown from store
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg0 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Image Section */}
          <Animated.View entering={FadeIn.duration(800)} style={styles.imageContainer}>
            <Image 
              source={require('../../assets/app-logo.jpeg')} 
              style={styles.headerImage}
              resizeMode="cover"
            />
            {/* Gradient Overlay to fade into background */}
            <View style={[styles.imageOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
          </Animated.View>

          {/* Form Bottom Sheet Style */}
          <View 
            style={[styles.formContainer, { backgroundColor: colors.bg1, paddingBottom: Math.max(insets.bottom + spacing.xl, spacing['3xl']) }]}
          >
            {/* Header Text */}
            <View style={styles.headerTextWrap}>
              <Text style={[textStyles.headingLg, { color: colors.textPrimary, letterSpacing: -1, fontSize: 36 }]}>
                Welcome
              </Text>
              <Text style={[textStyles.headingLg, { color: colors.accent, letterSpacing: -1, fontSize: 36, marginTop: -4 }]}>
                Back
              </Text>
              <Text style={[textStyles.bodyLg, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                Sign in to your Astra workspace
              </Text>
            </View>

            {/* Error Banner */}
            {error && (
              <Animated.View entering={FadeInDown.duration(300)} style={[styles.errorBanner, { backgroundColor: colors.errorSoft, borderColor: colors.error }]}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={[textStyles.bodySm, { color: colors.error, flex: 1, fontWeight: '500' }]}>{error}</Text>
              </Animated.View>
            )}

            {/* Form Inputs */}
            <View style={styles.inputGroup}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
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
                    leftIcon={<Ionicons name="mail" size={20} color={colors.textMuted} />}
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
                    placeholder="Enter your password"
                    isPassword
                    autoComplete="password"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    leftIcon={<Ionicons name="lock-closed" size={20} color={colors.textMuted} />}
                    containerStyle={{ marginTop: spacing.md }}
                  />
                )}
              />
            </View>

            <TouchableOpacity 
              style={styles.forgotPassword} 
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={[textStyles.labelMd, { color: colors.textSecondary }]}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              label="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              fullWidth
              size="lg"
              style={styles.actionBtn}
            />

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[textStyles.bodyMd, { color: colors.textSecondary }]}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
                <Text style={[textStyles.labelLg, { color: colors.accent }]}>Create one</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    height: height * 0.45,
    width: '100%',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  formContainer: {
    flex: 1,
    marginTop: -40,
    borderTopLeftRadius: radii['3xl'],
    borderTopRightRadius: radii['3xl'],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  headerTextWrap: {
    marginBottom: spacing['2xl'],
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    paddingVertical: spacing.xs,
  },
  actionBtn: {
    marginTop: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing['2xl'],
  },
});
