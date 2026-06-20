import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, radii } from '@/src/theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AIPanelProps {
  content: string;
  onApplyAI: (newContent: string) => void;
  onClose: () => void;
}

// ─── Groq Config ──────────────────────────────────────────────────────────────
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ─── Quick Actions ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: 'sparkles-outline', label: 'Improve', color: '#A78BFA', cmd: 'Improve the writing quality, fix grammar, and enhance readability of the note content.' },
  { icon: 'document-text-outline', label: 'Summarize', color: '#60A5FA', cmd: 'Summarize the current note content into concise key bullet points.' },
  { icon: 'checkbox-outline', label: 'Checklist', color: '#34D399', cmd: 'Convert the content into a well-structured checklist using <ul> and <li> tags.' },
  { icon: 'expand-outline', label: 'Expand', color: '#F59E0B', cmd: 'Expand this topic with more detail, examples, and well-structured sections.' },
  { icon: 'pricetag-outline', label: 'Add Title', color: '#F472B6', cmd: 'Generate a clear, concise title for this note and add it as an <h1> heading at the top.' },
  { icon: 'list-outline', label: 'Actions', color: '#FB923C', cmd: 'Extract all action items and tasks from the note into a numbered <ol> list.' },
  { icon: 'language-outline', label: 'Rewrite', color: '#22D3EE', cmd: 'Rewrite this note in a cleaner, more professional tone.' },
  { icon: 'school-outline', label: 'Study Notes', color: '#A3E635', cmd: 'Convert this content into well-organized study notes with headings and key points.' },
] as const;

// ─── Groq Caller ──────────────────────────────────────────────────────────────
async function callGroq(apiKeys: string[], userPrompt: string, noteContent: string): Promise<string | null> {
  const systemPrompt = `You are an expert AI writing assistant embedded inside a rich-text notepad app.
Your job is to help users write, edit, organize, and improve their notes.

CRITICAL OUTPUT RULES:
- Return ONLY valid HTML — no markdown, no code fences, no backticks.
- Use proper HTML tags: <h1>, <h2>, <h3> for headings; <ul><li> for bullet lists; <ol><li> for numbered lists; <b>, <i>, <u> for emphasis.
- Do NOT wrap your response in \`\`\`html or any code block.
- Keep formatting clean and readable.

Current note content (use this as context):
${noteContent || '(The note is currently empty — create fresh content)'}`;

  let data: any = null;

  for (const key of apiKeys) {
    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      data = await res.json();
      if (res.ok) {
        return data.choices?.[0]?.message?.content ?? null;
      } else {
        console.warn(`Groq API Error (${res.status}) on key ${key?.slice(0, 8)}:`, data?.error?.message);
        // Continue to the next key
      }
    } catch (err) {
      console.warn(`Groq Fetch Error on key ${key?.slice(0, 8)}:`, err);
      // Continue to the next key
    }
  }

  return null;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function AIPanel({ content, onApplyAI, onClose }: AIPanelProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeChip, setActiveChip] = useState<number | null>(null);
  const inputRef = useRef<TextInput>(null);

  const handleGenerate = async (customPrompt?: string, chipIdx?: number) => {
    const finalPrompt = (customPrompt || prompt).trim();
    if (!finalPrompt) return;

    const apiKeys = [
      process.env.EXPO_PUBLIC_GROQ_API_KEY,
      process.env.EXPO_PUBLIC_GROQ_API_KEY_2,
      process.env.EXPO_PUBLIC_GROQ_API_KEY_3,
    ].filter(k => k && k !== 'your_groq_api_key_here') as string[];

    if (apiKeys.length === 0) {
      alert('Groq API keys missing!\n\nAdd them to .env');
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);
    if (chipIdx !== undefined) setActiveChip(chipIdx);

    try {
      const result = await callGroq(apiKeys, finalPrompt, content);
      if (result) {
        const cleanHTML = result.replace(/```html\n?/gi, '').replace(/```\n?/gi, '').trim();
        onApplyAI(content ? `${content}<br><br>${cleanHTML}` : cleanHTML);
        setPrompt('');
        onClose();
      } else {
        alert('AI could not generate a response. Please try again.');
      }
    } catch (err) {
      console.error('AIPanel error:', err);
      alert('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
      setActiveChip(null);
    }
  };

  return (
    <Modal visible={true} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.container,
              { 
                backgroundColor: colors.bg1, 
                borderTopColor: colors.border,
                paddingBottom: Platform.OS === 'ios' ? 40 : insets.bottom > 35 ? insets.bottom + 12 : 24
              }
            ]}
          >
            {/* ── Drag Handle ── */}
            <View style={styles.dragHandleContainer}>
              <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
            </View>

            {/* ── Header ── */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={[styles.iconRing, { backgroundColor: colors.accent + '20' }]}>
                  <View style={[styles.iconBadge, { backgroundColor: colors.accent }]}>
                    <Ionicons name="sparkles" size={14} color="#fff" />
                  </View>
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>AI Writing Assistant</Text>
                  {/* <Text style={[styles.headerSub, { color: colors.textMuted }]}>Powered by Groq</Text> */}
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                disabled={isLoading}
                style={[styles.closeBtn, { backgroundColor: colors.bg2 }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* ── Quick action chips ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              style={styles.chipsScrollView}
              contentContainerStyle={styles.chipsContent}
            >
              {QUICK_ACTIONS.map((item, idx) => {
                const isActive = activeChip === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isActive ? item.color + '20' : colors.bg2,
                        borderColor: isActive ? item.color : colors.border,
                      },
                      isLoading && !isActive && { opacity: 0.45 },
                    ]}
                    onPress={() => handleGenerate(item.cmd, idx)}
                    disabled={isLoading}
                    activeOpacity={0.75}
                  >
                    {isActive && isLoading ? (
                      <ActivityIndicator size={12} color={item.color} style={{ marginRight: 6 }} />
                    ) : (
                      <Ionicons
                        name={item.icon as any}
                        size={14}
                        color={isActive ? item.color : colors.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                    )}
                    <Text style={[styles.chipText, { color: isActive ? item.color : colors.textPrimary }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ── Custom prompt input ── */}
            <View style={[styles.inputWrapper, { backgroundColor: colors.bg2, borderColor: isLoading ? colors.accent : colors.border }]}>
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Ask AI to write, rewrite, or summarize..."
                placeholderTextColor={colors.textMuted}
                value={prompt}
                onChangeText={setPrompt}
                multiline
                maxLength={600}
                editable={!isLoading}
                returnKeyType="default"
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  { backgroundColor: isLoading || !prompt.trim() ? colors.bg3 : colors.accent },
                ]}
                onPress={() => handleGenerate()}
                disabled={isLoading || !prompt.trim()}
                activeOpacity={0.8}
              >
                {isLoading && activeChip === null ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="arrow-up" size={18} color={!prompt.trim() ? colors.textMuted : '#fff'} />
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    borderTopWidth: 1,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  dragHandleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsScrollView: {
    marginBottom: 20,
  },
  chipsContent: {
    paddingHorizontal: 24,
    gap: 10,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 24,
    borderWidth: 1.5,
    borderRadius: 24,
    paddingLeft: 18,
    paddingRight: 8,
    paddingVertical: 8,
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    fontSize: 15,
    lineHeight: 22,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
