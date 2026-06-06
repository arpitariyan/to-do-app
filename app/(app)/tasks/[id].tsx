import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { useTasks, useUpdateTask, useDeleteTask } from '../../../src/hooks/useTasks';
import type { TaskPriority } from '../../../src/lib/api/tasks';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(512),
  description: z.string().max(4096).optional(),
  priority: z.enum(['none', 'low', 'medium', 'high']),
  pinned: z.boolean(),
});

type TaskFormData = z.infer<typeof taskSchema>;

const priorities: { label: string; value: TaskPriority; colorKey: 'textMuted' | 'success' | 'warning' | 'error' }[] = [
  { label: 'None', value: 'none', colorKey: 'textMuted' },
  { label: 'Low', value: 'low', colorKey: 'success' },
  { label: 'Medium', value: 'medium', colorKey: 'warning' },
  { label: 'High', value: 'high', colorKey: 'error' },
];

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  
  const { data: tasks, isLoading } = useTasks({ archived: false });
  const task = tasks?.find(t => t.$id === id);
  
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'none',
      pinned: false,
    },
  });

  // Populate form when task loads
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        pinned: task.pinned,
      });
      setDueDate(task.dueAt ? new Date(task.dueAt) : null);
    }
  }, [task, reset]);

  const onSubmit = (data: TaskFormData) => {
    updateTask.mutate(
      {
        id,
        payload: {
          ...data,
          dueAt: dueDate ? dueDate.toISOString() : undefined,
        },
      },
      {
        onSuccess: () => router.back(),
      }
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            deleteTask.mutate(id, {
              onSuccess: () => router.back()
            });
          }
        }
      ]
    );
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDueDate(selectedDate);
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </Screen>
    );
  }

  if (!task) {
    return (
      <Screen>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[textStyles.bodyLg, { color: colors.textMuted }]}>Task not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: spacing.md }}>
            <Text style={[textStyles.bodyMd, { color: colors.accent }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[textStyles.headingSm, { color: colors.textPrimary }]}>Edit Task</Text>
        <TouchableOpacity 
          onPress={handleSubmit(onSubmit)} 
          style={styles.headerBtn}
          disabled={!isDirty && task.dueAt !== (dueDate ? dueDate.toISOString() : undefined) && !updateTask.isPending}
        >
          <Text style={[textStyles.bodyMd, { color: colors.accent, fontWeight: '600' }]}>
            {updateTask.isPending ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
              style={{ fontSize: 18, borderBottomWidth: 0, paddingHorizontal: 0, paddingVertical: spacing.md }}
              containerStyle={{ marginBottom: spacing.sm }}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              placeholder="Add details (optional)"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              error={errors.description?.message}
              style={{ minHeight: 80, paddingHorizontal: 0 }}
              containerStyle={{ marginBottom: spacing.xl }}
            />
          )}
        />

        <Text style={[textStyles.labelSm, { color: colors.textMuted, marginBottom: spacing.sm, textTransform: 'uppercase' }]}>
          Properties
        </Text>

        <View style={[styles.propertyGroup, { backgroundColor: colors.bg1, borderColor: colors.border }]}>
          {/* Due Date Row */}
          <TouchableOpacity 
            style={[styles.propertyRow, { borderBottomColor: colors.border }]}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.propertyLabel}>
              <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
              <Text style={[textStyles.bodyMd, { color: colors.textPrimary }]}>Due Date</Text>
            </View>
            <View style={styles.propertyValue}>
              <Text style={[textStyles.bodyMd, { color: dueDate ? colors.accent : colors.textMuted }]}>
                {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Set date'}
              </Text>
              {dueDate && (
                <TouchableOpacity onPress={() => setDueDate(null)} style={{ marginLeft: 8 }}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>

          {/* Priority Row */}
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
                      style={[
                        styles.priorityBtn,
                        value === p.value && { backgroundColor: colors.bg3, borderColor: colors.border }
                      ]}
                    >
                      <Text style={[textStyles.bodySm, { color: colors[p.colorKey as keyof typeof colors] as string }]}>
                        {p.label}
                      </Text>
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

        {/* Delete Button */}
        <TouchableOpacity 
          style={[styles.deleteBtn, { backgroundColor: colors.errorSoft }]} 
          onPress={handleDelete}
          disabled={deleteTask.isPending}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <Text style={[textStyles.bodyMd, { color: colors.error, marginLeft: 8 }]}>Delete Task</Text>
        </TouchableOpacity>

      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display="default"
          onChange={onChangeDate}
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
    minWidth: 44,
    alignItems: 'center',
  },
  content: {
    padding: spacing.base,
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
  },
  priorityBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    marginTop: spacing.xl,
  },
});
