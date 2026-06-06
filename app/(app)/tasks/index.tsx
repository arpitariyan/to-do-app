import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../src/theme/ThemeContext';
import { spacing, radii } from '../../../src/theme/tokens';
import { textStyles } from '../../../src/theme/typography';
import { Screen } from '../../../src/components/layout/Screen';
import { TaskItem } from '../../../src/components/tasks/TaskItem';
import { useTasks, useUpdateTask } from '../../../src/hooks/useTasks';
import type { TaskStatus } from '../../../src/lib/api/tasks';

export default function TasksScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  
  const [filter, setFilter] = useState<'todo' | 'done'>('todo');
  
  // Fetch tasks using React Query
  const { data: tasks, isLoading, error } = useTasks({ 
    archived: false,
    status: filter === 'done' ? 'done' : undefined // If 'todo', we might want to fetch 'todo' + 'in_progress', but API handles exact match. We'll filter on client for multiple if needed, or update API. Wait, API only supports exact status or undefined. If undefined, we get all, then filter locally, or we fetch everything and filter locally. Let's fetch all active tasks and filter locally to avoid refetching on tab switch.
  });
  
  const updateTask = useUpdateTask();

  const handleToggleTask = (id: string, newStatus: 'todo' | 'done') => {
    updateTask.mutate({ id, payload: { status: newStatus } });
  };

  const handlePressTask = (id: string) => {
    router.push({ pathname: '/tasks/[id]', params: { id } });
  };

  // Filter tasks locally to allow instant tab switching
  const filteredTasks = tasks?.filter(t => 
    filter === 'todo' ? t.status !== 'done' : t.status === 'done'
  ) || [];

  return (
    <Screen withBottomPad>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[textStyles.headingLg, { color: colors.textPrimary }]}>Tasks</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.bg2 }]}>
        <TouchableOpacity 
          style={[styles.tab, filter === 'todo' && { backgroundColor: colors.bg1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }]} 
          onPress={() => setFilter('todo')}
        >
          <Text style={[textStyles.labelMd, { color: filter === 'todo' ? colors.textPrimary : colors.textMuted }]}>To-Do</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, filter === 'done' && { backgroundColor: colors.bg1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }]} 
          onPress={() => setFilter('done')}
        >
          <Text style={[textStyles.labelMd, { color: filter === 'done' ? colors.textPrimary : colors.textMuted }]}>Completed</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[textStyles.bodyMd, { color: colors.error }]}>Failed to load tasks</Text>
        </View>
      ) : filteredTasks.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.border} />
          <Text style={[textStyles.bodyLg, { color: colors.textMuted, marginTop: spacing.md }]}>
            {filter === 'todo' ? "You're all caught up!" : "No completed tasks yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.$id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TaskItem 
              task={item} 
              onToggle={handleToggleTask} 
              onPress={handlePressTask} 
            />
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/tasks/new')}
        style={[styles.fab, { backgroundColor: colors.accent }]}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.base,
    padding: 4,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.md,
  },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 100, // space for FAB
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
