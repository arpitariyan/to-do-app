import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  Clipboard, KeyboardAvoidingView, Platform,
  ActivityIndicator, Dimensions, TextInput, ScrollView, Image
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, radii } from '@/src/theme/tokens';
import { textStyles } from '@/src/theme/typography';
import { GlassCard } from '@/src/components/ui/GlassCard';

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
  { icon: 'document-text-outline', text: 'Create a note about React hooks', color: '#F59E0B' },
  { icon: 'list-outline', text: 'Show me all my tasks', color: '#8B5CF6' },
  { icon: 'calendar-outline', text: 'What tasks do I have this week?', color: '#EC4899' },
  { icon: 'pencil-outline', text: 'Summarize my latest note', color: '#14B8A6' },
];

// ─── Sidebar / Conversation History ──────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 320);

function ConversationSidebar({
  visible, onClose, conversations, activeId,
  onSelect, onNew, onActionMenu
}: {
  visible: boolean;
  onClose: () => void;
  conversations: AIConversation[];
  activeId: string | null;
  onSelect: (conv: AIConversation) => void;
  onNew: () => void;
  onActionMenu: (conv: AIConversation) => void;
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 220 });
      translateX.value = withTiming(0, { duration: 260 });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 180 });
      translateX.value = withTiming(-SIDEBAR_WIDTH, { duration: 220 });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const drawerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  // Sort pinned first, then by date
  const sortedConvs = [...conversations].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  const pinnedConvs = sortedConvs.filter(c => c.pinned);
  const otherConvs = sortedConvs.filter(c => !c.pinned);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      {/* Overlay */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.55)' }, overlayStyle]}>
        {/* Dismiss area (right side) */}
        <TouchableOpacity
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: SCREEN_WIDTH - SIDEBAR_WIDTH }}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Drawer */}
      <Animated.View style={[styles.drawer, drawerStyle]}>
        <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} experimentalBlurMethod="dimezisBlurView" />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassSoft }]} />
        
        {/* Header */}
        <View style={[styles.drawerHeader, { paddingTop: insets.top + 12, borderBottomColor: colors.glassBorder }]}>
          <View style={styles.drawerHeaderLeft}>
            <View style={[styles.drawerLogo, { overflow: 'hidden' }]}>
              <Image source={require('../../assets/app-logo.jpeg')} style={{ width: '100%', height: '100%' }} />
            </View>
            <Text style={[styles.drawerTitle, { color: colors.textPrimary }]}>Conversations</Text>
          </View>
          <TouchableOpacity
            style={[styles.newChatFab, { backgroundColor: colors.accent }]}
            onPress={() => { onNew(); onClose(); }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.newChatFabText}>New</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          {pinnedConvs.length > 0 && (
            <>
              <Text style={[styles.drawerSectionLabel, { color: colors.textMuted }]}>📌 PINNED</Text>
              {pinnedConvs.map(item => (
                <ConvRow
                  key={item.$id}
                  item={item}
                  activeId={activeId}
                  colors={colors}
                  onSelect={() => { onSelect(item); onClose(); }}
                  onLongPress={() => { onClose(); setTimeout(() => onActionMenu(item), 300); }}
                />
              ))}
            </>
          )}

          {otherConvs.length > 0 && (
            <>
              {pinnedConvs.length > 0 && (
                <Text style={[styles.drawerSectionLabel, { color: colors.textMuted }]}>💬 RECENT</Text>
              )}
              {otherConvs.map(item => (
                <ConvRow
                  key={item.$id}
                  item={item}
                  activeId={activeId}
                  colors={colors}
                  onSelect={() => { onSelect(item); onClose(); }}
                  onLongPress={() => { onClose(); setTimeout(() => onActionMenu(item), 300); }}
                />
              ))}
            </>
          )}

          {conversations.length === 0 && (
            <View style={styles.emptyDrawer}>
              <Ionicons name="chatbubbles-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyDrawerText, { color: colors.textMuted }]}>No conversations yet</Text>
              <Text style={[styles.emptyDrawerSub, { color: colors.textMuted }]}>Start a new chat to begin</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function ConvRow({ item, activeId, colors, onSelect, onLongPress }: {
  item: AIConversation;
  activeId: string | null;
  colors: any;
  onSelect: () => void;
  onLongPress: () => void;
}) {
  const isActive = item.$id === activeId;
  return (
    <TouchableOpacity
      style={[styles.convRow, isActive && { backgroundColor: colors.accentSoft }]}
      onPress={onSelect}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={[styles.convRowIcon, { backgroundColor: isActive ? colors.accentSoft : colors.bg2 }]}>
        <Ionicons
          name={item.pinned ? 'pin' : 'chatbubble-outline'}
          size={14}
          color={isActive ? colors.accent : colors.textMuted}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.convRowTitle, { color: isActive ? colors.accent : colors.textPrimary }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
      </View>
      <Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

// ─── Main AI Screen ───────────────────────────────────────────────────────────

export default function AIScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConv, setActiveConv] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);

  // Bottom Sheet Action Menu state
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [actionMenuConv, setActionMenuConv] = useState<AIConversation | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [showToast, setShowToast] = useState<string | null>(null);

  // Delete confirm bottom sheet
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

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
      return conv;
    } catch (e) {
      console.warn('Failed to create conversation:', e);
      return null;
    }
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');

    let conv = activeConv;
    if (!conv) {
      conv = await startNewConversation(text);
    }

    if (!conv) return;

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

  // ── Handle suggestion tap ──────────────────────────────────────────────────
  const handleSuggestion = async (text: string) => {
    setInput('');
    let conv = activeConv;
    if (!conv) {
      conv = await startNewConversation(text);
    }
    if (!conv) return;

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

  // ── Delete conversation (with bottom sheet confirm) ────────────────────────
  const handleDeleteConvRequest = (id: string) => {
    setDeleteTargetId(id);
    setDeleteConfirmVisible(true);
  };

  const handleDeleteConvConfirm = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteConfirmVisible(false);
    setDeleteTargetId(null);
    await deleteConversation(id).catch(() => { });
    setConversations((prev) => prev.filter((c) => c.$id !== id));
    if (activeConv?.$id === id) {
      setActiveConv(null);
      setMessages([]);
      historyRef.current = [];
    }
    toast('Conversation deleted');
  };

  const handlePin = async (id: string, pinned: boolean) => {
    await pinConversation(id, pinned).catch(() => { });
    setConversations((prev) => prev.map((c) => c.$id === id ? { ...c, pinned } : c));
    // Also update actionMenuConv so the button label reflects new state
    if (actionMenuConv?.$id === id) setActionMenuConv(p => p ? { ...p, pinned } : p);
    toast(pinned ? '📌 Pinned to top' : 'Unpinned');
  };

  const handleRenameSubmit = async () => {
    if (!actionMenuConv || !renameText.trim()) {
      setIsRenaming(false);
      return;
    }
    const id = actionMenuConv.$id;
    const newTitle = renameText.trim();
    await renameConversation(id, newTitle).catch(() => { });
    setConversations((prev) => prev.map((c) => c.$id === id ? { ...c, title: newTitle } : c));
    if (activeConv?.$id === id) setActiveConv((p) => p ? { ...p, title: newTitle } : p);
    setIsRenaming(false);
    setActionMenuVisible(false);
    toast('✏️ Renamed');
  };

  const handleDeleteMsg = async (msgId: string) => {
    await deleteMessage(msgId).catch(() => { });
    setMessages((prev) => prev.filter((m) => m.$id !== msgId));
  };

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
  };

  const toast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 2200);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const isEmptyChat = messages.length === 0 && !isTyping;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: colors.glassBorder, backgroundColor: 'transparent' }]}>
        <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.headerBtn} activeOpacity={0.7}>
          <Ionicons name="menu" size={26} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {activeConv?.title ?? 'Astra Assistant'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            setActiveConv(null);
            setMessages([]);
            historyRef.current = [];
            startNewConversation();
          }}
          style={styles.headerBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={24} color={colors.accent} />
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
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m.$id}
            contentContainerStyle={[styles.messageList, isEmptyChat && { flex: 1 }]}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {/* Hero Icon */}
                <View style={[styles.heroIconWrap, { overflow: 'hidden', backgroundColor: '#000', borderWidth: 0, shadowColor: colors.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 }]}>
                  <Image source={require('../../assets/app-logo.jpeg')} style={{ width: '100%', height: '100%' }} />
                </View>

                <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
                  Hi, I'm Astra
                </Text>
                <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
                  I can manage your tasks and notes effortlessly.{'\n'}Try a suggestion or ask me anything.
                </Text>

                {/* Suggestion Grid */}
                <View style={styles.suggestionsGrid}>
                  {SUGGESTIONS.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.suggCard}
                      onPress={() => handleSuggestion(s.text)}
                      activeOpacity={0.65}
                    >
                      <GlassCard intensity={30} style={{ padding: 13, borderColor: colors.glassBorder }}>
                        <View style={[styles.suggIconWrap, { backgroundColor: s.color + '22' }]}>
                          <Ionicons name={s.icon as any} size={18} color={s.color} />
                        </View>
                        <Text style={[styles.suggText, { color: colors.textSecondary }]} numberOfLines={3}>
                          {s.text}
                        </Text>
                      </GlassCard>
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

      {/* ── Sidebar Drawer ── */}
      <ConversationSidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeId={activeConv?.$id ?? null}
        onSelect={loadConversation}
        onNew={() => { setActiveConv(null); setMessages([]); historyRef.current = []; }}
        onActionMenu={(conv) => {
          setActionMenuConv(conv);
          setRenameText(conv.title);
          setIsRenaming(false);
          setActionMenuVisible(true);
        }}
      />

      {/* ── Action Menu Bottom Sheet ── */}
      <Modal
        visible={actionMenuVisible}
        animationType="slide"
        transparent
        onRequestClose={() => { setActionMenuVisible(false); setIsRenaming(false); }}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity
            style={styles.bsOverlay}
            activeOpacity={1}
            onPress={() => { setActionMenuVisible(false); setIsRenaming(false); }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.bsSheet, { backgroundColor: colors.bg1, paddingBottom: insets.bottom + spacing.lg }]}
            >
              <View style={[styles.bsHandle, { backgroundColor: colors.bg3 }]} />

              {actionMenuConv && !isRenaming && (
                <>
                  <Text style={[styles.bsTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {actionMenuConv.title}
                  </Text>

                  <TouchableOpacity
                    style={styles.bsItem}
                    onPress={() => { handlePin(actionMenuConv.$id, !actionMenuConv.pinned); setActionMenuVisible(false); }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.bsItemIcon, { backgroundColor: colors.warningSoft }]}>
                      <Ionicons name={actionMenuConv.pinned ? 'pin-outline' : 'pin'} size={20} color={colors.warning} />
                    </View>
                    <Text style={[styles.bsItemText, { color: colors.textPrimary }]}>
                      {actionMenuConv.pinned ? 'Unpin conversation' : 'Pin to top'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.bsItem}
                    onPress={() => setIsRenaming(true)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.bsItemIcon, { backgroundColor: colors.accentSoft }]}>
                      <Ionicons name="pencil" size={20} color={colors.accent} />
                    </View>
                    <Text style={[styles.bsItemText, { color: colors.textPrimary }]}>Rename</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.bsItem, { borderBottomWidth: 0 }]}
                    onPress={() => { setActionMenuVisible(false); handleDeleteConvRequest(actionMenuConv.$id); }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.bsItemIcon, { backgroundColor: colors.errorSoft }]}>
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </View>
                    <Text style={[styles.bsItemText, { color: colors.error }]}>Delete conversation</Text>
                  </TouchableOpacity>
                </>
              )}

              {actionMenuConv && isRenaming && (
                <>
                  <Text style={[styles.bsTitle, { color: colors.textPrimary }]}>Rename</Text>
                  <TextInput
                    style={[styles.renameInput, {
                      backgroundColor: colors.bg2,
                      color: colors.textPrimary,
                      borderColor: colors.borderLight,
                    }]}
                    value={renameText}
                    onChangeText={setRenameText}
                    autoFocus
                    placeholder="Conversation name…"
                    placeholderTextColor={colors.textMuted}
                    onSubmitEditing={handleRenameSubmit}
                    returnKeyType="done"
                  />
                  <View style={styles.renameActions}>
                    <TouchableOpacity
                      style={[styles.renameBtn, { backgroundColor: colors.bg3 }]}
                      onPress={() => setIsRenaming(false)}
                    >
                      <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.renameBtn, { backgroundColor: colors.accent }]}
                      onPress={handleRenameSubmit}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Delete Confirm Bottom Sheet ── */}
      <Modal
        visible={deleteConfirmVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <TouchableOpacity
          style={styles.bsOverlay}
          activeOpacity={1}
          onPress={() => setDeleteConfirmVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.bsSheet, { backgroundColor: colors.bg1, paddingBottom: insets.bottom + spacing.lg }]}
          >
            <View style={[styles.bsHandle, { backgroundColor: colors.bg3 }]} />

            <View style={[styles.deleteIconCircle, { backgroundColor: colors.errorSoft }]}>
              <Ionicons name="trash" size={28} color={colors.error} />
            </View>

            <Text style={[styles.bsTitle, { color: colors.textPrimary, textAlign: 'center' }]}>
              Delete Conversation?
            </Text>
            <Text style={[styles.bsSubtitle, { color: colors.textSecondary, textAlign: 'center' }]}>
              This will permanently delete all messages in this conversation. This action cannot be undone.
            </Text>

            <TouchableOpacity
              style={[styles.deleteConfirmBtn, { backgroundColor: colors.error }]}
              onPress={handleDeleteConvConfirm}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.deleteConfirmBtnText}>Delete Conversation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteCancelBtn, { backgroundColor: colors.bg2 }]}
              onPress={() => setDeleteConfirmVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.deleteCancelBtnText, { color: colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Toast ── */}
      {showToast && (
        <View style={styles.toastContainer} pointerEvents="none">
          <View style={[styles.toast, { backgroundColor: colors.bg3 }]}>
            <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{showToast}</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  headerTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: { paddingVertical: spacing.md },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  heroIconWrap: {
    width: 76, height: 76, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  heroTitle: { fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center', letterSpacing: -0.3 },
  heroSub: { fontSize: 13.5, textAlign: 'center', lineHeight: 21, marginBottom: 28 },

  // Suggestion grid
  suggestionsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  suggCard: {
    width: '47.5%',
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 0,
  },
  suggIconWrap: {
    width: 34, height: 34, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  suggText: { fontSize: 12.5, lineHeight: 18, fontWeight: '500' },

  // ── Drawer ──────────────────────────────────────────────────────────────────
  drawer: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  drawerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drawerLogo: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  drawerTitle: { fontSize: 17, fontWeight: '700' },
  newChatFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  newChatFabText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  drawerSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 6,
  },

  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 12,
    marginBottom: 2,
  },
  convRowIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  convRowTitle: { fontSize: 14, fontWeight: '500' },

  emptyDrawer: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyDrawerText: { fontSize: 15, fontWeight: '600', marginTop: 8 },
  emptyDrawerSub: { fontSize: 13 },

  // ── Bottom Sheet common ────────────────────────────────────────────────────
  bsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bsSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.xl,
    paddingTop: 14,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  bsHandle: {
    width: 44, height: 4, borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  bsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  bsSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },

  // Action menu items
  bsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.1)',
  },
  bsItemIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  bsItemText: { fontSize: 16, fontWeight: '500' },

  // Rename
  renameInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
    marginTop: 8,
  },
  renameActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  renameBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },

  // Delete confirm
  deleteIconCircle: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  deleteConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: spacing.sm,
  },
  deleteConfirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteCancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
  },
  deleteCancelBtnText: { fontSize: 15, fontWeight: '600' },

  // Toast
  toastContainer: {
    position: 'absolute',
    bottom: 110,
    left: 0, right: 0,
    alignItems: 'center',
  },
  toast: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
});
