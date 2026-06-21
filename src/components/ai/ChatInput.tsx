import React, { useRef, useState } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, Image
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
      <View style={[
        styles.inputRow,
        {
          backgroundColor: colors.bg1,
          borderColor: isFocused ? colors.accent : colors.glassBorder,
          shadowColor: colors.accent,
          shadowOpacity: isFocused ? 0.2 : 0.05,
          shadowRadius: isFocused ? 12 : 5,
          elevation: isFocused ? 6 : 2,
        }
      ]}>
        {/* App Logo prefix */}
        <View style={styles.prefixIcon}>
          <Image source={require('../../../assets/app-logo.jpeg')} style={styles.prefixImage} />
        </View>

        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.textPrimary }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? 'Message Astra…'}
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
              size={18}
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24, // pill-shaped
    borderWidth: 1.5,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  prefixIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
    flexShrink: 0,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  prefixImage: {
    width: '100%',
    height: '100%',
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 130,
    fontSize: 16,
    lineHeight: 22,
    paddingTop: Platform.OS === 'ios' ? 8 : 6,
    paddingBottom: Platform.OS === 'ios' ? 8 : 6,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    flexShrink: 0,
  },
});
