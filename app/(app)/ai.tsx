import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { Screen } from '@/src/components/layout/Screen';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { textStyles } from '@/src/theme/typography';
import { spacing, radii } from '@/src/theme/tokens';

const CAPABILITIES = [
  { icon: 'create-outline', label: 'Create tasks from natural language', color: 'accent' as const },
  { icon: 'document-text-outline', label: 'Draft and clean up notes', color: 'success' as const },
  { icon: 'list-outline', label: 'Summarize and extract action items', color: 'info' as const },
  { icon: 'calendar-outline', label: 'Build your daily or weekly plan', color: 'warning' as const },
  { icon: 'pricetag-outline', label: 'Suggest tags, folders & categories', color: 'muted' as const },
];

export default function AIScreen() {
  const { colors } = useTheme();

  return (
    <Screen withBottomPad>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).duration(500)} style={styles.header}>
          <Text style={[textStyles.headingLg, { color: colors.textPrimary }]}>AI Assistant</Text>
          <Badge label="Assist mode" color="accent" dot />
        </Animated.View>

        {/* Coming Soon Hero */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)}>
          <Card elevated accent style={styles.heroCard}>
            <View style={styles.heroInner}>
              <View style={[styles.heroIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="sparkles" size={40} color={colors.accent} />
              </View>
              <Text style={[textStyles.headingMd, { color: colors.textPrimary, marginTop: spacing.base }]}>
                Gemini AI — Phase 4
              </Text>
              <Text style={[textStyles.bodyMd, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
                The AI assistant will be fully integrated in Phase 4.
                Here's what it will be able to do:
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Capabilities list */}
        <Animated.View entering={FadeInDown.delay(160).duration(500)} style={{ marginTop: spacing.xl }}>
          <Text style={[textStyles.labelLg, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            Capabilities
          </Text>
          <View style={styles.capList}>
            {CAPABILITIES.map((cap, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(160 + i * 60).duration(400)}>
                <Card style={styles.capItem}>
                  <View style={[styles.capIcon, { backgroundColor: colors.bg3 }]}>
                    <Ionicons name={cap.icon as any} size={20} color={colors.accent} />
                  </View>
                  <Text style={[textStyles.bodyMd, { color: colors.textPrimary, flex: 1 }]}>
                    {cap.label}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </Card>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* AI Mode info */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)} style={{ marginTop: spacing.xl, marginBottom: spacing['3xl'] }}>
          <Text style={[textStyles.labelLg, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            AI Control Modes
          </Text>
          <Card>
            {[
              { mode: 'View', desc: 'AI reads and suggests, never writes', color: 'success' as const },
              { mode: 'Assist', desc: 'AI drafts changes, you confirm', color: 'accent' as const, active: true },
              { mode: 'Auto', desc: 'AI applies trusted low-risk actions', color: 'warning' as const },
            ].map(({ mode, desc, color, active }) => (
              <View key={mode} style={[styles.modeRow, { borderColor: colors.border }]}>
                <Badge label={mode} color={color} />
                <Text style={[textStyles.bodySm, { color: colors.textSecondary, flex: 1 }]}>{desc}</Text>
                {active && <Ionicons name="checkmark-circle" size={18} color={colors.accent} />}
              </View>
            ))}
          </Card>
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
    paddingVertical: spacing.base,
    marginBottom: spacing.md,
  },
  heroCard: {
    overflow: 'hidden',
  },
  heroInner: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.base,
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: radii['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  capList: {
    gap: spacing.sm,
  },
  capItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  capIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
});
