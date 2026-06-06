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
import { useTasks, useUpdateTask } from '@/src/hooks/useTasks';
import { useNotes } from '@/src/hooks/useNotes';
import { TaskItem } from '@/src/components/tasks/TaskItem';

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

  return (
    <Screen withBottomPad noPadding>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: spacing.lg, paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Greeting Header */}
        <Animated.View entering={FadeInDown.delay(0).duration(500)} style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[textStyles.body, { color: colors.textSecondary }]}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <Text style={[textStyles.screenTitle, { color: colors.textPrimary }]}>
              {getGreeting()}, {firstName}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: colors.accentSoft }]}
            onPress={() => router.push('/(app)/settings')}
          >
            <Text style={[textStyles.sectionTitle, { color: colors.accent }]}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {isLoading ? (
          <View style={{ marginTop: spacing['3xl'], alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <>
            {/* 2. Productivity Overview */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.overviewGrid}>
              <OverviewCard label="Tasks Today" value={todayTasks.length.toString()} icon="checkmark-circle" color={colors.accent} colors={colors} />
              <OverviewCard label="Upcoming" value={upcomingTasks.length.toString()} icon="calendar" color={colors.info} colors={colors} />
              <OverviewCard label="Notes" value={notes.length.toString()} icon="document-text" color={colors.success} colors={colors} />
              <OverviewCard label="Completion" value={`${completionRate}%`} icon="trending-up" color={colors.warning} colors={colors} />
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
                    const pastelColors = ['#F3E8FF', '#D1FAE5', '#E0F2FE', '#FFEDD5']; // Lavender, Mint, Sky, Peach
                    const darkColors = ['#4C1D95', '#064E3B', '#0C4A6E', '#7C2D12'];
                    const bg = colors.bg1 === '#FFFFFF' ? pastelColors[index % 4] : darkColors[index % 4];
                    const textColor = colors.bg1 === '#FFFFFF' ? '#18181B' : '#F8FAFC';
                    
                    return (
                      <TouchableOpacity
                        key={note.$id}
                        style={[styles.noteCard, { backgroundColor: bg }]}
                        activeOpacity={0.8}
                        onPress={() => handlePressNote(note.$id)}
                      >
                        <Text style={[textStyles.cardTitle, { color: textColor }]} numberOfLines={2}>
                          {note.title || 'Untitled'}
                        </Text>
                        <Text style={[textStyles.caption, { color: textColor, opacity: 0.7, marginTop: spacing.sm }]} numberOfLines={3}>
                          {note.content || 'Empty note...'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </Animated.View>
            )}

            {/* 6. AI Suggestions */}
            <Animated.View entering={FadeInDown.delay(500).duration(500)} style={[styles.section, { marginBottom: spacing['3xl'] }]}>
              <Text style={[textStyles.sectionTitle, { color: colors.textPrimary, marginBottom: spacing.md }]}>
                AI Suggestions
              </Text>
              <View style={styles.aiGrid}>
                <AISuggestionCard label="Plan My Day" icon="calendar-outline" colors={colors} />
                <AISuggestionCard label="Summarize Notes" icon="documents-outline" colors={colors} />
              </View>
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
    <View style={[styles.overviewCard, { backgroundColor: colors.bg1, borderColor: colors.border }]}>
      <View style={[styles.overviewIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[textStyles.screenTitle, { fontSize: 24, color: colors.textPrimary, marginTop: spacing.sm }]}>{value}</Text>
      <Text style={[textStyles.meta, { color: colors.textSecondary }]}>{label}</Text>
    </View>
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
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: colors.bg1, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.quickIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[textStyles.meta, { color: colors.textPrimary, fontFamily: 'Inter_600SemiBold', marginTop: spacing.sm }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function AISuggestionCard({ label, icon, colors }: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <TouchableOpacity style={[styles.aiSuggestion, { backgroundColor: colors.bg2, borderColor: colors.border }]} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={colors.accent} />
      <Text style={[textStyles.body, { color: colors.textPrimary, marginLeft: spacing.sm, fontFamily: 'Inter_500Medium' }]}>
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
    marginBottom: spacing['2xl'],
  },
  headerText: {
    gap: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  overviewCard: {
    width: '48%',
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  overviewIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
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
  quickAction: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIcon: {
    width: 48,
    height: 48,
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
    padding: spacing.md,
    borderRadius: radii.xl,
  },
  aiGrid: {
    gap: spacing.sm,
  },
  aiSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 96,
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
