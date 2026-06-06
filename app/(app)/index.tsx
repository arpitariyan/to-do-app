import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeContext';
import { useAuthStore } from '@/src/stores/authStore';
import { Screen } from '@/src/components/layout/Screen';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { textStyles } from '@/src/theme/typography';
import { spacing, radii } from '@/src/theme/tokens';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <Screen withBottomPad noPadding>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: spacing.base }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).duration(500)} style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[textStyles.bodySm, { color: colors.textMuted }]}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <Text style={[textStyles.headingLg, { color: colors.textPrimary }]}>
              {getGreeting()}, {firstName} 👋
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: colors.accentSoft }]}
            onPress={() => router.push('/(app)/settings')}
          >
            <Text style={[textStyles.headingSm, { color: colors.accent }]}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Stats Row */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.statsRow}>
          <StatCard label="Tasks today" value="0" icon="checkmark-circle-outline" color={colors.accent} colors={colors} />
          <StatCard label="Upcoming" value="0" icon="calendar-outline" color={colors.info} colors={colors} />
          <StatCard label="Notes" value="0" icon="document-text-outline" color={colors.success} colors={colors} />
        </Animated.View>

        {/* Quick Add */}
        <Animated.View entering={FadeInDown.delay(160).duration(500)}>
          <Text style={[textStyles.labelLg, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
            Quick capture
          </Text>
          <View style={styles.quickAdd}>
            <QuickAddBtn
              icon="add-circle-outline"
              label="New task"
              onPress={() => router.push('/(app)/tasks')}
              colors={colors}
            />
            <QuickAddBtn
              icon="document-outline"
              label="New note"
              onPress={() => router.push('/(app)/notes')}
              colors={colors}
            />
            <QuickAddBtn
              icon="sparkles-outline"
              label="Ask AI"
              onPress={() => router.push('/(app)/ai')}
              colors={colors}
              accent
            />
          </View>
        </Animated.View>

        {/* Today's Focus — Empty State */}
        <Animated.View entering={FadeInDown.delay(240).duration(500)} style={{ marginTop: spacing.xl }}>
          <View style={styles.sectionHeader}>
            <Text style={[textStyles.labelLg, { color: colors.textSecondary }]}>Today's focus</Text>
            <Badge label="0 tasks" color="muted" />
          </View>
          <Card style={styles.emptyCard} elevated>
            <View style={styles.emptyContent}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="sunny-outline" size={28} color={colors.accent} />
              </View>
              <Text style={[textStyles.headingSm, { color: colors.textPrimary, marginTop: spacing.md }]}>
                Nothing due today
              </Text>
              <Text style={[textStyles.bodySm, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }]}>
                Create your first task or let AI build your daily plan.
              </Text>
              <TouchableOpacity
                style={[styles.emptyAction, { backgroundColor: colors.accentSoft }]}
                onPress={() => router.push('/(app)/ai')}
              >
                <Ionicons name="sparkles-outline" size={14} color={colors.accent} />
                <Text style={[textStyles.labelMd, { color: colors.accent }]}>Generate daily plan</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </Animated.View>

        {/* Pinned — Empty State */}
        <Animated.View entering={FadeInDown.delay(320).duration(500)} style={{ marginTop: spacing.xl }}>
          <Text style={[textStyles.labelLg, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
            Pinned
          </Text>
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons name="pin-outline" size={28} color={colors.textMuted} />
              <Text style={[textStyles.bodySm, { color: colors.textMuted, marginTop: spacing.sm }]}>
                Pin tasks and notes to see them here.
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Upcoming — Empty State */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={{ marginTop: spacing.xl, marginBottom: spacing['3xl'] }}>
          <Text style={[textStyles.labelLg, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
            Upcoming
          </Text>
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons name="calendar-outline" size={28} color={colors.textMuted} />
              <Text style={[textStyles.bodySm, { color: colors.textMuted, marginTop: spacing.sm }]}>
                Tasks with due dates will appear here.
              </Text>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => router.push('/(app)/tasks')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </Screen>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, colors }: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.bg1, borderColor: colors.border }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[textStyles.displayMd, { color: colors.textPrimary, fontSize: 22, marginTop: spacing.xs }]}>{value}</Text>
      <Text style={[textStyles.caption, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

function QuickAddBtn({ icon, label, onPress, colors, accent = false }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  accent?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.quickBtn,
        { backgroundColor: accent ? colors.accentSoft : colors.bg2, borderColor: accent ? colors.accentMid : colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={20} color={accent ? colors.accent : colors.textSecondary} />
      <Text style={[textStyles.labelMd, { color: accent ? colors.accent : colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerText: {
    gap: spacing.xs,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'flex-start',
    gap: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  quickAdd: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  emptyCard: {
    paddingVertical: spacing['2xl'],
  },
  emptyContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    marginTop: spacing.base,
  },
  fab: {
    position: 'absolute',
    bottom: spacing['2xl'],
    right: spacing.base,
    width: 56,
    height: 56,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
});
