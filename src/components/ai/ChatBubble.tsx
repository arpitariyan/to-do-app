import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, radii } from '@/src/theme/tokens';
import { AIMessage } from '@/src/lib/api/aiChat';
import { ActionResultCard } from './ActionResultCard';

interface ChatBubbleProps {
  message: AIMessage;
  onDelete?: (id: string) => void;
  onCopy?: (text: string) => void;
}

export function ChatBubble({ message, onDelete, onCopy }: ChatBubbleProps) {
  const { colors, isDark } = useTheme();
  const isUser = message.role === 'user';

  const actionResult = message.actionResult
    ? (() => { try { return JSON.parse(message.actionResult!); } catch { return null; } })()
    : null;

  const bubbleBg = isUser
    ? colors.accent
    : colors.glassSoft; // AI bubble uses glass effect

  const textColor = isUser ? '#fff' : colors.textPrimary;
  const timeStr = new Date(message.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperAI]}>
      {/* Avatar — only for AI */}
      {!isUser && (
        <View style={[styles.avatar, { shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 }]}>
          <Image source={require('../../../assets/app-logo.jpeg')} style={styles.avatarImage} />
        </View>
      )}

      <View style={[styles.bubbleCol, isUser ? styles.bubbleColUser : styles.bubbleColAI]}>
        {/* Bubble */}
        <View
          style={[
            styles.bubble,
            { backgroundColor: bubbleBg },
            isUser ? styles.bubbleUser : styles.bubbleAI,
            !isUser && { borderColor: colors.borderLight, borderWidth: 1 },
            isUser && { shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
          ]}
        >
          <Text style={[styles.text, { color: textColor }]}>
            {message.content}
          </Text>
        </View>

        {/* Action result card */}
        {!isUser && actionResult && message.actionType && message.actionType !== 'NONE' && (
          <ActionResultCard
            actionType={message.actionType}
            result={actionResult}
          />
        )}

        {/* Timestamp + actions */}
        <View style={[styles.meta, isUser ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
          <Text style={[styles.time, { color: colors.textMuted }]}>{timeStr}</Text>
          <TouchableOpacity onPress={() => onCopy?.(message.content)} style={styles.metaBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="copy-outline" size={11} color={colors.textMuted} />
          </TouchableOpacity>
          {onDelete && (
            <TouchableOpacity onPress={() => onDelete(message.$id)} style={styles.metaBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="trash-outline" size={11} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    marginVertical: 6,
    paddingHorizontal: spacing.md,
    alignItems: 'flex-end',
  },
  wrapperUser: { justifyContent: 'flex-end' },
  wrapperAI: { justifyContent: 'flex-start' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 20,
    backgroundColor: '#000',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  bubbleCol: { maxWidth: '78%' },
  bubbleColUser: { alignItems: 'flex-end' },
  bubbleColAI: { alignItems: 'flex-start' },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAI: { borderBottomLeftRadius: 4 },
  text: { fontSize: 15, lineHeight: 22 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  time: { fontSize: 10, fontWeight: '500' },
  metaBtn: { padding: 2 },
});
