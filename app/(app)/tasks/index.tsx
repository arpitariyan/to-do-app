import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, radii } from '@/src/theme/tokens';
import { textStyles } from '@/src/theme/typography';
import { Screen } from '@/src/components/layout/Screen';
import { TaskItem } from '@/src/components/tasks/TaskItem';
import { useTasks, useUpdateTask } from '@/src/hooks/useTasks';
import { syncTaskReminders } from '@/src/hooks/useNotifications';

type FilterType = 'today' | 'upcoming' | 'completed';

export default function TasksScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const isDark = colors.bg1 !== '#FFFFFF';
  
  const [filter, setFilter] = useState<FilterType>('today');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: tasks = [], isLoading, error } = useTasks({ archived: false });
  const updateTask = useUpdateTask();

  React.useEffect(() => {
    if (tasks.length > 0) {
      syncTaskReminders(tasks);
    }
  }, [tasks]);

  const handleToggleTask = (id: string, newStatus: 'todo' | 'done') => {
    updateTask.mutate({ id, payload: { status: newStatus } });
  };

  const handlePressTask = (id: string) => {
    router.push({ pathname: '/tasks/[id]', params: { id } });
  };

  const filteredTasks = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    let result = tasks;

    // Search filter
    if (searchQuery.trim()) {
      result = result.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Tab filter
    if (filter === 'completed') {
      result = result.filter(t => t.status === 'done');
    } else if (filter === 'today') {
      result = result.filter(t => t.status !== 'done' && t.dueAt && new Date(t.dueAt) < tomorrowStart);
    } else if (filter === 'upcoming') {
      result = result.filter(t => t.status !== 'done' && (!t.dueAt || new Date(t.dueAt) >= tomorrowStart));
    }

    return result;
  }, [tasks, filter, searchQuery]);

  return (
    <Screen withBottomPad>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[textStyles.screenTitle, { color: colors.textPrimary }]}>Tasks</Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.glassSoft, borderColor: colors.glassBorder }]}>
        <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary, fontFamily: 'Inter_400Regular' }]}
          placeholder="Search tasks..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented Control */}
      <View style={[
        styles.tabsWrapper,
        { backgroundColor: colors.glassSoft, borderColor: colors.glassBorder }
      ]}>
        {(['today', 'upcoming', 'completed'] as FilterType[]).map((tab) => {
          const isActive = filter === tab;
          return (
            <TouchableOpacity 
              key={tab}
              style={[
                styles.tab, 
                isActive ? [
                  styles.tabActive,
                  { 
                    backgroundColor: colors.textPrimary,
                  }
                ] : { backgroundColor: 'transparent' }
              ]} 
              onPress={() => setFilter(tab)}
              activeOpacity={0.8}
            >
              <Text style={[
                textStyles.body, 
                { 
                  color: isActive 
                    ? colors.bg0 
                    : colors.textSecondary, 
                  fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_500Medium',
                  fontSize: 13,
                }
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[textStyles.body, { color: colors.error }]}>Failed to load tasks</Text>
        </View>
      ) : filteredTasks.length === 0 ? (
        <Animated.View entering={FadeInDown} style={styles.center}>
          <View style={[styles.emptyIconBg, { backgroundColor: colors.glassSoft }]}>
            <Ionicons 
              name={filter === 'completed' ? "checkmark-done-circle-outline" : "calendar-clear-outline"} 
              size={48} 
              color={colors.textMuted} 
            />
          </View>
          <Text style={[textStyles.sectionTitle, { color: colors.textPrimary, marginTop: spacing.lg }]}>
            {searchQuery ? "No matches found" : (filter === 'completed' ? "No completed tasks" : "You're all caught up!")}
          </Text>
          <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            {searchQuery ? "Try a different search term." : "Take a break or plan something new."}
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.$id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          windowSize={5}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={true}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 50).duration(400)}>
              <TaskItem 
                task={item} 
                onToggle={handleToggleTask} 
                onPress={handlePressTask} 
              />
            </Animated.View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push('/tasks/new')}
        style={[styles.fab, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 52,
    borderRadius: radii.full,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  tabsWrapper: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: 4,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radii.full,
  },
  tabActive: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 140, // space for FAB and floating tab bar
    gap: spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
    paddingHorizontal: spacing.xl,
  },
  emptyIconBg: {
    width: 96,
    height: 96,
    borderRadius: radii['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});
