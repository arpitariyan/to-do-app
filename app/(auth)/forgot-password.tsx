import React, { useState } from 'react';
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
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { textStyles } from '@/src/theme/typography';
import { spacing, radii } from '@/src/theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { directAdminPasswordReset } from '@/src/lib/auth';

const { width, height } = Dimensions.get('window');

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await directAdminPasswordReset(data.email, data.newPassword);
      setIsSuccess(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      alert(error.message || 'Failed to update password. Please check the email.');
    } finally {
      setIsLoading(false);
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
            {/* Gradient Overlay */}
            <View style={[styles.imageOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
            
            <TouchableOpacity 
              style={[styles.backButton, { top: Math.max(insets.top, spacing.md) }]} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>

          {/* Form Bottom Sheet Style */}
          <View 
            style={[styles.formContainer, { backgroundColor: colors.bg1, paddingBottom: Math.max(insets.bottom + spacing.xl, spacing['3xl']) }]}
          >
            {/* Header Text */}
            <View style={styles.headerTextWrap}>
              <Text style={[textStyles.headingLg, { color: colors.textPrimary, letterSpacing: -1, fontSize: 36 }]}>
                Forgot
              </Text>
              <Text style={[textStyles.headingLg, { color: colors.accent, letterSpacing: -1, fontSize: 36, marginTop: -4 }]}>
                Password?
              </Text>
              <Text style={[textStyles.bodyLg, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                Enter your registered email and a new password below. We will instantly update it for you without an email.
              </Text>
            </View>

            {isSuccess ? (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.successContainer}>
                <View style={[styles.successIconWrapper, { backgroundColor: colors.successSoft }]}>
                  <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                </View>
                <Text style={[textStyles.headingMd, { color: colors.textPrimary, textAlign: 'center', marginTop: spacing.md }]}>
                  Password Reset!
                </Text>
                <Text style={[textStyles.bodyMd, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xl }]}>
                  Your password has been changed successfully. You can now login.
                </Text>
                <Button
                  label="Back to Sign In"
                  onPress={() => router.replace('/(auth)/login')}
                  fullWidth
                  size="lg"
                  style={styles.actionBtn}
                />
              </Animated.View>
            ) : (
              <Animated.View entering={FadeInDown.duration(400)}>
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
                    name="newPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="New Password"
                        placeholder="Enter your new password"
                        secureTextEntry
                        autoCapitalize="none"
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit(onSubmit)}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.newPassword?.message}
                        leftIcon={<Ionicons name="lock-closed" size={20} color={colors.textMuted} />}
                      />
                    )}
                  />
                </View>

                <Button
                  label="Update Password"
                  onPress={handleSubmit(onSubmit)}
                  loading={isLoading}
                  fullWidth
                  size="lg"
                  style={styles.actionBtn}
                />
              </Animated.View>
            )}

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
  backButton: {
    position: 'absolute',
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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
  inputGroup: {
    gap: spacing.sm,
  },
  actionBtn: {
    marginTop: spacing['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  successIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
