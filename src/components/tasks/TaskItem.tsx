import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isPast, isToday, isTomorrow, startOfDay } from 'date-fns';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, radii } from '../../theme/tokens';
import { textStyles } from '../../theme/typography';
import { Checkbox } from '../ui/Checkbox';
import { AvatarStack } from '../ui/AvatarStack';
import { GlassCard } from '../ui/GlassCard';
import type { Task, TaskPriority } from '../../lib/api/tasks';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string, newStatus: 'todo' | 'done') => void;
  onPress: (taskId: string) => void;
}

const getPriorityColor = (priority: TaskPriority, colors: any) => {
  switch (priority) {
    case 'urgent': return colors.accent;
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

  // Parse subtasks to get progress
  let completedSubtasks = 0;
  let totalSubtasks = 0;
  if (task.subtasks && task.subtasks.length > 0) {
    totalSubtasks = task.subtasks.length;
    completedSubtasks = task.subtasks.filter(st => {
      try {
        const parsed = typeof st === 'string' ? JSON.parse(st) : st;
        return parsed.completed;
      } catch (e) {
        return false;
      }
    }).length;
  }

  // Calculate progress percentage
  const progressPercent = isDone 
    ? 100 
    : (totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(task.$id)}
      style={{ marginBottom: spacing.md }}
    >
      <GlassCard intensity={40} disableAndroidBlur={true} style={styles.container}>
        <View style={styles.headerRow}>
        <View style={styles.tagList}>
          <View style={[styles.tagBadge, { backgroundColor: priorityColor !== 'transparent' ? `${priorityColor}20` : colors.bg2 }]}>
            <Text style={[textStyles.caption, { color: priorityColor !== 'transparent' ? priorityColor : colors.textPrimary, fontWeight: 'bold' }]}>
              {task.priority !== 'none' ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Task'}
            </Text>
          </View>
          {task.tags && task.tags.length > 0 && (
            <View style={[styles.tagBadge, { backgroundColor: colors.bg2 }]}>
              <Text style={[textStyles.caption, { color: colors.textPrimary }]}>
                {task.tags[0]} {task.tags.length > 1 ? `+${task.tags.length - 1}` : ''}
              </Text>
            </View>
          )}
        </View>
        <Checkbox checked={isDone} onToggle={handleToggle} />
      </View>
      
      <Text
        style={[
          textStyles.headingSm,
          { color: isDone ? colors.textMuted : colors.textPrimary, marginTop: spacing.sm, marginBottom: spacing.xs },
          isDone && { textDecorationLine: 'line-through' }
        ]}
        numberOfLines={2}
      >
        {task.title}
      </Text>
      
      {task.description && (
        <Text style={[textStyles.bodySm, { color: colors.textMuted, marginBottom: spacing.sm }]} numberOfLines={2}>
          {task.description}
        </Text>
      )}

      {/* Metadata Row */}
      <View style={styles.metaRow}>
        {task.dueAt && (
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={isOverdue ? colors.error : colors.textMuted} />
            <Text style={[textStyles.caption, { color: isOverdue ? colors.error : colors.textMuted, fontWeight: '600' }]}>
              {formatDueDate(task.dueAt)}
            </Text>
          </View>
        )}
        {totalSubtasks > 0 && (
          <View style={styles.metaItem}>
            <Ionicons name="git-merge-outline" size={14} color={completedSubtasks === totalSubtasks ? colors.success : colors.textMuted} />
            <Text style={[textStyles.caption, { color: completedSubtasks === totalSubtasks ? colors.success : colors.textMuted, fontWeight: '600' }]}>
              {completedSubtasks}/{totalSubtasks}
            </Text>
          </View>
        )}
        {task.attachments && task.attachments.length > 0 && (
          <View style={styles.metaItem}>
            <Ionicons name="attach-outline" size={14} color={colors.textMuted} />
            <Text style={[textStyles.caption, { color: colors.textMuted }]}>{task.attachments.length}</Text>
          </View>
        )}
      </View>

      <View style={styles.footerRow}>
        <AvatarStack size={28} max={3} />
        
        <View style={styles.progressContainer}>
          <Text style={[textStyles.caption, { color: colors.textSecondary, marginBottom: 4, textAlign: 'right' }]}>
            {progressPercent}%
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.bg2 }]}>
            <View style={[styles.progressBar, { width: `${progressPercent}%`, backgroundColor: colors.success }]} />
          </View>
        </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagList: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.lg,
  },
  progressContainer: {
    width: 120,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
});
