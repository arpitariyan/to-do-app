import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  Alert, Clipboard, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, radii } from '@/src/theme/tokens';
import { textStyles } from '@/src/theme/typography';

import {
  AIConversation, AIMessage,
  getConversations, createConversation, deleteConversation,
  pinConversation, renameConversation,
  getMessages, saveMessage,
} from '@/src/lib/api/aiChat';
import { processMessage } from '@/src/lib/ai/intentRouter';
import { ChatBubble } from '@/src/components/ai/ChatBubble';
import { TypingIndicator } from '@/src/components/ai/TypingIndicator';
import { ChatInput } from '@/src/components/ai/ChatInput';
import { deleteMessage } from '@/src/lib/api/aiChat';

// ─── Welcome suggestions ──────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: 'add-circle-outline', text: 'Create a daily workout task at 7 AM', color: '#22C55E' },
  { icon: 'checkmark-circle-outline', text: 'Mark my reading task as done', color: '#3B82F6' },
  { icon: 'document-outline', text: 'Create a note about React hooks', color: '#F59E0B' },
  { icon: 'list-outline', text: 'Show me all my tasks', color: '#8B5CF6' },
  { icon: 'calendar-outline', text: 'What tasks do I have this week?', color: '#EC4899' },
  { icon: 'pencil-outline', text: 'Summarize my latest note', color: '#14B8A6' },
];

// ─── Sidebar / Conversation History ──────────────────────────────────────────

function ConversationSidebar({
  visible, onClose, conversations, activeId,
  onSelect, onNew, onDelete, onPin, onRename,
}: {
  visible: boolean;
  onClose: () => void;
  conversations: AIConversation[];
  activeId: string | null;
  onSelect: (conv: AIConversation) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onRename: (id: string, title: string) => void;
}) {
  const { colors, isDark } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.sidebarOverlay}>
        <TouchableOpacity style={styles.sidebarDismiss} onPress={onClose} activeOpacity={1} />
        <View style={[styles.sidebar, { backgroundColor: colors.bg1 }]}>
          {/* Sidebar header */}
          <SafeAreaView edges={['top'] as any}>
            <View style={[styles.sidebarHeader, { borderBottomColor: colors.border }]}>
              <Text style={[textStyles.labelLg, { color: colors.textPrimary }]}>Conversations</Text>
              <TouchableOpacity
                style={[styles.newChatBtn, { backgroundColor: '#7C3AED' }]}
                onPress={() => { onNew(); onClose(); }}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.newChatText}>New</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <FlatList
            data={conversations}
            keyExtractor={(c) => c.$id}
            contentContainerStyle={{ paddingVertical: spacing.sm }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.convItem,
                  item.$id === activeId && { backgroundColor: colors.bg2 },
                ]}
                onPress={() => { onSelect(item); onClose(); }}
                onLongPress={() =>
                  Alert.alert(item.title, 'What would you like to do?', [
                    { text: item.pinned ? 'Unpin' : 'Pin', onPress: () => onPin(item.$id, !item.pinned) },
                    {
                      text: 'Rename', onPress: () => {
                        Alert.prompt?.('Rename', '', (t) => t && onRename(item.$id, t), 'plain-text', item.title);
                      }
                    },
                    { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.$id) },
                    { text: 'Cancel', style: 'cancel' },
                  ])
                }
              >
                <View style={styles.convIcon}>
                  {item.pinned
                    ? <Ionicons name="pin" size={14} color="#7C3AED" />
                    : <Ionicons name="chatbubble-outline" size={14} color={colors.textMuted} />
                  }
                </View>
                <Text
                  style={[styles.convTitle, { color: item.$id === activeId ? '#7C3AED' : colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.textMuted }]}>No conversations yet</Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Main AI Screen ───────────────────────────────────────────────────────────

export default function AIScreen() {
  const { colors, isDark } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConv, setActiveConv] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);

  // Conversation history for Groq context
  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);

  // ── Load conversations on mount ────────────────────────────────────────────
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setIsLoadingConvs(true);
    try {
      const convs = await getConversations();
      setConversations(convs);
      // Auto-load most recent conversation if exists
      if (convs.length > 0 && !activeConv) {
        await loadConversation(convs[0]);
      }
    } catch (e) {
      console.warn('Failed to load conversations:', e);
    } finally {
      setIsLoadingConvs(false);
    }
  };

  const loadConversation = async (conv: AIConversation) => {
    setActiveConv(conv);
    setMessages([]);
    try {
      const msgs = await getMessages(conv.$id);
      setMessages(msgs);
      // Rebuild history ref
      historyRef.current = msgs.map((m) => ({ role: m.role, content: m.content }));
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (e) {
      console.warn('Failed to load messages:', e);
    }
  };

  // ── Start new conversation ─────────────────────────────────────────────────
  const startNewConversation = async (firstMessage?: string) => {
    const title = firstMessage
      ? firstMessage.slice(0, 60) + (firstMessage.length > 60 ? '…' : '')
      : 'New conversation';
    try {
      const conv = await createConversation(title);
      setConversations((prev) => [conv, ...prev]);
      setActiveConv(conv);
      setMessages([]);
      historyRef.current = [];
    } catch (e) {
      console.warn('Failed to create conversation:', e);
    }
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');

    let conv = activeConv;
    if (!conv) {
      await startNewConversation(text);
      // activeConv state update is async, re-read from closure won't work
      // so we'll get the newest conv from state update
      conv = null; // will be caught below
    }

    // Re-check after potential async state update
    if (!conv) {
      // Try again after React re-render
      setTimeout(() => handleSend(), 200);
      return;
    }

    // Save user message
    const userMsgData = await saveMessage({ conversationId: conv.$id, role: 'user', content: text }).catch(() => null);
    if (userMsgData) {
      setMessages((prev) => [...prev, userMsgData]);
      historyRef.current.push({ role: 'user', content: text });
    }

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    setIsTyping(true);

    try {
      const result = await processMessage(text, historyRef.current.slice(-12));

      const aiContent = result.reply;
      const aiMsgData = await saveMessage({
        conversationId: conv.$id,
        role: 'assistant',
        content: aiContent,
        actionType: result.intent,
        actionResult: result.actionResult ? JSON.stringify(result.actionResult) : undefined,
      }).catch(() => null);

      if (aiMsgData) {
        setMessages((prev) => [...prev, aiMsgData]);
        historyRef.current.push({ role: 'assistant', content: aiContent });
      }
    } catch (e) {
      console.warn('processMessage error:', e);
    } finally {
      setIsTyping(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, isTyping, activeConv]);

  // ── Re-send when activeConv is set from a new conversation ────────────────
  const pendingSendRef = useRef<string | null>(null);
  const prevActiveConvRef = useRef<AIConversation | null>(null);
  useEffect(() => {
    if (activeConv && activeConv.$id !== prevActiveConvRef.current?.$id && pendingSendRef.current) {
      prevActiveConvRef.current = activeConv;
      const pending = pendingSendRef.current;
      pendingSendRef.current = null;
      // Trigger send with current conv
      (async () => {
        const userMsgData = await saveMessage({ conversationId: activeConv.$id, role: 'user', content: pending }).catch(() => null);
        if (userMsgData) {
          setMessages((prev) => [...prev, userMsgData]);
          historyRef.current.push({ role: 'user', content: pending });
        }
        setIsTyping(true);
        try {
          const result = await processMessage(pending, historyRef.current.slice(-12));
          const aiMsgData = await saveMessage({
            conversationId: activeConv.$id,
            role: 'assistant',
            content: result.reply,
            actionType: result.intent,
            actionResult: result.actionResult ? JSON.stringify(result.actionResult) : undefined,
          }).catch(() => null);
          if (aiMsgData) {
            setMessages((prev) => [...prev, aiMsgData]);
            historyRef.current.push({ role: 'assistant', content: result.reply });
          }
        } catch { }
        setIsTyping(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      })();
    }
  }, [activeConv]);

  // ── Handle suggestion tap ──────────────────────────────────────────────────
  const handleSuggestion = async (text: string) => {
    setInput('');
    let conv = activeConv;
    if (!conv) {
      const title = text.slice(0, 60);
      conv = await createConversation(title).catch(() => null);
      if (conv) {
        setConversations((prev) => [conv!, ...prev]);
        setActiveConv(conv);
        setMessages([]);
        historyRef.current = [];
        pendingSendRef.current = text;
      }
      return;
    }
    // Has active conv — send directly
    const userMsgData = await saveMessage({ conversationId: conv.$id, role: 'user', content: text }).catch(() => null);
    if (userMsgData) {
      setMessages((prev) => [...prev, userMsgData]);
      historyRef.current.push({ role: 'user', content: text });
    }
    setIsTyping(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const result = await processMessage(text, historyRef.current.slice(-12));
      const aiMsgData = await saveMessage({
        conversationId: conv.$id,
        role: 'assistant',
        content: result.reply,
        actionType: result.intent,
        actionResult: result.actionResult ? JSON.stringify(result.actionResult) : undefined,
      }).catch(() => null);
      if (aiMsgData) {
        setMessages((prev) => [...prev, aiMsgData]);
        historyRef.current.push({ role: 'assistant', content: result.reply });
      }
    } catch { }
    setIsTyping(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // ── Delete conversation ────────────────────────────────────────────────────
  const handleDeleteConv = async (id: string) => {
    Alert.alert('Delete Chat', 'This will delete all messages in this conversation.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteConversation(id).catch(() => { });
          setConversations((prev) => prev.filter((c) => c.$id !== id));
          if (activeConv?.$id === id) {
            setActiveConv(null);
            setMessages([]);
            historyRef.current = [];
          }
        },
      },
    ]);
  };

  const handlePin = async (id: string, pinned: boolean) => {
    await pinConversation(id, pinned).catch(() => { });
    setConversations((prev) => prev.map((c) => c.$id === id ? { ...c, pinned } : c));
  };

  const handleRename = async (id: string, title: string) => {
    await renameConversation(id, title).catch(() => { });
    setConversations((prev) => prev.map((c) => c.$id === id ? { ...c, title } : c));
    if (activeConv?.$id === id) setActiveConv((p) => p ? { ...p, title } : p);
  };

  const handleDeleteMsg = async (msgId: string) => {
    await deleteMessage(msgId).catch(() => { });
    setMessages((prev) => prev.filter((m) => m.$id !== msgId));
  };

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const bg = colors.bg0;
  const borderColor = colors.border;

  const isEmptyChat = messages.length === 0 && !isTyping;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: borderColor, backgroundColor: bg }]}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.headerBtn}>
          <Ionicons name="menu" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <View style={styles.aiDot} />
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {activeConv?.title ?? 'AI Assistant'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => { setActiveConv(null); setMessages([]); historyRef.current = []; startNewConversation(); }}
          style={styles.headerBtn}
        >
          <Ionicons name="create-outline" size={22} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* ── Messages ── */}
        {isLoadingConvs ? (
          <View style={styles.center}>
            <ActivityIndicator color="#7C3AED" size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m.$id}
            contentContainerStyle={[styles.messageList, isEmptyChat && { flex: 1 }]}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {/* Hero */}
                <View style={styles.heroIcon}>
                  <Ionicons name="sparkles" size={36} color="#7C3AED" />
                </View>
                <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
                  AI Productivity Hub
                </Text>
                <Text style={[styles.heroSub, { color: colors.textMuted }]}>
                  Manage tasks &amp; notes through natural language.{'\n'}Try a suggestion below or type your own.
                </Text>

                {/* Suggestions */}
                <View style={styles.suggestions}>
                  {SUGGESTIONS.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.suggCard, { backgroundColor: colors.bg1, borderColor: s.color + '40' }]}
                      onPress={() => handleSuggestion(s.text)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.suggIcon, { backgroundColor: s.color + '20' }]}>
                        <Ionicons name={s.icon as any} size={16} color={s.color} />
                      </View>
                      <Text style={[styles.suggText, { color: colors.textSecondary }]}>{s.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            }
            renderItem={({ item }) => (
              <ChatBubble
                message={item}
                onDelete={handleDeleteMsg}
                onCopy={handleCopy}
              />
            )}
            ListFooterComponent={isTyping ? <TypingIndicator /> : null}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* ── Input ── */}
        <ChatInput
          value={input}
          onChangeText={setInput}
          onSend={handleSend}
          isLoading={isTyping}
          placeholder="Manage tasks & notes, ask anything…"
        />
      </KeyboardAvoidingView>

      {/* ── Sidebar ── */}
      <ConversationSidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeId={activeConv?.$id ?? null}
        onSelect={loadConversation}
        onNew={() => { setActiveConv(null); setMessages([]); historyRef.current = []; }}
        onDelete={handleDeleteConv}
        onPin={handlePin}
        onRename={handleRename}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },
  headerTitle: { fontSize: 15, fontWeight: '700' },
  headerSub: { fontSize: 10, marginTop: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: { paddingVertical: spacing.md },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 40,
    paddingBottom: 20,
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: '#7C3AED20',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  heroSub: { fontSize: 13.5, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  suggestions: { width: '100%', gap: 10 },
  suggCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  suggIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  suggText: { flex: 1, fontSize: 13.5, lineHeight: 19 },
  empty: { textAlign: 'center', marginTop: 24 },
  // Sidebar
  sidebarOverlay: { flex: 1, flexDirection: 'row' },
  sidebarDismiss: { flex: 1 },
  sidebar: { width: 280, height: '100%', elevation: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20 },
  sidebarHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: 14, borderBottomWidth: 1,
  },
  newChatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  newChatText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  convItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.md, paddingVertical: 13,
  },
  convIcon: { width: 22, alignItems: 'center' },
  convTitle: { flex: 1, fontSize: 14 },
});
