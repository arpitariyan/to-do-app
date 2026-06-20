import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { textStyles } from '@/src/theme/typography';
import { spacing } from '@/src/theme/tokens';
import { Screen } from '@/src/components/layout/Screen';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function TermsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Screen withBottomPad>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.bg2 }]}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[textStyles.headingMd, { color: colors.textPrimary }]}>Terms & Conditions</Text>
        {/* Spacer for centering */}
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={[textStyles.bodyLg, { color: colors.textSecondary, marginBottom: spacing.xl }]}>
            Last updated: June 20, 2026
          </Text>

          <Text style={[textStyles.headingSm, { color: colors.textPrimary, marginBottom: spacing.sm }]}>1. Agreement to Terms</Text>
          <Text style={[textStyles.bodyMd, { color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 24 }]}>
            By accessing or using Astra, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, then you do not have permission to access the application.
          </Text>

          <Text style={[textStyles.headingSm, { color: colors.textPrimary, marginBottom: spacing.sm }]}>2. Use of the App</Text>
          <Text style={[textStyles.bodyMd, { color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 24 }]}>
            Astra provides a platform for managing tasks, notes, drawings, and voice memos. You agree to use the application only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the application.
          </Text>

          <Text style={[textStyles.headingSm, { color: colors.textPrimary, marginBottom: spacing.sm }]}>3. User Accounts & Security</Text>
          <Text style={[textStyles.bodyMd, { color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 24 }]}>
            When you create an account with us, you must provide accurate, complete, and current information. You are solely responsible for safeguarding the password and the local App Lock PIN you use to access the service. We cannot and will not be liable for any loss or damage arising from your failure to comply with this security obligation.
          </Text>

          <Text style={[textStyles.headingSm, { color: colors.textPrimary, marginBottom: spacing.sm }]}>4. Intellectual Property</Text>
          <Text style={[textStyles.bodyMd, { color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 24 }]}>
            The application and its original content (excluding User Content), features, and functionality are and will remain the exclusive property of Arpit Ariyan Maharana and its licensors. The application is protected by copyright, trademark, and other laws.
          </Text>

          <Text style={[textStyles.headingSm, { color: colors.textPrimary, marginBottom: spacing.sm }]}>5. AI Features</Text>
          <Text style={[textStyles.bodyMd, { color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 24 }]}>
            Astra incorporates Artificial Intelligence for certain features. AI-generated content is provided "as is". You acknowledge that AI systems may occasionally produce inaccurate, biased, or inappropriate outputs, and you are responsible for reviewing AI-generated content before relying on it.
          </Text>

          <Text style={[textStyles.headingSm, { color: colors.textPrimary, marginBottom: spacing.sm }]}>6. Limitation of Liability</Text>
          <Text style={[textStyles.bodyMd, { color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 24 }]}>
            In no event shall Astra, nor its developers, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the application.
          </Text>

          <Text style={[textStyles.headingSm, { color: colors.textPrimary, marginBottom: spacing.sm }]}>7. Contact Us</Text>
          <Text style={[textStyles.bodyMd, { color: colors.textSecondary, marginBottom: spacing['3xl'], lineHeight: 24 }]}>
            If you have any questions about these Terms, please contact:{'\n\n'}
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
