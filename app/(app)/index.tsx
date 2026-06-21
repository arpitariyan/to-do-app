import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeContext';
import { useAuthStore } from '@/src/stores/authStore';
import { Screen } from '@/src/components/layout/Screen';
import { Card } from '@/src/components/ui/Card';
import { textStyles } from '@/src/theme/typography';
import { spacing, radii, shadows } from '@/src/theme/tokens';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { useTasks, useUpdateTask } from '@/src/hooks/useTasks';
import { useNotes } from '@/src/hooks/useNotes';
import { TaskItem } from '@/src/components/tasks/TaskItem';
import { AvatarStack } from '@/src/components/ui/AvatarStack';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const firstName = user?.name?.split(' ')[0] ?? 'User';

  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks({ archived: false });
  const { data: notes = [], isLoading: isLoadingNotes } = useNotes();
  const updateTask = useUpdateTask();

  const handleToggleTask = (id: string, newStatus: 'todo' | 'done') => {
    updateTask.mutate({ id, payload: { status: newStatus } });
  };

  const handlePressTask = (id: string) => {
    router.push(`/(app)/tasks/${id}`);
  };

  const handlePressNote = (id: string) => {
    router.push({ pathname: '/notes/[id]', params: { id } } as any);
  };

  // ─── Data Filtering ─────────────────────────────────────────────────────────
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const {
    todayTasks,
    upcomingTasks,
    completedToday,
    recentNotes,
  } = useMemo(() => {
    const activeTasks = tasks.filter(t => t.status !== 'done');
    const doneToday = tasks.filter(t =>
      t.status === 'done' && t.updatedAt && new Date(t.updatedAt) >= todayStart
    );

    const today = activeTasks.filter(t => t.dueAt && new Date(t.dueAt) < tomorrowStart);
    const upcoming = activeTasks.filter(t => !t.dueAt || new Date(t.dueAt) >= tomorrowStart);

    return {
      todayTasks: today,
      upcomingTasks: upcoming,
      completedToday: doneToday,
      recentNotes: notes.slice(0, 4), // Already sorted by updatedAt desc
    };
  }, [tasks, notes]);

  const isLoading = isLoadingTasks || isLoadingNotes;

  const completionRate = todayTasks.length + completedToday.length === 0
    ? 0
    : Math.round((completedToday.length / (todayTasks.length + completedToday.length)) * 100);

  const aiInsight = useMemo(() => {
    const total = todayTasks.length + completedToday.length;
    if (total === 0) {
      return { title: 'Take a Break', message: "Your schedule is completely clear today. Great time to review your notes or just relax!" };
    }
    const completion = completedToday.length / total;
    if (completion === 1) {
      return { title: 'All Done!', message: "You've crushed all your tasks for today. Outstanding work! 🌟" };
    }
    if (completion >= 0.5) {
      return { title: 'Halfway There!', message: `You've completed ${completedToday.length} out of ${total} tasks. Keep up the momentum, you're doing great!` };
    }
    if (todayTasks.length > 0) {
      const urgent = todayTasks.find(t => t.priority === 'urgent' || t.priority === 'high');
      if (urgent) {
        return { title: 'Focus Required', message: `You have ${todayTasks.length} pending tasks. I suggest starting with "${urgent.title}" due to its high priority.` };
      }
      return { title: 'Time to Focus', message: `You have ${todayTasks.length} pending task(s). Consider starting with "${todayTasks[0].title}" to get the ball rolling.` };
    }
    return { title: 'Hello', message: 'Let us make today a productive day!' };
  }, [todayTasks, completedToday]);

  return (
    <Screen withBottomPad noPadding>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: spacing.lg, paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Greeting Header */}
        <Animated.View entering={FadeInDown.delay(0).duration(500)} style={styles.header}>
          <View style={styles.headerText}>
            <Text
              style={[textStyles.screenTitle, { color: colors.textPrimary, fontSize: 36, lineHeight: 44, fontWeight: '800' }]}
              numberOfLines={3}
            >
              Start Your Day{'\n'}& Be Productive ✌️
            </Text>
          </View>
        </Animated.View>

        {/* User / Team Stats */}
        <Animated.View entering={FadeInDown.delay(50).duration(500)} style={styles.statsRow}>
          <View style={styles.avatarStackWrapper}>
            <AvatarStack size={48} max={4} />
          </View>

          <GlassCard style={styles.statsBadge} intensity={40}>
            <View style={[styles.statsDot, { backgroundColor: colors.success }]} />
            <Text style={[textStyles.bodySm, { color: colors.textPrimary, fontWeight: '600' }]}>
              You have {todayTasks.length} tasks today.
            </Text>
          </GlassCard>
        </Animated.View>

        {isLoading ? (
          <View style={{ marginTop: spacing['3xl'], alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <>
            {/* 2. Productivity Overview */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.overviewGrid}>
              <View style={styles.overviewRow}>
                <OverviewCard label="Tasks Today" value={todayTasks.length.toString()} icon="checkmark-circle" color={colors.accent} colors={colors} />
                <OverviewCard label="Upcoming" value={upcomingTasks.length.toString()} icon="calendar" color={colors.info} colors={colors} />
              </View>
              <View style={styles.overviewRow}>
                <OverviewCard label="Notes" value={notes.length.toString()} icon="document-text" color={colors.success} colors={colors} />
                <OverviewCard label="Completion" value={`${completionRate}%`} icon="trending-up" color={colors.warning} colors={colors} />
              </View>
            </Animated.View>

            {/* 4. Today's Focus */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
              <View style={styles.focusHeader}>
                <Text style={[textStyles.sectionTitle, { color: colors.textPrimary }]}>
                  Today's Focus
                </Text>
                {todayTasks.length > 0 && (
                  <View style={[styles.progressBadge, { backgroundColor: colors.accentSoft }]}>
                    <Text style={[textStyles.caption, { color: colors.accent, fontFamily: 'Inter_600SemiBold' }]}>
                      {completionRate}% Done
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.focusList}>
                {todayTasks.length > 0 ? (
                  <>
                    {todayTasks.slice(0, 3).map(task => (
                      <TaskItem key={`focus-${task.$id}`} task={task} onToggle={handleToggleTask} onPress={handlePressTask} />
                    ))}
                    {todayTasks.length > 3 && (
                      <TouchableOpacity onPress={() => router.push('/(app)/tasks')} style={styles.moreTasksBtn}>
                        <Text style={[textStyles.meta, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                          See {todayTasks.length - 3} more tasks
                        </Text>
                        <Ionicons name="arrow-forward" size={14} color={colors.textSecondary} style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <View style={styles.emptyFocus}>
                    <Ionicons name="checkmark-done-circle-outline" size={32} color={colors.success} style={{ marginBottom: spacing.xs }} />
                    <Text style={[textStyles.body, { color: colors.textSecondary, textAlign: 'center' }]}>
                      All caught up for today!
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* 3. Quick Actions */}
            <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
              <View style={styles.quickActionsRow}>
                <QuickActionBtn label="New Task" icon="add-circle" color={colors.accent} colors={colors} onPress={() => router.push('/(app)/tasks/new')} />
                <QuickActionBtn label="New Note" icon="document" color={colors.success} colors={colors} onPress={() => router.push('/(app)/notes/new')} />
                <QuickActionBtn label="Ask AI" icon="planet" color={colors.info} colors={colors} onPress={() => router.push('/(app)/ai')} />
              </View>
            </Animated.View>

            {/* 5. Recent Notes */}
            {recentNotes.length > 0 && (
              <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[textStyles.sectionTitle, { color: colors.textPrimary }]}>Recent Notes</Text>
                  <TouchableOpacity onPress={() => router.push('/(app)/notes')}>
                    <Text style={[textStyles.meta, { color: colors.accent }]}>See all</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.notesScroll}>
                  {recentNotes.map((note, index) => {
                    const pastelColors = ['rgba(243,232,255,0.4)', 'rgba(209,250,229,0.4)', 'rgba(224,242,254,0.4)', 'rgba(255,237,213,0.4)'];
                    const darkColors = ['rgba(76,29,149,0.4)', 'rgba(6,78,59,0.4)', 'rgba(12,74,110,0.4)', 'rgba(124,45,18,0.4)'];
                    const bg = colors.bg1 === '#FFFFFF' ? pastelColors[index % 4] : darkColors[index % 4];
                    const textColor = colors.textPrimary;

                    return (
                      <TouchableOpacity
                        key={note.$id}
                        activeOpacity={0.8}
                        onPress={() => handlePressNote(note.$id)}
                      >
                        <GlassCard style={[styles.noteCard, { backgroundColor: bg }]} intensity={30}>
                          <Text style={[textStyles.cardTitle, { color: textColor }]} numberOfLines={2}>
                            {note.title || 'Untitled'}
                          </Text>
                          <Text style={[textStyles.caption, { color: textColor, opacity: 0.7, marginTop: spacing.sm }]} numberOfLines={3}>
                            {note.content ? note.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim() : 'Empty note...'}
                          </Text>
                        </GlassCard>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </Animated.View>
            )}

            {/* 6. Smart Assistant Insight */}
            <Animated.View entering={FadeInDown.delay(500).duration(500)} style={[styles.section, { marginBottom: spacing['3xl'] }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="sparkles" size={20} color={colors.accent} style={{ marginRight: 8 }} />
                  <Text style={[textStyles.sectionTitle, { color: colors.textPrimary }]}>AI Insight</Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/(app)/ai')}
              >
                <GlassCard
                  style={[styles.aiInsightCard, { borderColor: colors.accent }]}
                  intensity={40}
                  tint={colors.bg1 === '#FFFFFF' ? 'light' : 'dark'}
                >
                  <View style={styles.aiInsightHeader}>
                    <View style={[styles.aiIconWrapper, { backgroundColor: colors.accent }]}>
                      <Ionicons name="planet" size={24} color="#FFF" />
                    </View>
                    <Text style={[textStyles.headingSm, { color: colors.textPrimary, flex: 1, marginLeft: spacing.md }]}>
                      {aiInsight.title}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color={colors.accent} />
                  </View>
                  <Text style={[textStyles.bodyMd, { color: colors.textSecondary, marginTop: spacing.md, lineHeight: 22 }]}>
                    {aiInsight.message}
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
        onPress={() => router.push('/(app)/tasks/new')}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </Screen>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OverviewCard({ label, value, icon, color, colors }: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <GlassCard style={styles.overviewCardWrapper} intensity={30}>
      <View style={[styles.iconBox, { backgroundColor: `${color}30` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.overviewTextWrap}>
        <Text style={[textStyles.caption, { color: colors.textSecondary, marginBottom: 2 }]} numberOfLines={1}>{label}</Text>
        <Text style={[textStyles.headingMd, { color: colors.textPrimary }]} numberOfLines={1}>{value}</Text>
      </View>
    </GlassCard>
  );
}

function QuickActionBtn({ label, icon, color, colors, onPress }: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickActionBtn} onPress={onPress} activeOpacity={0.7}>
      <GlassCard intensity={40} style={[styles.quickActionIcon, { borderColor: `${color}30` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </GlassCard>
      <Text style={[textStyles.meta, { color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    paddingTop: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  statsBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radii.full,
    borderWidth: 1,
    gap: spacing.sm,
  },
  statsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  avatarStackWrapper: {
    padding: 2,
    backgroundColor: 'transparent',
    borderRadius: radii.full,
  },
  section: {
    marginTop: spacing['2xl'],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  overviewGrid: {
    gap: spacing.md,
  },
  overviewRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  overviewCardWrapper: {
    flex: 1,
    padding: spacing.lg,
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 110,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  overviewTextWrap: {
    flexDirection: 'column',
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  progressBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  focusList: {
    gap: spacing.sm,
  },
  moreTasksBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  emptyFocus: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesScroll: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  noteCard: {
    width: 160,
    height: 160,
    padding: spacing.lg,
    borderRadius: radii['2xl'],
  },
  aiGrid: {
    gap: spacing.sm,
  },
  aiInsightCard: {
    padding: spacing.lg,
    borderRadius: radii['2xl'],
    marginTop: spacing.xs,
  },
  aiInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 130,
    right: spacing.lg,
    width: 64,
    height: 64,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
});
