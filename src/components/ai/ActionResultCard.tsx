import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, radii } from '@/src/theme/tokens';

const ACTION_META: Record<string, { icon: string; color: string; label: string }> = {
  CREATE_TASK:   { icon: 'add-circle-outline',    color: '#22C55E', label: 'Task Created' },
  UPDATE_TASK:   { icon: 'pencil-outline',         color: '#3B82F6', label: 'Task Updated' },
  DELETE_TASK:   { icon: 'trash-outline',          color: '#EF4444', label: 'Task Deleted' },
  COMPLETE_TASK: { icon: 'checkmark-circle-outline', color: '#22C55E', label: 'Task Completed' },
  READ_TASKS:    { icon: 'list-outline',           color: '#8B5CF6', label: 'Tasks' },
  CREATE_NOTE:   { icon: 'document-outline',       color: '#F59E0B', label: 'Note Created' },
  UPDATE_NOTE:   { icon: 'create-outline',         color: '#3B82F6', label: 'Note Updated' },
  DELETE_NOTE:   { icon: 'trash-outline',          color: '#EF4444', label: 'Note Deleted' },
  READ_NOTES:    { icon: 'documents-outline',      color: '#8B5CF6', label: 'Notes' },
};

interface ActionResultCardProps {
  actionType: string;
  result: any;
}

export function ActionResultCard({ actionType, result }: ActionResultCardProps) {
  const { colors, isDark } = useTheme();
  const meta = ACTION_META[actionType];
  if (!meta) return null;

  const isReadAction = actionType === 'READ_TASKS' || actionType === 'READ_NOTES';
  const isDeleteAction = actionType === 'DELETE_TASK' || actionType === 'DELETE_NOTE';
  const items: any[] = Array.isArray(result) ? result : [];

  return (
    <View style={[styles.card, {
      backgroundColor: colors.bg1,
      borderColor: meta.color + '40',
    }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.iconBadge, { backgroundColor: meta.color + '20' }]}>
          <Ionicons name={meta.icon as any} size={14} color={meta.color} />
        </View>
        <Text style={[styles.label, { color: meta.color }]}>{meta.label}</Text>
      </View>

      {/* Content */}
      {isDeleteAction && (
        <Text style={[styles.detail, { color: colors.textMuted }]}>Successfully removed.</Text>
      )}

      {!isReadAction && !isDeleteAction && result?.title && (
        <Text style={[styles.detail, { color: colors.textPrimary }]} numberOfLines={2}>
          "{result.title}"
        </Text>
      )}

      {isReadAction && items.length === 0 && (
        <Text style={[styles.detail, { color: colors.textMuted }]}>Nothing found.</Text>
      )}

      {isReadAction && items.slice(0, 5).map((item: any, i: number) => (
        <View key={i} style={styles.listRow}>
          <View style={[styles.bullet, { backgroundColor: meta.color }]} />
          <Text style={[styles.listItem, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.title ?? item.name ?? 'Untitled'}
            {item.status === 'done' ? ' ✓' : ''}
          </Text>
        </View>
      ))}

      {isReadAction && items.length > 5 && (
        <Text style={[styles.detail, { color: colors.textMuted }]}>
          +{items.length - 5} more…
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    maxWidth: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  iconBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detail: { fontSize: 13, lineHeight: 18 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  bullet: { width: 5, height: 5, borderRadius: 3 },
  listItem: { fontSize: 13, flex: 1 },
});
