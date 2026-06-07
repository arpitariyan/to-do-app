import React, { useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing } from '@/src/theme/tokens';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function ChatInput({ value, onChangeText, onSend, isLoading, placeholder }: ChatInputProps) {
  const { colors, isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const canSend = value.trim().length > 0 && !isLoading;

  const inputBg = colors.bg2;
  const borderColor = colors.border;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg0, borderTopColor: borderColor }]}>
      <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: isLoading ? colors.accent : borderColor }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.textPrimary }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? 'Ask AI anything…'}
          placeholderTextColor={isDark ? '#5B4E80' : '#9CA3AF'}
          multiline
          maxLength={1000}
          editable={!isLoading}
          onSubmitEditing={canSend ? onSend : undefined}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: canSend ? colors.accent : colors.bg3 }]}
          onPress={onSend}
          disabled={!canSend}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="arrow-up" size={18} color={canSend ? '#fff' : colors.textMuted} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    // Added 85px to account for the absolute bottom tab bar
    paddingBottom: Platform.OS === 'ios' ? 105 : 95,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    borderWidth: 1.5,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    fontSize: 15,
    lineHeight: 21,
    paddingTop: Platform.OS === 'ios' ? 4 : 2,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
