import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, TextInput, Modal, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';

import { useTheme } from '../../../src/theme/ThemeContext';
import { spacing, radii } from '../../../src/theme/tokens';
import { textStyles } from '../../../src/theme/typography';
import { Screen } from '../../../src/components/layout/Screen';
import { useCreateTask } from '../../../src/hooks/useTasks';
import { scheduleTaskReminder } from '../../../src/hooks/useNotifications';
import { useAttachments, Attachment } from '../../../src/hooks/useAttachments';
import type { TaskPriority, RepeatType } from '../../../src/lib/api/tasks';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(512),
  description: z.string().max(4096).optional(),
  priority: z.enum(['none', 'low', 'medium', 'high', 'urgent']),
  pinned: z.boolean(),
  repeatType: z.enum(['none', 'daily', 'weekly', 'monthly', 'custom', 'weekday']).optional(),
  durationMinutes: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

const priorities: { label: string; value: TaskPriority; colorKey: string }[] = [
  { label: 'None', value: 'none', colorKey: '#94A3B8' },
  { label: 'Low', value: 'low', colorKey: '#10B981' },
  { label: 'Med', value: 'medium', colorKey: '#F59E0B' },
  { label: 'High', value: 'high', colorKey: '#EF4444' },
  { label: 'Urgent', value: 'urgent', colorKey: '#8B5CF6' },
];

const repeatTypes: { label: string; value: RepeatType; icon: any }[] = [
  { label: 'No Repeat', value: 'none', icon: 'close-circle' },
  { label: 'Daily', value: 'daily', icon: 'repeat' },
  { label: 'Weekly', value: 'weekly', icon: 'calendar-outline' },
  { label: 'Monthly', value: 'monthly', icon: 'calendar' },
];

const reminderTypes: { label: string; value: string; icon: any }[] = [
  { label: 'No Alert', value: 'none', icon: 'notifications-off' },
  { label: '5 mins before', value: '5', icon: 'notifications' },
  { label: '10 mins before', value: '10', icon: 'notifications' },
  { label: '15 mins before', value: '15', icon: 'notifications' },
  { label: '30 mins before', value: '30', icon: 'notifications' },
  { label: '1 hour before', value: '60', icon: 'notifications' },
];

export default function NewTaskScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createTask = useCreateTask();
  const { pickDocument, uploadFile, isUploading, getFileViewUrl } = useAttachments();
  const isDark = colors.bg1 !== '#FFFFFF';

  // Extract dynamic colors with fallbacks just in case
  const accentSoft = (colors as any).accentSoft || 'rgba(124, 58, 237, 0.15)';
  const warningSoft = (colors as any).warningSoft || 'rgba(245, 158, 11, 0.15)';
  const successSoft = (colors as any).successSoft || 'rgba(16, 185, 129, 0.15)';
  const errorSoft = (colors as any).errorSoft || 'rgba(239, 68, 68, 0.15)';

  const [dueDate, setDueDate] = useState<Date | null>(new Date());
  const [dueTime, setDueTime] = useState<Date | null>(null);
  
  // Modals state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState<'priority' | 'repeat' | 'alert' | null>(null);
  
  // Custom Calendar State
  const [calMonth, setCalMonth] = useState(startOfMonth(new Date()));

  // Custom Time State
  const [selHour, setSelHour] = useState('12');
  const [selMin, setSelMin] = useState('00');
  const [selAmPm, setSelAmPm] = useState('AM');
  const timerRef = useRef<any>(null);

  const stepTime = (type: 'hour' | 'min', direction: 1 | -1) => {
    if (type === 'hour') {
      setSelHour(prev => {
        let v = parseInt(prev, 10);
        if (isNaN(v)) v = 12;
        v += direction;
        if (v > 12) v = 1;
        if (v < 1) v = 12;
        return String(v);
      });
    } else {
      setSelMin(prev => {
        let v = parseInt(prev, 10);
        if (isNaN(v)) v = 0;
        v += direction;
        if (v > 59) v = 0;
        if (v < 0) v = 59;
        return String(v).padStart(2, '0');
      });
    }
  };

  const startScroll = (type: 'hour' | 'min', direction: 1 | -1) => {
    stepTime(type, direction);
    timerRef.current = setTimeout(() => {
      timerRef.current = setInterval(() => {
        stepTime(type, direction);
      }, 100);
    }, 400);
  };

  const stopScroll = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current as any);
      clearInterval(timerRef.current as any);
      timerRef.current = null;
    }
  };

  const [reminderType, setReminderType] = useState('none');
  const [subtasks, setSubtasks] = useState<{id: string, title: string, completed: boolean}[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'none',
      pinned: false,
      repeatType: 'none',
    },
  });

  const selectedPriority = watch('priority');
  const selectedRepeat = watch('repeatType');

  const handleAddAttachment = async () => {
    try {
      const file = await pickDocument();
      if (file) {
        const fileId = await uploadFile(file);
        const newAttachment = { ...file, id: fileId, url: getFileViewUrl(fileId) };
        setAttachments(prev => [...prev, newAttachment]);
      }
    } catch (e: any) {
      alert(e.message || 'Error attaching file');
    }
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
        tags: [],
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
              await scheduleTaskReminder(createdTask.$id, createdTask.title, createdTask.description || '', triggerTime, createdTask.repeatType as any);
            }
          }
          router.back();
        },
      }
    );
  };

  const renderCalendarModal = () => {
    const daysInMonth = eachDayOfInterval({ start: calMonth, end: endOfMonth(calMonth) });
    const startDayOfWeek = getDay(calMonth);
    const blanks = Array.from({ length: startDayOfWeek }).map((_, i) => <View key={`blank-${i}`} style={styles.calDay} />);

    return (
      <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bg1 }]}>
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={() => setCalMonth(subMonths(calMonth, 1))} style={styles.iconBtnSmall}>
                <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[textStyles.headingMd, { color: colors.textPrimary }]}>{format(calMonth, 'MMMM yyyy')}</Text>
              <TouchableOpacity onPress={() => setCalMonth(addMonths(calMonth, 1))} style={styles.iconBtnSmall}>
                <Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.calGrid}>
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <View key={d} style={styles.calDay}><Text style={[textStyles.caption, { color: colors.textMuted, fontWeight: '700' }]}>{d}</Text></View>
              ))}
              {blanks}
              {daysInMonth.map(d => {
                const isSelected = dueDate && isSameDay(d, dueDate);
                const isToday = isSameDay(d, new Date());
                return (
                  <TouchableOpacity 
                    key={d.toISOString()} 
                    style={[styles.calDay, isSelected && { backgroundColor: colors.accent, borderRadius: radii.xl }]} 
                    onPress={() => { setDueDate(d); setShowDatePicker(false); }}
                  >
                    <Text style={[textStyles.bodyMd, { color: isSelected ? '#FFF' : (isToday ? colors.accent : colors.textPrimary), fontWeight: isToday || isSelected ? '700' : '400' }]}>
                      {format(d, 'd')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg }}>
               <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.bg2, flex: 1, marginRight: 8 }]} onPress={() => { setDueDate(null); setShowDatePicker(false); }}>
                 <Text style={[textStyles.bodyMd, { color: colors.textPrimary, fontWeight: '600' }]}>Clear</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.accent, flex: 1, marginLeft: 8 }]} onPress={() => setShowDatePicker(false)}>
                 <Text style={[textStyles.bodyMd, { color: '#FFF', fontWeight: '600' }]}>Done</Text>
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderTimeModal = () => {
    return (
      <Modal visible={showTimePicker} transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bg1 }]}>
             <View style={styles.modalHeader}>
               <View style={[styles.modalIconBox, { backgroundColor: warningSoft }]}>
                 <Ionicons name="time" size={24} color={colors.warning} />
               </View>
               <Text style={[textStyles.headingMd, { color: colors.textPrimary, marginLeft: spacing.sm }]}>Set Exact Time</Text>
             </View>
             
             <View style={styles.timeInputRow}>
               <View style={{ alignItems: 'center' }}>
                 <TouchableOpacity onPressIn={() => startScroll('hour', 1)} onPressOut={stopScroll} style={styles.spinBtn}>
                   <Ionicons name="chevron-up" size={28} color={colors.textPrimary} />
                 </TouchableOpacity>
                 <TextInput
                   style={[styles.timeInputBox, { backgroundColor: colors.bg2, color: colors.textPrimary, borderColor: colors.border, borderWidth: 1 }]}
                   keyboardType="number-pad"
                   maxLength={2}
                   placeholder="12"
                   placeholderTextColor={colors.textMuted}
                   value={selHour}
                   onChangeText={t => setSelHour(t.replace(/[^0-9]/g, ''))}
                 />
                 <TouchableOpacity onPressIn={() => startScroll('hour', -1)} onPressOut={stopScroll} style={styles.spinBtn}>
                   <Ionicons name="chevron-down" size={28} color={colors.textPrimary} />
                 </TouchableOpacity>
               </View>

               <Text style={[textStyles.headingLg, { color: colors.textPrimary, paddingHorizontal: spacing.sm }]}>:</Text>

               <View style={{ alignItems: 'center' }}>
                 <TouchableOpacity onPressIn={() => startScroll('min', 1)} onPressOut={stopScroll} style={styles.spinBtn}>
                   <Ionicons name="chevron-up" size={28} color={colors.textPrimary} />
                 </TouchableOpacity>
                 <TextInput
                   style={[styles.timeInputBox, { backgroundColor: colors.bg2, color: colors.textPrimary, borderColor: colors.border, borderWidth: 1 }]}
                   keyboardType="number-pad"
                   maxLength={2}
                   placeholder="00"
                   placeholderTextColor={colors.textMuted}
                   value={selMin}
                   onChangeText={t => setSelMin(t.replace(/[^0-9]/g, ''))}
                 />
                 <TouchableOpacity onPressIn={() => startScroll('min', -1)} onPressOut={stopScroll} style={styles.spinBtn}>
                   <Ionicons name="chevron-down" size={28} color={colors.textPrimary} />
                 </TouchableOpacity>
               </View>
               <View style={styles.amPmContainer}>
                 <TouchableOpacity 
                   onPress={() => setSelAmPm('AM')} 
                   style={[styles.amPmBtn, selAmPm === 'AM' ? { backgroundColor: colors.warning } : { backgroundColor: 'transparent' }]}
                 >
                   <Text style={[textStyles.bodySm, { color: selAmPm === 'AM' ? '#FFF' : colors.textMuted, fontWeight: '700' }]}>AM</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                   onPress={() => setSelAmPm('PM')} 
                   style={[styles.amPmBtn, selAmPm === 'PM' ? { backgroundColor: colors.warning } : { backgroundColor: 'transparent' }]}
                 >
                   <Text style={[textStyles.bodySm, { color: selAmPm === 'PM' ? '#FFF' : colors.textMuted, fontWeight: '700' }]}>PM</Text>
                 </TouchableOpacity>
               </View>
             </View>

             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl }}>
               <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.bg2, flex: 1, marginRight: 8 }]} onPress={() => { setDueTime(null); setShowTimePicker(false); }}>
                 <Text style={[textStyles.bodyMd, { color: colors.textPrimary, fontWeight: '600' }]}>Clear</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.warning, flex: 1, marginLeft: 8 }]} onPress={() => {
                   let h = parseInt(selHour, 10);
                   const m = parseInt(selMin, 10);
                   if (isNaN(h) || isNaN(m) || h < 1 || h > 12 || m < 0 || m > 59) {
                     alert("Please enter a valid time (e.g. 09:17)");
                     return;
                   }
                   const d = new Date();
                   if (selAmPm === 'PM' && h !== 12) h += 12;
                   if (selAmPm === 'AM' && h === 12) h = 0;
                   d.setHours(h, m, 0, 0);
                   setDueTime(d);
                   setShowTimePicker(false);
               }}>
                 <Text style={[textStyles.bodyMd, { color: '#000', fontWeight: '700' }]}>Save</Text>
               </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const renderOptionsModal = () => {
    const isPriority = showOptionsModal === 'priority';
    const isAlert = showOptionsModal === 'alert';
    const items = isPriority ? priorities : (isAlert ? reminderTypes : repeatTypes);
    const currentVal = isPriority ? selectedPriority : (isAlert ? reminderType : selectedRepeat);

    return (
      <Modal visible={showOptionsModal !== null} transparent animationType="fade" onRequestClose={() => setShowOptionsModal(null)}>
        <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: colors.bg1 }]}>
             <Text style={[textStyles.headingSm, { color: colors.textPrimary, marginBottom: spacing.lg, textAlign: 'center' }]}>
               Select {isPriority ? 'Priority' : (isAlert ? 'Alert' : 'Repeat')}
             </Text>
             {items.map((item: any) => {
               const isSelected = currentVal === item.value;
               return (
                 <TouchableOpacity
                   key={item.value}
                   style={[styles.optionRow, { backgroundColor: isSelected ? colors.bg2 : 'transparent' }]}
                   onPress={() => {
                     if (isPriority) setValue('priority', item.value);
                     else if (isAlert) setReminderType(item.value);
                     else setValue('repeatType', item.value);
                     setShowOptionsModal(null);
                   }}
                 >
                   {isPriority ? (
                     <Ionicons name="flag" size={20} color={item.colorKey} style={{ marginRight: spacing.md }} />
                   ) : (
                     <Ionicons name={item.icon} size={20} color={colors.accent} style={{ marginRight: spacing.md }} />
                   )}
                   <Text style={[textStyles.bodyMd, { color: colors.textPrimary, flex: 1, fontWeight: isSelected ? '700' : '400' }]}>{item.label}</Text>
                   {isSelected && <Ionicons name="checkmark-circle" size={24} color={colors.accent} />}
                 </TouchableOpacity>
               );
             })}
             <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.bg2, marginTop: spacing.lg }]} onPress={() => setShowOptionsModal(null)}>
                <Text style={[textStyles.bodyMd, { color: colors.textPrimary, fontWeight: '600' }]}>Cancel</Text>
             </TouchableOpacity>
           </View>
        </View>
      </Modal>
    );
  };

  return (
    <Screen noPadding>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircleBtn}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[textStyles.headingMd, { color: colors.textPrimary }]}>New Task</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* Vibrant Input Area */}
          <View style={[styles.mainInputCard, { backgroundColor: isDark ? colors.bg2 : colors.bg1, borderColor: colors.border }]}>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <TextInput
                    placeholder="Task Title..."
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholderTextColor={colors.textMuted}
                    style={[styles.hugeTitleInput, { color: colors.textPrimary }]}
                    multiline
                  />
                  {errors.title?.message && (
                    <Text style={[textStyles.caption, { color: colors.error, marginTop: 4, paddingHorizontal: spacing.md }]}>{errors.title.message}</Text>
                  )}
                </View>
              )}
            />
            <View style={[styles.inputDivider, { backgroundColor: colors.border }]} />
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Add notes or descriptions..."
                  value={value}
                  onChangeText={onChange}
                  multiline
                  placeholderTextColor={colors.textMuted}
                  style={[styles.descInputBox, { color: colors.textSecondary }]}
                />
              )}
            />
          </View>

          {/* Settings Grid */}
          <Text style={[textStyles.labelSm, styles.sectionTitle, { color: colors.textMuted }]}>PROPERTIES</Text>
          <View style={styles.gridContainer}>
             <TouchableOpacity style={[styles.gridCard, { backgroundColor: isDark ? colors.bg2 : colors.bg1, borderColor: colors.border }]} onPress={() => setShowDatePicker(true)}>
               <View style={[styles.gridIconBox, { backgroundColor: accentSoft }]}>
                 <Ionicons name="calendar" size={24} color={colors.accent} />
               </View>
               <Text style={[textStyles.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>Date</Text>
               <Text style={[textStyles.bodyLg, { color: colors.textPrimary, fontWeight: '700' }]}>{dueDate ? format(dueDate, 'MMM d') : 'Anytime'}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={[styles.gridCard, { backgroundColor: isDark ? colors.bg2 : colors.bg1, borderColor: colors.border }]} onPress={() => setShowTimePicker(true)}>
               <View style={[styles.gridIconBox, { backgroundColor: warningSoft }]}>
                 <Ionicons name="time" size={24} color={colors.warning} />
               </View>
               <Text style={[textStyles.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>Time</Text>
               <Text style={[textStyles.bodyLg, { color: colors.textPrimary, fontWeight: '700' }]}>{dueTime ? format(dueTime, 'h:mm a') : 'Anytime'}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={[styles.gridCard, { backgroundColor: isDark ? colors.bg2 : colors.bg1, borderColor: colors.border }]} onPress={() => setShowOptionsModal('repeat')}>
               <View style={[styles.gridIconBox, { backgroundColor: successSoft }]}>
                 <Ionicons name="repeat" size={24} color={colors.success || '#10B981'} />
               </View>
               <Text style={[textStyles.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>Repeat</Text>
               <Text style={[textStyles.bodyLg, { color: colors.textPrimary, fontWeight: '700', textTransform: 'capitalize' }]}>{selectedRepeat}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={[styles.gridCard, { backgroundColor: isDark ? colors.bg2 : colors.bg1, borderColor: colors.border }]} onPress={() => setShowOptionsModal('priority')}>
               <View style={[styles.gridIconBox, { backgroundColor: errorSoft }]}>
                 <Ionicons name="flag" size={24} color={priorities.find(p => p.value === selectedPriority)?.colorKey || colors.error} />
               </View>
               <Text style={[textStyles.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>Priority</Text>
               <Text style={[textStyles.bodyLg, { color: colors.textPrimary, fontWeight: '700', textTransform: 'capitalize' }]}>{selectedPriority}</Text>
             </TouchableOpacity>

             <TouchableOpacity style={[styles.gridCard, { backgroundColor: isDark ? colors.bg2 : colors.bg1, borderColor: colors.border }]} onPress={() => setShowOptionsModal('alert')}>
               <View style={[styles.gridIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                 <Ionicons name="notifications" size={24} color="#3B82F6" />
               </View>
               <Text style={[textStyles.caption, { color: colors.textMuted, marginTop: spacing.sm }]}>Alert</Text>
               <Text style={[textStyles.bodyLg, { color: colors.textPrimary, fontWeight: '700', textTransform: 'capitalize' }]}>
                 {reminderTypes.find(r => r.value === reminderType)?.label || 'No Alert'}
               </Text>
             </TouchableOpacity>
          </View>

          {/* Subtasks */}
          <Text style={[textStyles.labelSm, styles.sectionTitle, { color: colors.textMuted }]}>SUBTASKS</Text>
          <View style={[styles.subtaskContainer, { backgroundColor: isDark ? colors.bg2 : colors.bg1, borderColor: colors.border }]}>
             {subtasks.map(st => (
               <View key={st.id} style={[styles.subtaskRow, { borderBottomColor: colors.border }]}>
                 <View style={[styles.circleCheck, { borderColor: colors.textMuted }]} />
                 <Text style={[textStyles.bodyMd, { color: colors.textPrimary, flex: 1, marginLeft: spacing.sm }]} numberOfLines={1}>{st.title}</Text>
                 <TouchableOpacity onPress={() => setSubtasks(subtasks.filter(s => s.id !== st.id))} style={{ padding: 4 }}>
                   <Ionicons name="close" size={20} color={colors.textMuted} />
                 </TouchableOpacity>
               </View>
             ))}
             <View style={styles.subtaskInputRow}>
                <Ionicons name="add-circle" size={24} color={colors.accent} />
                <TextInput
                  placeholder="Add new subtask..."
                  value={newSubtask}
                  onChangeText={setNewSubtask}
                  onSubmitEditing={() => {
                    if (newSubtask.trim()) {
                      setSubtasks([...subtasks, { id: Date.now().toString(), title: newSubtask.trim(), completed: false }]);
                      setNewSubtask('');
                    }
                  }}
                  style={[textStyles.bodyMd, { flex: 1, color: colors.textPrimary, paddingLeft: spacing.sm, paddingVertical: spacing.md }]}
                  placeholderTextColor={colors.textMuted}
                />
             </View>
          </View>

          {/* Attachments */}
          <Text style={[textStyles.labelSm, styles.sectionTitle, { color: colors.textMuted }]}>ATTACHMENTS</Text>
          <View style={[styles.subtaskContainer, { backgroundColor: isDark ? colors.bg2 : colors.bg1, borderColor: colors.border, padding: spacing.md }]}>
             {attachments.map((file, i) => (
               <View key={file.id} style={[styles.subtaskRow, i !== attachments.length - 1 && { borderBottomColor: colors.border }, { paddingVertical: spacing.sm }]}>
                 <View style={[styles.gridIconBox, { backgroundColor: colors.bg3, width: 44, height: 44, borderRadius: radii.md, overflow: 'hidden' }]}>
                   {file.type.includes('image') && file.url ? (
                     <Image source={{ uri: file.url }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                   ) : (
                     <Ionicons name="document" size={20} color={colors.accent} />
                   )}
                 </View>
                 <View style={{ flex: 1, marginLeft: spacing.md }}>
                   <Text style={[textStyles.bodyMd, { color: colors.textPrimary, fontWeight: '600' }]} numberOfLines={1}>{file.name}</Text>
                   <Text style={[textStyles.caption, { color: colors.textMuted }]}>{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
                 </View>
                 <TouchableOpacity onPress={() => setAttachments(attachments.filter(a => a.id !== file.id))} style={{ padding: 8 }}>
                   <Ionicons name="trash-outline" size={20} color={colors.error} />
                 </TouchableOpacity>
               </View>
             ))}

             <TouchableOpacity 
               style={[styles.uploadBtn, { backgroundColor: isDark ? colors.bg1 : colors.bg2, borderColor: colors.border }]} 
               onPress={handleAddAttachment}
               disabled={isUploading}
             >
               {isUploading ? (
                 <ActivityIndicator size="small" color={colors.accent} />
               ) : (
                 <>
                   <Ionicons name="cloud-upload" size={20} color={colors.accent} />
                   <Text style={[textStyles.bodyMd, { color: colors.accent, marginLeft: spacing.sm, fontWeight: '600' }]}>Upload File</Text>
                 </>
               )}
             </TouchableOpacity>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Gradient-like Save Button */}
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
              <Ionicons name="checkmark-circle" size={24} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={[textStyles.bodyLg, { color: '#fff', fontWeight: '700', fontSize: 18 }]}>Create Task</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {renderCalendarModal()}
      {renderTimeModal()}
      {renderOptionsModal()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  iconCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(150,150,150,0.1)',
  },
  iconBtnSmall: {
    padding: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  mainInputCard: {
    borderRadius: radii['2xl'],
    borderWidth: 1,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  hugeTitleInput: {
    fontSize: 26,
    fontWeight: '700',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    includeFontPadding: false,
  },
  descInputBox: {
    fontSize: 16,
    minHeight: 80,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    textAlignVertical: 'top',
  },
  inputDivider: {
    height: 1,
    marginHorizontal: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    letterSpacing: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  gridCard: {
    width: '47.5%',
    borderRadius: radii['2xl'],
    borderWidth: 1,
    padding: spacing.lg,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  gridIconBox: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  subtaskContainer: {
    borderRadius: radii['2xl'],
    borderWidth: 1,
    marginBottom: spacing.xl,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    overflow: 'hidden',
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  circleCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  subtaskInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: spacing.sm,
  },
  floatingAction: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: radii.full,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radii['3xl'],
    borderTopRightRadius: radii['3xl'],
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalIconBox: {
    width: 40,
    height: 40,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calDay: {
    width: '12.5%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtn: {
    paddingVertical: 16,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeInputBox: {
    width: 80,
    height: 80,
    borderRadius: radii['2xl'],
    fontSize: 40,
    fontWeight: '700',
    textAlign: 'center',
  },
  amPmContainer: {
    marginLeft: spacing.lg,
    gap: spacing.xs,
  },
  amPmBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.xl,
    marginBottom: spacing.sm,
  },
  spinBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  }
});
