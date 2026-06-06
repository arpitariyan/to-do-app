import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
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

export default function NewTaskScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const createTask = useCreateTask();

  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'none',
      pinned: false,
    },
  });

  const onSubmit = (data: TaskFormData) => {
    createTask.mutate(
      {
        ...data,
        dueAt: dueDate ? dueDate.toISOString() : undefined,
      },
      {
        onSuccess: () => {
          router.back();
        },
      }
    );
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
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
              autoFocus
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
});
