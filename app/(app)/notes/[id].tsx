import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeContext';
import { textStyles } from '@/src/theme/typography';
import { spacing, radii } from '@/src/theme/tokens';
import { useNotes, useUpdateNote, useDeleteNote } from '@/src/hooks/useNotes';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  
  const { data: notes, isLoading } = useNotes();
  const note = notes?.find(n => n.$id === id);

  const { mutate: updateNote, isPending: isUpdating } = useUpdateNote();
  const { mutate: deleteNote, isPending: isDeleting } = useDeleteNote();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
    }
  }, [note]);

  const handleSave = () => {
    if (!id || !note) return;
    
    // Only save if something changed
    if (title.trim() === (note.title || '') && content.trim() === (note.content || '')) {
      router.back();
      return;
    }

    updateNote(
      { id, payload: { title: title.trim(), content: content.trim() } },
      {
        onSuccess: () => {
          router.back();
        },
      }
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteNote(id as string, {
              onSuccess: () => {
                router.back();
              }
            });
          }
        }
      ]
    );
  };

  if (isLoading || !note) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg1 }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

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
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleDelete} style={styles.iconBtn} disabled={isDeleting}>
              <Ionicons name="trash-outline" size={24} color={colors.error} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleSave} 
              disabled={isUpdating}
              style={[styles.saveBtn, { backgroundColor: isUpdating ? colors.bg3 : colors.accent }]}
            >
              <Ionicons name="checkmark" size={20} color={isUpdating ? colors.textMuted : colors.white} />
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
