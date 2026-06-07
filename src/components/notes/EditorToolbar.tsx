import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, radii } from '@/src/theme/tokens';

interface EditorToolbarProps {
  onInsertMarkdown: (prefix: string, suffix?: string) => void;
  onTransformText?: (type: 'upper' | 'lower') => void;
  onAttachFile?: () => void;
  onSummarizeAI?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export function EditorToolbar({ 
  onInsertMarkdown,
  onTransformText,
  onAttachFile, 
  onSummarizeAI,
  onUndo,
  onRedo
}: EditorToolbarProps) {
  const { colors } = useTheme();

  const ActionButton = ({ icon, onPress, primary = false }: { icon: keyof typeof Ionicons.glyphMap, onPress: () => void, primary?: boolean }) => (
    <TouchableOpacity 
      style={[
        styles.button, 
        { backgroundColor: primary ? colors.accent + '20' : colors.bg2 }
      ]} 
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={primary ? colors.accent : colors.textPrimary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg1, borderTopColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Undo/Redo */}
        <ActionButton icon="arrow-undo" onPress={() => onUndo?.()} />
        <ActionButton icon="arrow-redo" onPress={() => onRedo?.()} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <ActionButton icon="text" onPress={() => onInsertMarkdown('**', '**')} />
        <ActionButton icon="information" onPress={() => onInsertMarkdown('*', '*')} />
        <ActionButton icon="remove" onPress={() => onInsertMarkdown('~~', '~~')} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <ActionButton icon="arrow-up" onPress={() => onTransformText?.('upper')} />
        <ActionButton icon="arrow-down" onPress={() => onTransformText?.('lower')} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <ActionButton icon="list" onPress={() => onInsertMarkdown('- ')} />
        <ActionButton icon="checkbox-outline" onPress={() => onInsertMarkdown('- [ ] ')} />
        <ActionButton icon="code-slash" onPress={() => onInsertMarkdown('```\n', '\n```')} />
        <ActionButton icon="text-outline" onPress={() => onInsertMarkdown('## ')} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {onAttachFile && <ActionButton icon="attach" onPress={onAttachFile} />}
        {onSummarizeAI && <ActionButton icon="sparkles" onPress={onSummarizeAI} primary />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: spacing.xs,
  }
});
