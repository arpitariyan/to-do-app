import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeContext';
import { textStyles } from '@/src/theme/typography';
import { spacing, radii } from '@/src/theme/tokens';
import { useCreateNote } from '@/src/hooks/useNotes';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewNoteScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { mutate: createNote, isPending } = useCreateNote();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      router.back();
      return;
    }

    createNote(
      { title: title.trim(), content: content.trim() },
      {
        onSuccess: () => {
          router.back();
        },
      }
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg1 }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleSave} 
            disabled={isPending}
            style={[styles.saveBtn, { backgroundColor: isPending ? colors.bg3 : colors.accent }]}
          >
            <Ionicons name="checkmark" size={20} color={isPending ? colors.textMuted : colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={[styles.titleInput, textStyles.headingLg, { color: colors.textPrimary }]}
            placeholder="Note Title"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={255}
          />
          <TextInput
            style={[styles.contentInput, textStyles.bodyLg, { color: colors.textSecondary }]}
            placeholder="Start typing your note here..."
            placeholderTextColor={colors.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  saveBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  titleInput: {
    marginBottom: spacing.md,
  },
  contentInput: {
    flex: 1,
    minHeight: 300,
  },
});
