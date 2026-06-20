import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Text, ActivityIndicator, Alert, Image, Modal } from 'react-native';
import { Ionicons, MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeContext';
import { textStyles } from '@/src/theme/typography';
import { spacing, radii } from '@/src/theme/tokens';
import { useNotes, useUpdateNote, useDeleteNote } from '@/src/hooks/useNotes';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAttachments, Attachment } from '@/src/hooks/useAttachments';
import { Linking } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { AIPanel } from '@/src/components/notes/AIPanel';
import { DrawingCanvas, DrawPath } from '@/src/components/notes/DrawingCanvas';
import * as FileSystem from 'expo-file-system/legacy';
import { ID } from '@/src/lib/appwrite';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { BlurView } from 'expo-blur';

export default function EditNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const { data: notes, isLoading: isLoadingNotes } = useNotes();
  const { mutate: updateNote, isPending: isUpdating } = useUpdateNote();
  const { mutate: deleteNote, isPending: isDeleting } = useDeleteNote();
  const { uploadFile, getFileViewUrl, getFileDownloadUrl, pickDocument, getFileDetails, deleteFile } = useAttachments();

  const note = notes?.find((n) => n.$id === id);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [activeBottomSheet, setActiveBottomSheet] = useState<'none' | 'color' | 'highlight' | 'fontSize'>('none');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const FONT_SIZES = [1, 2, 3, 4, 5, 6, 7];
  const TEXT_COLORS = ['#ffffff', '#000000', '#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];
  const HIGHLIGHT_COLORS = ['transparent', '#FEF08A', '#BBF7D0', '#BFDBFE', '#FBCFE8', '#E9D5FF', '#FECACA'];
  const richText = useRef<RichEditor>(null);
  const contentRef = useRef('');
  const titleRef = useRef('');
  const attachmentsRef = useRef<Attachment[]>([]);
  
  const loadedNoteId = useRef<string | null>(null);

  const removeAttachment = async (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
    await deleteFile(id);
  };

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      contentRef.current = note.content || '';
      titleRef.current = note.title || '';

      if (loadedNoteId.current !== note.$id) {
        loadedNoteId.current = note.$id;
        setTimeout(() => {
          richText.current?.setContentHTML(note.content || '');
        }, 100);
      }

      if (note.attachments && note.attachments.length > 0 && attachments.length === 0) {
        Promise.all(note.attachments.map((fileId: string) => getFileDetails(fileId)))
          .then((files) => {
            const validFiles = files.filter(f => f !== null) as Attachment[];
            setAttachments(validFiles);
            attachmentsRef.current = validFiles;
          });
      }
    }
  }, [note?.$id, note?.title, note?.content, note?.attachments]);

  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { attachmentsRef.current = attachments; }, [attachments]);

  const handleSave = async () => {
    if (!id || typeof id !== 'string') return;
    
    let latestContent = contentRef.current;
    try {
      const editorContent = await richText.current?.getContentHtml();
      if (editorContent) {
        latestContent = editorContent;
        contentRef.current = latestContent;
      }
    } catch (e) {
      console.warn('Failed to get content from editor', e);
    }

    let finalContent = latestContent;
    if (finalContent) {
      if (finalContent.includes('data-paths="')) {
        Alert.alert(
          "Upgrade Required",
          "This note contains an old drawing format which is too large to save. Please tap the drawing, click the checkmark on the canvas to upgrade it, and then save the note."
        );
        return;
      }
      
      // Use [\s\S]*? instead of /s flag because Hermes JS engine does not support /s flag perfectly
      finalContent = finalContent.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '');
    }

    const hasTitle = title.trim().length > 0;
    const hasContent = finalContent.replace(/<[^>]*>/g, '').trim().length > 0
      || finalContent.includes('<svg')
      || finalContent.includes('<img');
    const hasAttachments = attachments.length > 0;

    if (!hasTitle && !hasContent && !hasAttachments) return;

    updateNote(
      {
        id,
        payload: {
          title: title.trim(),
          content: finalContent,
          attachments: attachments.map(a => a.id),
        }
      },
      {
        onSuccess: () => {
          setIsSaved(true);
          if (savedTimer.current) clearTimeout(savedTimer.current);
          savedTimer.current = setTimeout(() => setIsSaved(false), 2500);
        },
      }
    );
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAIModalVisible, setAIModalVisible] = useState(false);
  
  const [isDrawingVisible, setDrawingVisible] = useState(false);
  const [initialDrawingPaths, setInitialDrawingPaths] = useState<DrawPath[]>([]);
  const [editingDrawingId, setEditingDrawingId] = useState<string | null>(null);
  const [pendingDrawing, setPendingDrawing] = useState<{ svg: string; paths: DrawPath[]; id: string | null } | null>(null);
  const [isUploadingDrawing, setIsUploadingDrawing] = useState(false);

  useEffect(() => {
    if (!isDrawingVisible && pendingDrawing) {
      const { svg, paths, id: existingId } = pendingDrawing;
      setPendingDrawing(null);
      
      const processDrawing = async () => {
        try {
          setIsUploadingDrawing(true);
          const drawingId = existingId || `drawing-${ID.unique()}`;
          const pathsStr = JSON.stringify(paths);
          const fileContent = `${svg}\n<!-- DRAWING_PATHS: ${pathsStr} -->`;
          
          const fileUri = FileSystem.documentDirectory + `${drawingId}.svg`;
          await FileSystem.writeAsStringAsync(fileUri, fileContent, { encoding: FileSystem.EncodingType.UTF8 });
          
          const fileId = await uploadFile({
            id: ID.unique(),
            name: `${drawingId}.svg`,
            type: 'image/svg+xml',
            size: fileContent.length,
            uri: fileUri,
          } as any);
          
          const html = `<div id="${drawingId}" class="appwrite-drawing" data-file-id="${fileId}" contenteditable="false" style="margin: 16px 0; border-radius: 12px; overflow: hidden; background-color: transparent; cursor: pointer;">${svg}</div>`;
          
          if (existingId) {
            const safeHtml = html.replace(/`/g, '\\`');
            richText.current?.commandDOM(`
              var el = document.getElementById('${existingId}');
              if (el) {
                el.outerHTML = \`${safeHtml}\`;
                setTimeout(function() {
                  var newEl = document.getElementById('${drawingId}');
                  if (newEl) {
                    newEl.onclick = function() {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'EDIT_DRAWING',
                        fileId: '${fileId}',
                        id: '${drawingId}'
                      }));
                    };
                  }
                }, 50);
              }
            `);
          } else {
            richText.current?.insertHTML(html + '<br/>');
            richText.current?.commandDOM(`
              setTimeout(function() {
                var newEl = document.getElementById('${drawingId}');
                if (newEl) {
                  newEl.onclick = function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'EDIT_DRAWING',
                      fileId: '${fileId}',
                      id: '${drawingId}'
                    }));
                  };
                }
              }, 50);
            `);
          }

          setTimeout(async () => {
            try {
              const latest = await richText.current?.getContentHtml();
              if (latest) {
                setContent(latest);
                contentRef.current = latest;
                setIsSaved(false);
              }
            } catch (_) {}
          }, 300);
          
        } catch (error) {
          console.error("Failed to process drawing", error);
          Alert.alert("Error", "Failed to save drawing. Please try again.");
        } finally {
          setIsUploadingDrawing(false);
        }
      };
      
      processDrawing();
    }
  }, [isDrawingVisible, pendingDrawing]);

  useEffect(() => {
    if (isEditorReady && note?.content && richText.current) {
      const loadDrawings = async () => {
        const regex = /data-file-id="([^"]+)"/g;
        let match;
        const fileIds = [];
        while ((match = regex.exec(note.content as string)) !== null) {
          fileIds.push(match[1]);
        }
        
        for (const fileId of fileIds) {
          try {
            const url = getFileDownloadUrl(fileId);
            const response = await fetch(url);
            const text = await response.text();
            
            const svgMatch = text.split('\n<!-- DRAWING_PATHS:');
            if (svgMatch.length > 0) {
              const svg = svgMatch[0];
              const safeSvg = svg.replace(/`/g, '\\`');
              richText.current?.commandDOM(`
                var el = document.querySelector('div[data-file-id="${fileId}"]');
                if (el) {
                  el.innerHTML = \`${safeSvg}\`;
                  el.onclick = function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'EDIT_DRAWING',
                      fileId: '${fileId}',
                      id: el.id
                    }));
                  };
                }
              `);
            }
          } catch (err) {
            console.error("Failed to load drawing", fileId, err);
          }
        }
      };
      loadDrawings();
    }
  }, [isEditorReady, note?.content]);

  const handleDelete = () => {
    deleteNote(id as string, {
      onSuccess: () => {
        router.back();
      }
    });
  };

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
          const html = `
            <div id="img-container-${fileId}" contenteditable="false" style="position: relative; display: inline-block; width: 100%; margin: 10px 0;">
              <img src="${url}" style="width: 100%; border-radius: 12px; display: block;" />
              <div 
                onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'REMOVE_IMAGE', id: '${fileId}'}))" 
                style="position: absolute; top: 12px; right: 12px; background-color: rgba(239, 68, 68, 0.9); width: 32px; height: 32px; border-radius: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 100; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"
              >
                <span style="color: white; font-family: sans-serif; font-size: 16px; font-weight: bold; line-height: 1;">✕</span>
              </div>
            </div><br/>
          `;
          richText.current?.insertHTML(html);
          setAttachments(prev => [...prev, { ...attachment, id: fileId, url }]);
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

  const handleRemoveImage = async (imageId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== imageId));
    richText.current?.commandDOM(
      `var container = document.getElementById('img-container-${imageId}');
       if (container) {
         container.remove();
       } else {
         var imgs = document.querySelectorAll('img'); 
         imgs.forEach(function(img){ 
           if(img.src.includes('${imageId}')) img.remove(); 
         });
       }`
    );
    await deleteFile(imageId);
  };

  const handleMessage = async (message: any) => {
    if (message?.type === 'REMOVE_IMAGE' && message?.id) {
      handleRemoveImage(message.id);
    } else if (message?.type === 'EDIT_DRAWING') {
      if (message?.fileId) {
        try {
          const url = getFileDownloadUrl(message.fileId);
          const response = await fetch(url);
          const text = await response.text();
          
          const pathsMatch = text.split('\n<!-- DRAWING_PATHS:');
          if (pathsMatch.length > 1) {
            const parsedPaths = JSON.parse(pathsMatch[1].replace('-->', '').trim());
            setInitialDrawingPaths(parsedPaths);
            setEditingDrawingId(message.id);
            setDrawingVisible(true);
          } else {
            Alert.alert("Error", "Could not load drawing data for editing.");
          }
        } catch (err) {
          console.error("Failed to parse drawing paths", err);
          Alert.alert("Error", "Could not load drawing data for editing.");
        }
      } else if (message?.paths) {
        try {
          let pathsStr = message.paths;
          // In older versions, it was URI encoded
          if (pathsStr.startsWith('%5B')) pathsStr = decodeURIComponent(pathsStr);
          const parsedPaths = JSON.parse(pathsStr);
          setInitialDrawingPaths(parsedPaths);
          setEditingDrawingId(message.id);
          setDrawingVisible(true);
        } catch (err) {
          console.error("Failed to parse legacy drawing paths", err);
        }
      }
    }
  };

  if (isLoadingNotes) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: 'transparent' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!note) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: 'transparent' }]}>
        <Text style={[textStyles.body, { color: colors.textSecondary }]}>Note not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.glassBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.glassSoft, borderWidth: 1, borderColor: colors.glassBorder }]}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowDeleteConfirm(true)} disabled={isDeleting} style={[styles.headerBtn, { backgroundColor: colors.error + '20' }]}>
            <Ionicons name="trash" size={22} color={colors.error} />
          </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleSave} 
              style={[styles.headerBtn, { backgroundColor: isUpdating ? colors.bg3 : colors.accent }]}
              disabled={isUpdating}
            >
              {isSaved ? (
                <Ionicons name="checkmark-done" size={20} color={colors.white} />
              ) : isUpdating ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="checkmark" size={20} color={colors.white} />
              )}
            </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showDeleteConfirm} animationType="slide" transparent>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDeleteConfirm(false)}>
            <View style={[styles.modalContent, { backgroundColor: colors.bg1, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.modalHeader}>
                <View style={[styles.modalIconBox, { backgroundColor: colors.error + '20' }]}>
                  <Ionicons name="warning" size={24} color={colors.error} />
                </View>
                <Text style={[textStyles.sectionTitle, { color: colors.textPrimary, marginLeft: spacing.md }]}>
                  Delete Note
                </Text>
              </View>
              <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.xl }]}>
                Are you sure you want to delete this note? This action cannot be undone.
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <TouchableOpacity
                  style={[styles.modalBtn, { flex: 1, backgroundColor: colors.bg2 }]}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={[textStyles.labelLg, { color: colors.textPrimary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { flex: 1, backgroundColor: colors.error }]}
                  onPress={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[textStyles.labelLg, { color: '#fff' }]}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </BlurView>
      </Modal>

      {isAIModalVisible && (
        <AIPanel
          content={content}
          onApplyAI={handleApplyAI}
          onClose={() => setAIModalVisible(false)}
        />
      )}

      {isDrawingVisible && (
        <DrawingCanvas 
          visible={isDrawingVisible} 
          initialPaths={initialDrawingPaths}
          onClose={() => setDrawingVisible(false)}
          onSave={(svgString, paths) => {
            if (svgString) {
              setPendingDrawing({ svg: svgString, paths, id: editingDrawingId });
            }
            setDrawingVisible(false);
          }}
        />
      )}

      <Modal visible={activeBottomSheet !== 'none'} animationType="slide" transparent>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActiveBottomSheet('none')}>
            <GlassCard style={[styles.modalContent, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
              <View style={styles.modalHeader}>
                <Text style={[textStyles.sectionTitle, { color: colors.textPrimary }]}>
                  {activeBottomSheet === 'color' ? 'Text Color' : activeBottomSheet === 'highlight' ? 'Highlight Color' : 'Font Size'}
                </Text>
                <TouchableOpacity onPress={() => setActiveBottomSheet('none')} style={{ marginLeft: 'auto' }}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {activeBottomSheet === 'fontSize' && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {FONT_SIZES.map(size => (
                    <TouchableOpacity
                      key={`font-${size}`}
                      style={[styles.colorSwatch, { backgroundColor: colors.bg2, justifyContent: 'center', alignItems: 'center' }]}
                      onPress={() => {
                        // @ts-ignore
                        richText.current?.setFontSize(size);
                        setActiveBottomSheet('none');
                      }}
                    >
                      <Text style={{ color: colors.textPrimary, fontSize: 12 + size * 2, fontWeight: 'bold' }}>A</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {activeBottomSheet === 'color' && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {TEXT_COLORS.map(color => (
                    <TouchableOpacity
                      key={`color-${color}`}
                      style={[styles.colorSwatch, { backgroundColor: color, borderWidth: color === '#ffffff' ? 1 : 0, borderColor: colors.border }]}
                      onPress={() => {
                        richText.current?.setForeColor(color);
                        setActiveBottomSheet('none');
                      }}
                    />
                  ))}
                </View>
              )}

              {activeBottomSheet === 'highlight' && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {HIGHLIGHT_COLORS.map(color => (
                    <TouchableOpacity
                      key={`hilite-${color}`}
                      style={[styles.colorSwatch, { backgroundColor: color === 'transparent' ? colors.bg2 : color, borderWidth: color === 'transparent' ? 1 : 0, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}
                      onPress={() => {
                        richText.current?.setHiliteColor(color);
                        setActiveBottomSheet('none');
                      }}
                    >
                      {color === 'transparent' && <Ionicons name="close" size={20} color={colors.textSecondary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </GlassCard>
          </TouchableOpacity>
        </BlurView>
      </Modal>

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

          <View style={{ flex: 1, minHeight: 400, backgroundColor: 'transparent' }}>
            <RichEditor
              ref={richText}
              initialContentHTML={note?.content || ''}
              onChange={(html) => { setContent(html); contentRef.current = html; setIsSaved(false); }}
              placeholder="Start writing..."
              editorStyle={{
                backgroundColor: 'transparent',
                color: colors.textPrimary,
                placeholderColor: colors.textMuted,
                contentCSSText: `
                  input[type="checkbox"] {
                    width: 20px;
                    height: 20px;
                    margin-right: 8px;
                    accent-color: #8B5CF6;
                  }
                  li {
                    line-height: 1.5;
                    margin-bottom: 4px;
                  }
                `
              }}
              useContainer={false}
              initialHeight={400}
              onMessage={handleMessage}
              editorInitializedCallback={() => {
                setIsEditorReady(true);
                // When editor is freshly mounted, inject the correct note content
                setTimeout(() => {
                  richText.current?.setContentHTML(note?.content || '');
                  // Also wrap any existing images and attach drawing listeners
                  richText.current?.commandDOM(`
                    var imgs = document.querySelectorAll('img');
                    imgs.forEach(function(img) {
                      if (!img.parentElement || !img.parentElement.id || !img.parentElement.id.startsWith('img-container-')) {
                        var fileId = img.src.split('/').pop().split('?')[0];
                        if (img.src.includes('files/')) {
                           fileId = img.src.split('files/')[1].split('/')[0];
                        }
                        
                        var wrapper = document.createElement('div');
                        wrapper.id = 'img-container-' + fileId;
                        wrapper.style.cssText = "position: relative; display: inline-block; width: 100%; margin: 10px 0;";
                        wrapper.contentEditable = "false";
                        
                        img.style.cssText = "width: 100%; border-radius: 12px; display: block;";
                        img.parentNode.insertBefore(wrapper, img);
                        wrapper.appendChild(img);
                        
                        var closeBtn = document.createElement('div');
                        closeBtn.style.cssText = "position: absolute; top: 12px; right: 12px; background-color: rgba(239, 68, 68, 0.9); width: 32px; height: 32px; border-radius: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 100; box-shadow: 0 4px 6px rgba(0,0,0,0.3);";
                        closeBtn.contentEditable = "false";
                        closeBtn.innerHTML = "<span style='color: white; font-family: sans-serif; font-size: 16px; font-weight: bold; line-height: 1;'>✕</span>";
                        closeBtn.onclick = function() {
                           window.ReactNativeWebView.postMessage(JSON.stringify({type: 'REMOVE_IMAGE', id: fileId}));
                        };
                        wrapper.appendChild(closeBtn);
                      }
                    });
                    
                    var drawings = document.querySelectorAll('div[data-file-id]');
                    drawings.forEach(function(d) {
                      d.onclick = function() {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'EDIT_DRAWING',
                          fileId: d.getAttribute('data-file-id'),
                          id: d.id
                        }));
                      };
                    });
                  `);
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

        <View style={{ paddingHorizontal: spacing.md, paddingBottom: Platform.OS === 'ios' ? spacing.md : spacing.lg, backgroundColor: 'transparent' }}>
          <GlassCard style={{
            borderRadius: 16,
            backgroundColor: colors.glass,
            borderColor: colors.glassBorder,
            paddingHorizontal: 16,
            paddingVertical: 4
          }}>
            <RichToolbar
              editor={richText}
              actions={[
                actions.undo,
                actions.redo,
                'customFontSize',
                actions.setBold,
                actions.setItalic,
                actions.setUnderline,
                actions.setStrikethrough,
                'customColor',
                'customHighlight',
                actions.insertBulletsList,
                actions.insertOrderedList,
                actions.checkboxList,
                actions.alignLeft,
                actions.alignCenter,
                actions.alignRight,
                'customAttach',
                'customDraw',
                'customAI'
              ]}
              iconMap={{
                // @ts-ignore
                [actions.undo]: ({tintColor}) => <MaterialIcons name="undo" size={22} color={tintColor} />,
                // @ts-ignore
                [actions.redo]: ({tintColor}) => <MaterialIcons name="redo" size={22} color={tintColor} />,
                // @ts-ignore
                customFontSize: ({tintColor}) => <MaterialIcons name="format-size" size={22} color={tintColor} />,
                // @ts-ignore
                [actions.setBold]: ({tintColor}) => <MaterialIcons name="format-bold" size={22} color={tintColor} />,
                // @ts-ignore
                [actions.setItalic]: ({tintColor}) => <MaterialIcons name="format-italic" size={22} color={tintColor} />,
                // @ts-ignore
                [actions.setUnderline]: ({tintColor}) => <MaterialIcons name="format-underlined" size={22} color={tintColor} />,
                // @ts-ignore
                [actions.setStrikethrough]: ({tintColor}) => <MaterialIcons name="format-strikethrough" size={22} color={tintColor} />,
                // @ts-ignore
                customColor: ({tintColor}) => <Ionicons name="color-palette-outline" size={22} color={tintColor} />,
                // @ts-ignore
                customHighlight: ({tintColor}) => <MaterialIcons name="format-color-text" size={22} color={tintColor} />,
                // @ts-ignore
                [actions.insertBulletsList]: ({tintColor}) => <MaterialIcons name="format-list-bulleted" size={22} color={tintColor} />,
                // @ts-ignore
                [actions.insertOrderedList]: ({tintColor}) => <MaterialIcons name="format-list-numbered" size={22} color={tintColor} />,
                // @ts-ignore
                [actions.checkboxList]: ({tintColor}) => <MaterialIcons name="checklist" size={22} color={tintColor} />,
                // @ts-ignore
                [actions.alignLeft]: ({tintColor}) => <MaterialIcons name="format-align-left" size={22} color={tintColor} />,
                // @ts-ignore
                [actions.alignCenter]: ({tintColor}) => <MaterialIcons name="format-align-center" size={22} color={tintColor} />,
                // @ts-ignore
                [actions.alignRight]: ({tintColor}) => <MaterialIcons name="format-align-right" size={22} color={tintColor} />,
                // @ts-ignore
                customAttach: ({tintColor}) => <Ionicons name="attach" size={22} color={tintColor} />,
                // @ts-ignore
                customDraw: ({tintColor}) => <MaterialCommunityIcons name="palette-swatch" size={24} color={tintColor} />,
                customAI: () => <Ionicons name="sparkles" size={22} color="#8B5CF6" />
              }}
              // @ts-ignore
              customFontSize={() => setActiveBottomSheet('fontSize')}
              customColor={() => setActiveBottomSheet('color')}
              customHighlight={() => setActiveBottomSheet('highlight')}
              customAttach={handleAttachFile}
              customDraw={() => {
                setInitialDrawingPaths([]);
                setEditingDrawingId(null);
                setDrawingVisible(true);
              }}
              customAI={() => setAIModalVisible(true)}
              iconTint={colors.textSecondary}
              selectedIconTint={colors.accent}
              disabledIconTint={colors.textMuted}
              iconSize={24}
              style={{ backgroundColor: 'transparent', height: 56 }}
              flatContainerStyle={{ paddingHorizontal: 0 }}
              unselectedButtonStyle={{ backgroundColor: 'transparent', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginHorizontal: 2, marginTop: 6 }}
              selectedButtonStyle={{ backgroundColor: colors.accent + '25', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginHorizontal: 2, marginTop: 6 }}
            />
          </GlassCard>
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerBtn: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.full,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radii['3xl'],
    borderTopRightRadius: radii['3xl'],
    padding: spacing.xl,
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
  modalBtn: {
    paddingVertical: 16,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatch: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
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
