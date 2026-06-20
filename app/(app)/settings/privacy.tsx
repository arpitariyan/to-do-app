import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { textStyles } from '@/src/theme/typography';
import { spacing } from '@/src/theme/tokens';
import { Screen } from '@/src/components/layout/Screen';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Screen withBottomPad>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.bg2 }]}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[textStyles.headingMd, { color: colors.textPrimary }]}>Privacy Policy</Text>
        {/* Spacer for centering */}
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={[textStyles.bodyLg, { color: colors.textSecondary, marginBottom: spacing.xl }]}>
            Last updated: June 20, 2026
          </Text>

          <Text style={[textStyles.headingSm, { color: colors.textPrimary, marginBottom: spacing.sm }]}>1. Introduction</Text>
          <Text style={[textStyles.bodyMd, { color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 24 }]}>
            Welcome to Astra. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
          </Text>

          <Text style={[textStyles.headingSm, { color: colors.textPrimary, marginBottom: spacing.sm }]}>2. Information We Collect</Text>
          <Text style={[textStyles.bodyMd, { color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 24 }]}>
            Astra is designed to respect your privacy. The information we collect includes:
            {'\n'}• <Text style={{ fontWeight: '600', color: colors.textPrimary }}>Personal Data:</Text> When you register, we may collect your name and email address.
            {'\n'}• <Text style={{ fontWeight: '600', color: colors.textPrimary }}>User Content:</Text> Your tasks, notes, drawings, and voice recordings.
            {'\n'}• <Text style={{ fontWeight: '600', color: colors.textPrimary }}>Authentication:</Text> Local app lock PINs and Biometric data (Face ID/Touch ID) are processed exclusively on your device and are never transmitted to our servers.
          </Text>

          <Text style={[textStyles.headingSm, { color: colors.textPrimary, marginBottom: spacing.sm }]}>3. How We Use Your Information</Text>
          <Text style={[textStyles.bodyMd, { color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 24 }]}>
            We use the information we collect to:
            {'\n'}• Provide, operate, and maintain the application.
            {'\n'}• Sync your tasks and notes securely across your devices.
            {'\n'}• Improve, personalize, and expand our services.
            {'\n'}• Provide you with AI-driven insights and features.
          </Text>

          <Text style={[textStyles.headingSm, { color: colors.textPrimary, marginBottom: spacing.sm }]}>4. Data Storage and Security</Text>
          <Text style={[textStyles.bodyMd, { color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 24 }]}>
            We use administrative, technical, and physical security measures to help protect your personal information. Your content is securely synced to our Appwrite backend. Local lock mechanisms (PIN and Biometrics) utilize your device's native secure enclave/keystore. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable.
          </Text>

          <Text style={[textStyles.headingSm, { color: colors.textPrimary, marginBottom: spacing.sm }]}>5. AI Processing</Text>
          <Text style={[textStyles.bodyMd, { color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 24 }]}>
            Features that utilize Artificial Intelligence (such as voice-to-text, AI task generation, and note summaries) may process portions of your text and voice data via secure third-party APIs (such as Google Gemini). This data is processed temporarily to provide the requested service and is not used to train external public models.
          </Text>

          <Text style={[textStyles.headingSm, { color: colors.textPrimary, marginBottom: spacing.sm }]}>6. Contact Us</Text>
          <Text style={[textStyles.bodyMd, { color: colors.textSecondary, marginBottom: spacing['3xl'], lineHeight: 24 }]}>
            If you have questions or comments about this Privacy Policy, please contact us at:{'\n\n'}
            <Text style={{ fontWeight: '700', color: colors.textPrimary }}>Developer:</Text> Arpit Ariyan Maharana{'\n'}
            <Text style={{ fontWeight: '700', color: colors.textPrimary }}>Email:</Text> arpitariyanm@zohomail.in
          </Text>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
});
