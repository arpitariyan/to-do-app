import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, radii } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { Checkbox } from '../ui/Checkbox';
import type { Task, TaskPriority } from '../../lib/api/tasks';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string, newStatus: 'todo' | 'done') => void;
  onPress: (taskId: string) => void;
}

const getPriorityColor = (priority: TaskPriority, colors: any) => {
  switch (priority) {
    case 'high': return colors.error;
    case 'medium': return colors.warning;
    case 'low': return colors.success;
    default: return 'transparent';
  }
};

const formatDueDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'MMM d');
};

export function TaskItem({ task, onToggle, onPress }: TaskItemProps) {
  const { colors } = useTheme();
  const isDone = task.status === 'done';

  const handleToggle = () => {
    onToggle(task.$id, isDone ? 'todo' : 'done');
  };

  const handlePress = () => {
    onPress(task.$id);
  };

  const priorityColor = getPriorityColor(task.priority, colors);
  const isOverdue = task.dueAt && isPast(new Date(task.dueAt)) && !isDone && !isToday(new Date(task.dueAt));

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(task.$id)}
      style={[
        styles.container,
        { backgroundColor: colors.bg1, borderColor: colors.border }
      ]}
    >
      <View style={styles.left}>
        <Checkbox checked={isDone} onToggle={handleToggle} />
      </View>
      
      <View style={styles.content}>
        <Text
          style={[
            textStyles.bodyMd,
            { color: isDone ? colors.textMuted : colors.textPrimary },
            isDone && { textDecorationLine: 'line-through' }
          ]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        
        {/* Metadata Row */}
        {(task.description || task.dueAt) && (
          <View style={styles.metaRow}>
            {task.dueAt && (
              <View style={styles.metaItem}>
                <Ionicons 
                  name="calendar-outline" 
                  size={12} 
                  color={isOverdue ? colors.error : colors.textMuted} 
                />
                <Text style={[
                  textStyles.caption, 
                  { color: isOverdue ? colors.error : colors.textMuted }
                ]}>
                  {formatDueDate(task.dueAt)}
                </Text>
              </View>
            )}
            
            {task.description && (
              <View style={styles.metaItem}>
                <Ionicons name="document-text-outline" size={12} color={colors.textMuted} />
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.right}>
        {task.priority !== 'none' && (
          <View 
            style={[styles.priorityIndicator, { backgroundColor: priorityColor }]} 
            accessibilityLabel={`Priority: ${task.priority}`}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  left: {
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  right: {
    marginLeft: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
