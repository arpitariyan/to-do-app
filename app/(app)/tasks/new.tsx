import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

import { useTheme } from '../../../src/theme/ThemeContext';
import { spacing, radii } from '../../../src/theme/tokens';
import { textStyles } from '../../../src/theme/typography';
import { Screen } from '../../../src/components/layout/Screen';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { useCreateTask } from '../../../src/hooks/useTasks';
import type { TaskPriority, TaskType, RepeatType } from '../../../src/lib/api/tasks';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(512),
  description: z.string().max(4096).optional(),
  priority: z.enum(['none', 'low', 'medium', 'high', 'urgent']),
  pinned: z.boolean(),
  taskType: z.enum(['one_time', 'recurring', 'deadline', 'reminder_only', 'checklist']).optional(),
  repeatType: z.enum(['none', 'daily', 'weekly', 'monthly', 'custom', 'weekday']).optional(),
  durationMinutes: z.string().optional(),
  notes: z.string().optional(),
  location: z.string().optional(),
  projectId: z.string().optional(),
  categoryId: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

const priorities: { label: string; value: TaskPriority; colorKey: 'textMuted' | 'success' | 'warning' | 'error' | 'accent' }[] = [
  { label: 'None', value: 'none', colorKey: 'textMuted' },
  { label: 'Low', value: 'low', colorKey: 'success' },
  { label: 'Med', value: 'medium', colorKey: 'warning' },
  { label: 'High', value: 'high', colorKey: 'error' },
  { label: 'Urgent', value: 'urgent', colorKey: 'accent' },
];

const taskTypes: { label: string; value: TaskType }[] = [
  { label: 'One-Time', value: 'one_time' },
  { label: 'Recurring', value: 'recurring' },
  { label: 'Deadline', value: 'deadline' },
  { label: 'Checklist', value: 'checklist' },
];

export default function NewTaskScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const createTask = useCreateTask();

  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [dueTime, setDueTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Subtasks and Tags state
  const [subtasks, setSubtasks] = useState<{id: string, title: string, completed: boolean}[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'none',
      pinned: false,
      taskType: 'one_time',
      repeatType: 'none',
    },
  });

  const onSubmit = (data: TaskFormData) => {
    // Combine date and time
    let finalDueAt = undefined;
    if (dueDate) {
      const combined = new Date(dueDate);
      if (dueTime) {
        combined.setHours(dueTime.getHours(), dueTime.getMinutes(), 0, 0);
      } else {
        combined.setHours(23, 59, 59, 999);
      }
      finalDueAt = combined.toISOString();
    }

    createTask.mutate(
      {
        ...data,
        durationMinutes: data.durationMinutes ? Number(data.durationMinutes) : undefined,
        dueAt: finalDueAt,
        subtasks: subtasks.map(st => JSON.stringify(st)),
        tags: tags,
      },
      {
        onSuccess: () => {
          router.back();
        },
      }
    );
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, { id: Date.now().toString(), title: newSubtask.trim(), completed: false }]);
      setNewSubtask('');
    }
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDueDate(selectedDate);
  };

  const onChangeTime = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) setDueTime(selectedDate);
  };

  return (
    <Screen>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={[textStyles.bodyMd, { color: colors.textMuted }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[textStyles.headingSm, { color: colors.textPrimary }]}>New Task</Text>
        <TouchableOpacity 
          onPress={handleSubmit(onSubmit)} 
          style={styles.headerBtn}
          disabled={createTask.isPending}
        >
          <Text style={[textStyles.bodyMd, { color: colors.accent, fontWeight: '600' }]}>
            {createTask.isPending ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          {/* AI Assist Button */}
          <TouchableOpacity style={[styles.aiAssistBtn, { backgroundColor: colors.bg2, borderColor: colors.border }]}>
            <Ionicons name="sparkles" size={20} color={colors.accent} />
            <Text style={[textStyles.body, { color: colors.accent, marginLeft: spacing.sm, fontWeight: '600' }]}>
              AI Assist (Draft)
            </Text>
          </TouchableOpacity>

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                placeholder="What needs to be done?"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.title?.message}
                autoFocus
                style={{ fontSize: 22, fontWeight: '600', borderBottomWidth: 0, paddingHorizontal: 0, paddingVertical: spacing.md }}
                containerStyle={{ marginBottom: spacing.sm }}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <Input
                placeholder="Add details (optional)"
                value={value}
                onChangeText={onChange}
                multiline
                style={{ minHeight: 60, paddingHorizontal: 0 }}
                containerStyle={{ marginBottom: spacing.xl }}
              />
            )}
          />

          <Text style={[textStyles.labelSm, { color: colors.textMuted, marginBottom: spacing.sm, textTransform: 'uppercase' }]}>Schedule</Text>
          <View style={[styles.propertyGroup, { backgroundColor: colors.bg1, borderColor: colors.border, marginBottom: spacing.xl }]}>
            
            {/* Due Date */}
            <TouchableOpacity style={[styles.propertyRow, { borderBottomColor: colors.border }]} onPress={() => setShowDatePicker(true)}>
              <View style={styles.propertyLabel}>
                <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
                <Text style={[textStyles.bodyMd, { color: colors.textPrimary }]}>Date</Text>
              </View>
              <View style={styles.propertyValue}>
                <Text style={[textStyles.bodyMd, { color: dueDate ? colors.textPrimary : colors.textMuted }]}>
                  {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Set date'}
                </Text>
                {dueDate && (
                  <TouchableOpacity onPress={() => setDueDate(null)} style={{ marginLeft: 8 }}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>

            {/* Due Time */}
            <TouchableOpacity style={[styles.propertyRow, { borderBottomColor: 'transparent' }]} onPress={() => setShowTimePicker(true)}>
              <View style={styles.propertyLabel}>
                <Ionicons name="time-outline" size={20} color={colors.textMuted} />
                <Text style={[textStyles.bodyMd, { color: colors.textPrimary }]}>Time</Text>
              </View>
              <View style={styles.propertyValue}>
                <Text style={[textStyles.bodyMd, { color: dueTime ? colors.textPrimary : colors.textMuted }]}>
                  {dueTime ? format(dueTime, 'h:mm a') : 'Set time'}
                </Text>
                {dueTime && (
                  <TouchableOpacity onPress={() => setDueTime(null)} style={{ marginLeft: 8 }}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>

          </View>

          <Text style={[textStyles.labelSm, { color: colors.textMuted, marginBottom: spacing.sm, textTransform: 'uppercase' }]}>Organization</Text>
          <View style={[styles.propertyGroup, { backgroundColor: colors.bg1, borderColor: colors.border, marginBottom: spacing.xl }]}>
            
            {/* Priority */}
            <Controller
              control={control}
              name="priority"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.propertyRow, { borderBottomColor: colors.border, flexDirection: 'column', alignItems: 'stretch' }]}>
                  <View style={[styles.propertyLabel, { marginBottom: spacing.sm }]}>
                    <Ionicons name="flag-outline" size={20} color={colors.textMuted} />
                    <Text style={[textStyles.bodyMd, { color: colors.textPrimary }]}>Priority</Text>
                  </View>
                  <View style={styles.prioritySelector}>
                    {priorities.map(p => (
                      <TouchableOpacity
                        key={p.value}
                        onPress={() => onChange(p.value)}
                        style={[styles.priorityBtn, value === p.value && { backgroundColor: colors.bg3, borderColor: colors.border }]}
                      >
                        <Text style={[textStyles.bodySm, { color: colors[p.colorKey as keyof typeof colors] as string }]}>{p.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            />

            {/* Task Type */}
            <Controller
              control={control}
              name="taskType"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.propertyRow, { borderBottomColor: colors.border, flexDirection: 'column', alignItems: 'stretch' }]}>
                  <View style={[styles.propertyLabel, { marginBottom: spacing.sm }]}>
                    <Ionicons name="layers-outline" size={20} color={colors.textMuted} />
                    <Text style={[textStyles.bodyMd, { color: colors.textPrimary }]}>Type</Text>
                  </View>
                  <View style={styles.prioritySelector}>
                    {taskTypes.map(t => (
                      <TouchableOpacity
                        key={t.value}
                        onPress={() => onChange(t.value)}
                        style={[styles.priorityBtn, value === t.value && { backgroundColor: colors.bg3, borderColor: colors.border }]}
                      >
                        <Text style={[textStyles.bodySm, { color: value === t.value ? colors.textPrimary : colors.textMuted }]}>{t.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            />

            {/* Pinned Row */}
            <Controller
              control={control}
              name="pinned"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.propertyRow, { borderBottomColor: 'transparent' }]}>
                  <View style={styles.propertyLabel}>
                    <Ionicons name="pin-outline" size={20} color={colors.textMuted} />
                    <Text style={[textStyles.bodyMd, { color: colors.textPrimary }]}>Pin to top</Text>
                  </View>
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: colors.bg3, true: colors.accentMid }}
                    thumbColor={value ? colors.accent : colors.textMuted}
                  />
                </View>
              )}
            />
          </View>

          {/* Subtasks Section */}
          <Text style={[textStyles.labelSm, { color: colors.textMuted, marginBottom: spacing.sm, textTransform: 'uppercase' }]}>Subtasks</Text>
          <View style={[styles.propertyGroup, { backgroundColor: colors.bg1, borderColor: colors.border, marginBottom: spacing.xl, padding: spacing.md }]}>
            {subtasks.map(st => (
              <View key={st.id} style={styles.subtaskItem}>
                <Ionicons name="ellipse-outline" size={18} color={colors.textMuted} />
                <Text style={[textStyles.body, { color: colors.textPrimary, flex: 1, marginLeft: spacing.sm }]}>{st.title}</Text>
                <TouchableOpacity onPress={() => handleRemoveSubtask(st.id)}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.subtaskInputRow}>
              <Ionicons name="add" size={20} color={colors.textMuted} />
              <Input
                placeholder="Add subtask..."
                value={newSubtask}
                onChangeText={setNewSubtask}
                onSubmitEditing={handleAddSubtask}
                containerStyle={{ flex: 1, marginLeft: spacing.sm, marginBottom: 0 }}
                style={{ paddingVertical: spacing.sm, borderBottomWidth: 0 }}
              />
              <Button label="Add" onPress={handleAddSubtask} variant="ghost" size="sm" />
            </View>
          </View>

          {/* Tags Section */}
          <Text style={[textStyles.labelSm, { color: colors.textMuted, marginBottom: spacing.sm, textTransform: 'uppercase' }]}>Tags</Text>
          <View style={[styles.propertyGroup, { backgroundColor: colors.bg1, borderColor: colors.border, marginBottom: spacing.xl, padding: spacing.md }]}>
            <View style={styles.tagsContainer}>
              {tags.map(tag => (
                <View key={tag} style={[styles.tagChip, { backgroundColor: colors.bg3 }]}>
                  <Text style={[textStyles.labelSm, { color: colors.textPrimary }]}>#{tag}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(tag)} style={{ marginLeft: 4 }}>
                    <Ionicons name="close" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={[styles.subtaskInputRow, { marginTop: tags.length > 0 ? spacing.sm : 0 }]}>
              <Ionicons name="pricetag-outline" size={20} color={colors.textMuted} />
              <Input
                placeholder="Add tag (e.g. Work)"
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={handleAddTag}
                containerStyle={{ flex: 1, marginLeft: spacing.sm, marginBottom: 0 }}
                style={{ paddingVertical: spacing.sm, borderBottomWidth: 0 }}
              />
              <Button label="Add" onPress={handleAddTag} variant="ghost" size="sm" />
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={dueTime || new Date()}
          mode="time"
          display="default"
          onChange={onChangeTime}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerBtn: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.base,
    paddingBottom: 100,
  },
  aiAssistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: spacing.lg,
  },
  propertyGroup: {
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  propertyLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  propertyValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prioritySelector: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  priorityBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 60,
    alignItems: 'center',
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  subtaskInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
});
