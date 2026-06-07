import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, radii } from '@/src/theme/tokens';

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
        console.warn(`Groq API Error (${res.status}) on key ${key?.slice(0,8)}:`, data?.error?.message);
        // Continue to the next key
      }
    } catch (err) {
      console.warn(`Groq Fetch Error on key ${key?.slice(0,8)}:`, err);
      // Continue to the next key
    }
  }

  return null;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function AIPanel({ content, onApplyAI, onClose }: AIPanelProps) {
  const { colors, isDark } = useTheme();
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

  const panelBg = isDark ? '#1A1625' : '#F5F3FF';
  const inputBg = isDark ? '#251E3A' : '#FFFFFF';
  const borderColor = isDark ? '#3D2F6A' : '#DDD6FE';

  return (
    <View style={[styles.container, { backgroundColor: panelBg, borderBottomColor: borderColor }]}>
      {/* ── Gradient-style header bar ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconRing}>
            <View style={styles.iconBadge}>
              <Ionicons name="sparkles" size={14} color="#fff" />
            </View>
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.headerTitle}>AI Writing Assistant</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onClose}
          disabled={isLoading}
          style={[styles.closeBtn, { backgroundColor: isDark ? '#2D2444' : '#EDE9FE' }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={16} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      {/* ── Divider ── */}
      <View style={[styles.divider, { backgroundColor: borderColor }]} />

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
                  backgroundColor: isActive ? item.color + '30' : isDark ? '#251E3A' : '#EDE9FE',
                  borderColor: isActive ? item.color : borderColor,
                },
                isLoading && !isActive && { opacity: 0.45 },
              ]}
              onPress={() => handleGenerate(item.cmd, idx)}
              disabled={isLoading}
              activeOpacity={0.75}
            >
              {isActive && isLoading ? (
                <ActivityIndicator size={12} color={item.color} style={{ marginRight: 5 }} />
              ) : (
                <Ionicons
                  name={item.icon as any}
                  size={13}
                  color={isActive ? item.color : '#8B5CF6'}
                  style={{ marginRight: 4 }}
                />
              )}
              <Text style={[styles.chipText, { color: isActive ? item.color : isDark ? '#C4B5FD' : '#6D28D9' }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Custom prompt input ── */}
      <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: isLoading ? '#8B5CF6' : borderColor }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder="Ask AI anything… e.g. 'Create a study plan for JavaScript'"
          placeholderTextColor={isDark ? '#6B5FA0' : '#9CA3AF'}
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
            { backgroundColor: isLoading || !prompt.trim() ? (isDark ? '#3D2F6A' : '#DDD6FE') : '#7C3AED' },
          ]}
          onPress={() => handleGenerate()}
          disabled={isLoading || !prompt.trim()}
          activeOpacity={0.8}
        >
          {isLoading && activeChip === null ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="arrow-up" size={18} color={!prompt.trim() ? '#8B5CF6' : '#fff'} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    elevation: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconRing: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#7C3AED20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B5CF6',
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
    letterSpacing: 0.1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
    marginBottom: 10,
    opacity: 0.6,
  },
  chipsScrollView: {
    marginBottom: 10,
  },
  chipsContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 16,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 6,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    fontSize: 13.5,
    lineHeight: 20,
    paddingTop: Platform.OS === 'ios' ? 4 : 0,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
