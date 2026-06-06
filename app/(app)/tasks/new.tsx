import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform, KeyboardAvoidingView, ActivityIndicator, Linking, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useCreateTask } from '../../../src/hooks/useTasks';
import { scheduleTaskReminder } from '../../../src/hooks/useNotifications';
import { useAttachments, Attachment } from '../../../src/hooks/useAttachments';
import type { TaskPriority, TaskType, RepeatType } from '../../../src/lib/api/tasks';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(512),
  description: z.string().max(4096).optional(),
  priority: z.enum(['none', 'low', 'medium', 'high', 'urgent']),
  pinned: z.boolean(),
  repeatType: z.enum(['none', 'daily', 'weekly', 'monthly', 'custom', 'weekday']).optional(),
  durationMinutes: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

const priorities: { label: string; value: TaskPriority; colorKey: 'textMuted' | 'success' | 'warning' | 'error' | 'accent' }[] = [
  { label: 'None', value: 'none', colorKey: 'textMuted' },
  { label: 'Low', value: 'low', colorKey: 'success' },
  { label: 'Med', value: 'medium', colorKey: 'warning' },
  { label: 'High', value: 'high', colorKey: 'error' },
  { label: 'Urgent', value: 'urgent', colorKey: 'accent' },
];

const repeatTypes: { label: string; value: RepeatType }[] = [
  { label: 'One-Time', value: 'none' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const reminderPresets = [
  { label: 'None', value: 'none' },
  { label: 'At time', value: '0' },
  { label: '5 min before', value: '5' },
  { label: '15 min before', value: '15' },
  { label: '30 min before', value: '30' },
  { label: '1 hr before', value: '60' },
  { label: '1 day before', value: '1440' },
];

export default function NewTaskScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createTask = useCreateTask();
  const { pickDocument, uploadFile, isUploading, getFileViewUrl } = useAttachments();

  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [dueTime, setDueTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [reminderType, setReminderType] = useState('none');
  const [subtasks, setSubtasks] = useState<{id: string, title: string, completed: boolean}[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const { control, handleSubmit, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'none',
      pinned: false,
      repeatType: 'none',
    },
  });

  const handleAddAttachment = async () => {
    try {
      const file = await pickDocument();
      if (file) {
        // We upload it immediately and store the generated ID
        const fileId = await uploadFile(file);
        const newAttachment = { ...file, id: fileId, url: getFileViewUrl(fileId) };
        setAttachments(prev => [...prev, newAttachment]);
      }
    } catch (e: any) {
      alert(e.message || 'Error attaching file');
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const onSubmit = async (data: TaskFormData) => {
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
        taskType: data.repeatType !== 'none' ? 'recurring' : 'one_time',
        durationMinutes: data.durationMinutes ? Number(data.durationMinutes) : undefined,
        dueAt: finalDueAt,
        subtasks: subtasks.map(st => JSON.stringify(st)),
        tags: tags,
        reminders: reminderType !== 'none' ? [reminderType] : [],
        attachments: attachments.map(a => JSON.stringify(a)),
      },
      {
        onSuccess: async (createdTask) => {
          if (finalDueAt && reminderType !== 'none') {
            const minutesToSubtract = parseInt(reminderType, 10);
            const triggerTime = new Date(finalDueAt);
            triggerTime.setMinutes(triggerTime.getMinutes() - minutesToSubtract);
            
            if (triggerTime.getTime() > Date.now()) {
              await scheduleTaskReminder(
                createdTask.$id,
                createdTask.title,
                createdTask.description || '',
                triggerTime,
                createdTask.repeatType as any
              );
            }
          }
          router.back();
        },
      }
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[textStyles.headingSm, { color: colors.textPrimary }]}>New Task</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={{ marginBottom: spacing.sm }}>
                <TextInput
                  placeholder="What needs to be done?"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholderTextColor={colors.textMuted}
                  style={{ fontSize: 32, fontWeight: '700', color: colors.textPrimary, paddingVertical: spacing.sm, includeFontPadding: false }}
                />
                {errors.title?.message && (
                  <Text style={[textStyles.caption, { color: colors.error }]}>{errors.title.message}</Text>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextInput
                placeholder="Add notes, context, or links..."
                value={value}
                onChangeText={onChange}
                multiline
                placeholderTextColor={colors.textMuted}
                style={{ fontSize: 16, color: colors.textSecondary, minHeight: 60, paddingVertical: spacing.sm, marginBottom: spacing.xl, textAlignVertical: 'top' }}
              />
            )}
          />

          <Text style={[textStyles.labelSm, { color: colors.textMuted, marginBottom: spacing.sm, marginLeft: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 }]}>Schedule & Alerts</Text>
          <View style={[styles.card, { backgroundColor: colors.bg2, borderColor: colors.border }]}>
            {/* Due Date & Time Side by Side */}
            <View style={{ flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
              <TouchableOpacity style={[styles.propertyRowHalf, { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border }]} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={20} color={dueDate ? colors.accent : colors.textMuted} />
                <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                  <Text style={[textStyles.caption, { color: colors.textMuted }]}>Date</Text>
                  <Text style={[textStyles.bodyMd, { color: dueDate ? colors.textPrimary : colors.textMuted, fontWeight: dueDate ? '600' : '400' }]}>
                    {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Anytime'}
                  </Text>
                </View>
                {dueDate && (
                  <TouchableOpacity onPress={() => setDueDate(null)}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.propertyRowHalf} onPress={() => setShowTimePicker(true)}>
                <Ionicons name="time-outline" size={20} color={dueTime ? colors.accent : colors.textMuted} />
                <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                  <Text style={[textStyles.caption, { color: colors.textMuted }]}>Time</Text>
                  <Text style={[textStyles.bodyMd, { color: dueTime ? colors.textPrimary : colors.textMuted, fontWeight: dueTime ? '600' : '400' }]}>
                    {dueTime ? format(dueTime, 'h:mm a') : 'All day'}
                  </Text>
                </View>
                {dueTime && (
                  <TouchableOpacity onPress={() => setDueTime(null)}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            {/* Repeat Type */}
            <Controller
              control={control}
              name="repeatType"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.propertyRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                  <View style={styles.propertyLabel}>
                    <Ionicons name="repeat-outline" size={20} color={colors.textMuted} />
                    <Text style={[textStyles.bodyMd, { color: colors.textPrimary }]}>Repeat</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollSelector}>
                    {repeatTypes.map(t => (
                      <TouchableOpacity
                        key={t.value}
                        onPress={() => onChange(t.value)}
                        style={[styles.chipBtn, value === t.value && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                      >
                        <Text style={[textStyles.bodySm, { color: value === t.value ? '#fff' : colors.textSecondary }]}>{t.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            />

            {/* Reminder */}
            {dueDate && (
              <View style={styles.propertyRow}>
                <View style={styles.propertyLabel}>
                  <Ionicons name="notifications-outline" size={20} color={colors.textMuted} />
                  <Text style={[textStyles.bodyMd, { color: colors.textPrimary }]}>Alert</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollSelector}>
                  {reminderPresets.map(preset => (
                    <TouchableOpacity
                      key={preset.value}
                      onPress={() => setReminderType(preset.value)}
                      style={[styles.chipBtn, reminderType === preset.value && { backgroundColor: colors.warning, borderColor: colors.warning }]}
                    >
                      <Text style={[textStyles.bodySm, { color: reminderType === preset.value ? '#000' : colors.textSecondary, fontWeight: reminderType === preset.value ? '600' : '400' }]}>{preset.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Attachments Section */}
          <Text style={[textStyles.labelSm, { color: colors.textMuted, marginBottom: spacing.sm, marginLeft: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 }]}>Attachments</Text>
          <View style={[styles.card, { backgroundColor: colors.bg2, borderColor: colors.border, padding: spacing.md }]}>
            
            {attachments.length > 0 && (
              <View style={styles.attachmentList}>
                {attachments.map(file => (
                  <View key={file.id} style={[styles.attachmentItem, { backgroundColor: colors.bg3, borderColor: colors.border }]}>
                    <Ionicons name={file.type.includes('image') ? 'image-outline' : 'document-text-outline'} size={24} color={colors.accent} />
                    <View style={{ flex: 1, marginLeft: spacing.sm }}>
                      <Text style={[textStyles.bodySm, { color: colors.textPrimary }]} numberOfLines={1}>{file.name}</Text>
                      <Text style={[textStyles.caption, { color: colors.textMuted }]}>{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveAttachment(file.id)} style={{ padding: 4 }}>
                      <Ionicons name="close" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={[styles.dashedUploadBtn, { borderColor: colors.border }]} 
              onPress={handleAddAttachment}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color={colors.textMuted} />
                  <Text style={[textStyles.bodyMd, { color: colors.textMuted, marginLeft: spacing.sm }]}>Tap to Upload File (Max 10MB)</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Organization */}
          <Text style={[textStyles.labelSm, { color: colors.textMuted, marginBottom: spacing.sm, marginLeft: spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 }]}>Organization</Text>
          <View style={[styles.card, { backgroundColor: colors.bg2, borderColor: colors.border, marginBottom: spacing.xl }]}>
            
            {/* Priority */}
            <Controller
              control={control}
              name="priority"
              render={({ field: { onChange, value } }) => (
                <View style={[styles.propertyRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                  <View style={styles.propertyLabel}>
                    <Ionicons name="flag-outline" size={20} color={colors.textMuted} />
                    <Text style={[textStyles.bodyMd, { color: colors.textPrimary }]}>Priority</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollSelector}>
                    {priorities.map(p => (
                      <TouchableOpacity
                        key={p.value}
                        onPress={() => onChange(p.value)}
                        style={[styles.chipBtn, value === p.value && { backgroundColor: colors.bg3, borderColor: colors.border }]}
                      >
                        <Text style={[textStyles.bodySm, { color: value === p.value ? colors[p.colorKey as keyof typeof colors] as string : colors.textMuted, fontWeight: value === p.value ? '600' : '400' }]}>{p.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            />

            {/* Subtasks UI Minimal */}
            <View style={[styles.propertyRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingVertical: spacing.md }]}>
               <View style={{ flex: 1 }}>
                 {subtasks.map(st => (
                   <View key={st.id} style={[styles.subtaskItem, { borderBottomColor: colors.border }]}>
                     <Ionicons name="ellipse-outline" size={14} color={colors.textMuted} />
                     <Text style={[textStyles.bodyMd, { color: colors.textPrimary, flex: 1, marginLeft: spacing.sm }]} numberOfLines={1}>{st.title}</Text>
                     <TouchableOpacity onPress={() => setSubtasks(subtasks.filter(s => s.id !== st.id))}>
                       <Ionicons name="close" size={18} color={colors.error} />
                     </TouchableOpacity>
                   </View>
                 ))}
                 <View style={styles.subtaskInputRow}>
                    <Ionicons name="add-circle-outline" size={20} color={colors.textMuted} />
                    <Input
                      placeholder="Add subtask..."
                      value={newSubtask}
                      onChangeText={setNewSubtask}
                      onSubmitEditing={() => {
                        if (newSubtask.trim()) {
                          setSubtasks([...subtasks, { id: Date.now().toString(), title: newSubtask.trim(), completed: false }]);
                          setNewSubtask('');
                        }
                      }}
                      containerStyle={{ flex: 1, marginLeft: spacing.sm, marginBottom: 0 }}
                      style={{ paddingVertical: spacing.xs, borderBottomWidth: 0, fontSize: 16 }}
                    />
                 </View>
               </View>
            </View>

            {/* Tags UI Minimal */}
            <View style={[styles.propertyRow, { paddingVertical: spacing.md }]}>
               <View style={{ flex: 1 }}>
                 {tags.length > 0 && (
                   <View style={styles.tagsContainer}>
                     {tags.map(tag => (
                       <View key={tag} style={[styles.tagBadge, { backgroundColor: colors.bg3, borderColor: colors.border }]}>
                         <Text style={[textStyles.caption, { color: colors.textPrimary }]}>#{tag}</Text>
                         <TouchableOpacity onPress={() => setTags(tags.filter(t => t !== tag))} style={{ marginLeft: 6 }}>
                           <Ionicons name="close" size={12} color={colors.textMuted} />
                         </TouchableOpacity>
                       </View>
                     ))}
                   </View>
                 )}
                 <View style={styles.subtaskInputRow}>
                    <Ionicons name="pricetag-outline" size={20} color={colors.textMuted} />
                    <Input
                      placeholder="Add tag (e.g. Work, Urgent)"
                      value={newTag}
                      onChangeText={setNewTag}
                      onSubmitEditing={() => {
                        if (newTag.trim() && !tags.includes(newTag.trim())) {
                          setTags([...tags, newTag.trim()]);
                          setNewTag('');
                        }
                      }}
                      containerStyle={{ flex: 1, marginLeft: spacing.sm, marginBottom: 0 }}
                      style={{ paddingVertical: spacing.xs, borderBottomWidth: 0, fontSize: 16 }}
                    />
                 </View>
               </View>
            </View>

          </View>
          
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Floating Action Button */}
        <View style={[styles.floatingAction, { bottom: Math.max(insets.bottom, spacing.base) + spacing.md }]}>
          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: createTask.isPending || isUploading ? colors.textMuted : colors.accent }]}
            onPress={handleSubmit(onSubmit)}
            disabled={createTask.isPending || isUploading}
            activeOpacity={0.8}
          >
            {createTask.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={[textStyles.bodyLg, { color: '#fff', fontWeight: '600', marginLeft: spacing.sm }]}>Create Task</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker value={dueDate || new Date()} mode="date" display="default" onChange={(e, d) => { setShowDatePicker(false); if(d) setDueDate(d); }} />
      )}
      {showTimePicker && (
        <DateTimePicker value={dueTime || new Date()} mode="time" display="default" onChange={(e, d) => { setShowTimePicker(false); if(d) setDueTime(d); }} />
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
    paddingVertical: spacing.sm,
  },
  headerBtn: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.base,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  propertyRowHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  propertyRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  propertyLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  scrollSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  chipBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subtaskInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  attachmentList: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  dashedUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radii.lg,
  },
  floatingAction: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radii.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
