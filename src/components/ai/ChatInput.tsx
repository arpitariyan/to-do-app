import React, { useRef, useState } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, radii } from '@/src/theme/tokens';

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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg0 }]}>
      {/* Top divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={[
        styles.inputRow,
        {
          backgroundColor: colors.bg1,
          borderColor: isFocused ? colors.accent : colors.borderLight,
          shadowColor: colors.accent,
        }
      ]}>
        {/* Sparkles prefix icon */}
        <View style={[styles.prefixIcon, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name="sparkles" size={14} color={colors.accent} />
        </View>

        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.textPrimary }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? 'Ask AI anything…'}
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={1000}
          editable={!isLoading}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={canSend ? onSend : undefined}
          returnKeyType="default"
        />

        {/* Send button */}
        <TouchableOpacity
          style={[
            styles.sendBtn,
            {
              backgroundColor: canSend ? colors.accent : colors.bg3,
              opacity: canSend ? 1 : 0.5,
            }
          ]}
          onPress={onSend}
          disabled={!canSend}
          activeOpacity={0.75}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name="arrow-up"
              size={17}
              color={canSend ? '#fff' : colors.textMuted}
            />
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
    paddingBottom: Platform.OS === 'ios' ? 100 : 90,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: radii.xl,
    borderWidth: 1.5,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 8,
    gap: 8,
    // Subtle glow when focused
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  prefixIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 130,
    fontSize: 15,
    lineHeight: 22,
    paddingTop: Platform.OS === 'ios' ? 7 : 4,
    paddingBottom: Platform.OS === 'ios' ? 3 : 2,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
    flexShrink: 0,
  },
});
