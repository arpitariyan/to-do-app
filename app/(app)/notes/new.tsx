import React, { useState, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Text, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeContext';
import { textStyles } from '@/src/theme/typography';
import { spacing, radii } from '@/src/theme/tokens';
import { useCreateNote } from '@/src/hooks/useNotes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAttachments, Attachment } from '@/src/hooks/useAttachments';
import { Linking } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { AIPanel } from '@/src/components/notes/AIPanel';

export default function NewNoteScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { mutate: createNote, isPending } = useCreateNote();
  const { uploadFile, getFileViewUrl, pickDocument } = useAttachments();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [insertedImages, setInsertedImages] = useState<{id: string; url: string}[]>([]);
  const richText = useRef<RichEditor>(null);

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (!title.trim() && !content.trim() && attachments.length === 0) {
      router.back();
      return;
    }

    createNote(
      { 
        title: title.trim(), 
        content: content.trim(),
        attachments: attachments.map(a => a.id),
      },
      {
        onSuccess: (createdNote: any) => {
          // Navigate to the edit screen so user stays on this note
          router.replace(`/(app)/notes/${createdNote.$id}` as any);
        },
      }
    );
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

  const handleRemoveImage = (imageId: string, imageUrl: string) => {
    // Remove from tracking arrays
    setInsertedImages(prev => prev.filter(img => img.id !== imageId));
    setAttachments(prev => prev.filter(a => a.id !== imageId));
    // Remove from editor HTML by injecting JS
    richText.current?.commandDOM(
      `var imgs = document.querySelectorAll('img'); imgs.forEach(function(img){ if(img.src.includes('${imageId}')) img.remove(); });`
    );
  };

  const [isAIModalVisible, setAIModalVisible] = useState(false);

  const handleApplyAI = (newContent: string) => {
    setContent(newContent);
    richText.current?.setContentHTML(newContent);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg1 }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[textStyles.labelSm, { color: colors.textSecondary }]}>New Note</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          disabled={isPending}
          style={[styles.saveBtn, { backgroundColor: isPending ? colors.bg3 : colors.accent }]}
        >
          <Ionicons name="checkmark" size={20} color={isPending ? colors.textMuted : colors.white} />
        </TouchableOpacity>
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
            style={[styles.titleInput, { color: colors.textPrimary, fontWeight: '700', fontSize: 32, includeFontPadding: false }]}
            placeholder="Title"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={255}
          />
          
          <View style={{ flex: 1, minHeight: 400, backgroundColor: colors.bg1 }}>
            <RichEditor
              ref={richText}
              initialContentHTML={content}
              onChange={setContent}
              placeholder="Start writing..."
              editorStyle={{
                backgroundColor: colors.bg1,
                color: colors.textSecondary,
                placeholderColor: colors.textMuted,
              }}
              useContainer={false}
              initialHeight={400}
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
                    onPress={() => handleRemoveImage(img.id, img.url)}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
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
