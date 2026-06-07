import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
    : colors.bg1;

  const textColor = isUser ? '#fff' : colors.textPrimary;
  const timeStr = new Date(message.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperAI]}>
      {/* Avatar — only for AI */}
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: colors.accent + '20' }]}>
          <Ionicons name="sparkles" size={14} color={colors.accent} />
        </View>
      )}

      <View style={[styles.bubbleCol, isUser ? styles.bubbleColUser : styles.bubbleColAI]}>
        {/* Bubble */}
        <View
          style={[
            styles.bubble,
            { backgroundColor: bubbleBg },
            isUser ? styles.bubbleUser : styles.bubbleAI,
            !isUser && { borderColor: colors.border, borderWidth: 1 },
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
    marginVertical: 4,
    paddingHorizontal: spacing.md,
    alignItems: 'flex-end',
  },
  wrapperUser: { justifyContent: 'flex-end' },
  wrapperAI: { justifyContent: 'flex-start' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 20,
  },
  bubbleCol: { maxWidth: '78%' },
  bubbleColUser: { alignItems: 'flex-end' },
  bubbleColAI: { alignItems: 'flex-start' },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAI: { borderBottomLeftRadius: 4 },
  text: { fontSize: 14.5, lineHeight: 21 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
    paddingHorizontal: 2,
  },
  time: { fontSize: 10 },
  metaBtn: { padding: 2 },
});
