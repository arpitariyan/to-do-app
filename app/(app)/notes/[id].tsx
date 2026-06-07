import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Text, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeContext';
import { textStyles } from '@/src/theme/typography';
import { spacing, radii } from '@/src/theme/tokens';
import { useNotes, useUpdateNote, useDeleteNote } from '@/src/hooks/useNotes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAttachments, Attachment } from '@/src/hooks/useAttachments';
import { Linking } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { AIPanel } from '@/src/components/notes/AIPanel';

export default function EditNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const { data: notes, isLoading: isLoadingNotes } = useNotes();
  const { mutate: updateNote, isPending: isUpdating } = useUpdateNote();
  const { mutate: deleteNote, isPending: isDeleting } = useDeleteNote();
  const { uploadFile, getFileViewUrl, pickDocument, getFileDetails } = useAttachments();

  const note = notes?.find((n) => n.$id === id);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [insertedImages, setInsertedImages] = useState<{id: string; url: string}[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const richText = useRef<RichEditor>(null);
  // Track which note ID was last loaded into the editor so we can detect navigation changes
  const loadedNoteId = useRef<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');

      // Whenever the note ID changes (navigating between notes), force-refresh the editor
      if (loadedNoteId.current !== note.$id) {
        loadedNoteId.current = note.$id;
        // Small delay to ensure editor WebView is ready before injecting content
        setTimeout(() => {
          richText.current?.setContentHTML(note.content || '');
        }, 100);
      }

      if (note.attachments && note.attachments.length > 0 && attachments.length === 0) {
        Promise.all(note.attachments.map((fileId: string) => getFileDetails(fileId)))
          .then((files) => {
            const validFiles = files.filter(f => f !== null) as Attachment[];
            setAttachments(validFiles);
          });
      }
    }
  }, [note?.$id, note?.title, note?.content, note?.attachments]);

  const handleSave = () => {
    if (!title.trim() && !content.trim() && attachments.length === 0) {
      return;
    }
    updateNote(
      { 
        id, 
        payload: { 
          title: title.trim(), 
          content: content.trim(),
          attachments: attachments.map(a => a.id),
        } 
      },
      {
        onSuccess: () => {
          // Stay on the page, just show a brief saved indicator
          setIsSaved(true);
          if (savedTimer.current) clearTimeout(savedTimer.current);
          savedTimer.current = setTimeout(() => setIsSaved(false), 2500);
        },
      }
    );
  };

  const handleDelete = () => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
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
    ]);
  };

  const [isAIModalVisible, setAIModalVisible] = useState(false);

  const handleApplyAI = (newContent: string) => {
    setContent(newContent);
    richText.current?.setContentHTML(newContent);
  };

  const handleAttachFile = async () => {
    try {
      const attachment = await pickDocument();
      if (attachment) {
        const isImage = attachment.type?.includes('image') || attachment.name.match(/\.(jpeg|jpg|gif|png)$/i) != null;
        
        if (isImage) {
          const fileId = await uploadFile(attachment);
          const url = getFileViewUrl(fileId);
          richText.current?.insertImage(url);
          setAttachments(prev => [...prev, { ...attachment, id: fileId, url }]);
          setInsertedImages(prev => [...prev, { id: fileId, url }]);
        } else {
          const fileId = await uploadFile(attachment);
          const url = getFileViewUrl(fileId);
          setAttachments(prev => [...prev, { ...attachment, id: fileId, url }]);
          Alert.alert('File Attached', 'Only images can be inserted into the note body. Other files are attached at the bottom.');
        }
      }
    } catch (err) {
      console.error("Failed to attach file", err);
    }
  };

  const handleRemoveImage = (imageId: string) => {
    setInsertedImages(prev => prev.filter(img => img.id !== imageId));
    setAttachments(prev => prev.filter(a => a.id !== imageId));
    richText.current?.commandDOM(
      `var imgs = document.querySelectorAll('img'); imgs.forEach(function(img){ if(img.src.includes('${imageId}')) img.remove(); });`
    );
  };

  if (isLoadingNotes) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg1 }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!note) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg1 }]}>
        <Text style={[textStyles.body, { color: colors.textSecondary }]}>Note not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg1 }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleDelete} disabled={isDeleting} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleSave} 
            disabled={isUpdating}
            style={[
              styles.saveBtn,
              { 
                backgroundColor: isSaved ? '#22C55E' : isUpdating ? colors.bg3 : colors.accent,
                marginLeft: spacing.sm 
              }
            ]}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : isSaved ? (
              <Ionicons name="checkmark-done" size={20} color="#fff" />
            ) : (
              <Ionicons name="checkmark" size={20} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {isAIModalVisible && (
        <AIPanel 
          content={content} 
          onApplyAI={handleApplyAI} 
          onClose={() => setAIModalVisible(false)} 
        />
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TextInput
            style={[styles.titleInput, { color: colors.textPrimary, fontWeight: '700', fontSize: 32 }]}
            placeholder="Title"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={255}
          />
          
          <View style={{ flex: 1, minHeight: 400, backgroundColor: colors.bg1 }}>
            <RichEditor
              ref={richText}
              initialContentHTML={note?.content || ''}
              onChange={setContent}
              placeholder="Start writing..."
              editorStyle={{
                backgroundColor: colors.bg1,
                color: colors.textSecondary,
                placeholderColor: colors.textMuted,
              }}
              useContainer={false}
              initialHeight={400}
              editorInitializedCallback={() => {
                // When editor is freshly mounted, inject the correct note content
                setTimeout(() => {
                  richText.current?.setContentHTML(note?.content || '');
                }, 50);
              }}
              // @ts-ignore
              webviewProps={{
                originWhitelist: ['*'],
                allowFileAccess: true,
                allowFileAccessFromFileURLs: true,
                allowUniversalAccessFromFileURLs: true
              }}
            />
          </View>

          {/* Inserted image thumbnails with remove button */}
          {insertedImages.length > 0 && (
            <View style={styles.imageThumbsRow}>
              {insertedImages.map((img) => (
                <View key={img.id} style={styles.imageThumbWrapper}>
                  <Image
                    source={{ uri: img.url }}
                    style={styles.imageThumb}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.imageRemoveBtn}
                    onPress={() => handleRemoveImage(img.id)}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {attachments.length > 0 && (
            <View style={styles.attachmentsSection}>
              {attachments.filter(f => !(f.type?.includes('image') || f.name.match(/\.(jpeg|jpg|gif|png)$/i))).map(file => {
                return (
                  <TouchableOpacity 
                    key={file.id} 
                    style={[styles.attachmentChip, { backgroundColor: colors.bg2, borderColor: colors.border }]}
                    onPress={() => file.url && Linking.openURL(file.url)}
                  >
                    <Ionicons name="document-outline" size={18} color={colors.textSecondary} />
                    <Text style={[textStyles.caption, { color: colors.textPrimary, flex: 1, marginLeft: spacing.xs }]} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <TouchableOpacity onPress={() => removeAttachment(file.id)} style={styles.removeBtn}>
                      <Ionicons name="close-circle" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={{ backgroundColor: colors.bg2, borderTopWidth: 1, borderTopColor: colors.border, minHeight: 50, maxHeight: 50 }}>
          <RichToolbar
            editor={richText}
            actions={[
              actions.undo,
              actions.redo,
              actions.setBold,
              actions.setItalic,
              actions.setUnderline,
              actions.setStrikethrough,
              actions.insertBulletsList,
              actions.insertOrderedList,
              actions.checkboxList,
              actions.alignLeft,
              actions.alignCenter,
              actions.alignRight,
              'customAttach',
              'customAI'
            ]}
            iconMap={{
              customAttach: () => <Ionicons name="attach" size={20} color={colors.textPrimary} />,
              customAI: () => <Ionicons name="sparkles" size={20} color="#8B5CF6" />
            }}
            onPressAddImage={() => {}}
            // @ts-ignore
            customAttach={handleAttachFile}
            customAI={() => setAIModalVisible(true)}
            iconTint={colors.textPrimary}
            selectedIconTint={colors.accent}
            style={{ backgroundColor: colors.bg2, minHeight: 50 }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radii.full,
  },
  saveBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radii.full,
  },
  scrollContent: { flexGrow: 1, padding: spacing.lg },
  titleInput: { marginBottom: spacing.md, paddingVertical: spacing.sm },
  attachmentsSection: { marginTop: spacing.xl, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  attachmentChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs, borderRadius: radii.full, borderWidth: 1, maxWidth: '100%',
  },
  imageChip: { paddingHorizontal: 0, paddingVertical: 0, paddingRight: spacing.sm, overflow: 'hidden' },
  imagePreview: { width: 40, height: 40, borderRadius: radii.full },
  removeBtn: { padding: spacing.xs },
  imageThumbsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  imageThumbWrapper: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'visible',
  },
  imageThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
  },
  imageRemoveBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 10,
    zIndex: 10,
  },
});
