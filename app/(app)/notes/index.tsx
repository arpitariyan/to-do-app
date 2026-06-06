import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeContext';
import { Screen } from '@/src/components/layout/Screen';
import { textStyles } from '@/src/theme/typography';
import { spacing, radii } from '@/src/theme/tokens';
import { useNotes } from '@/src/hooks/useNotes';

export default function NotesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data: notes = [], isLoading } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateNote = () => {
    router.push('/(app)/notes/new');
  };

  const handleNotePress = (id: string) => {
    router.push({ pathname: '/notes/[id]', params: { id } } as any);
  };

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    return notes.filter(n => 
      (n.title && n.title.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [notes, searchQuery]);

  // Split notes into two columns for pseudo-masonry layout
  const { leftCol, rightCol } = useMemo(() => {
    const left: typeof filteredNotes = [];
    const right: typeof filteredNotes = [];
    filteredNotes.forEach((note, index) => {
      if (index % 2 === 0) left.push(note);
      else right.push(note);
    });
    return { leftCol: left, rightCol: right };
  }, [filteredNotes]);

  return (
    <Screen withBottomPad>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[textStyles.screenTitle, { color: colors.textPrimary }]}>Notes</Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.bg2, borderColor: colors.border }]}>
        <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary, fontFamily: 'Inter_400Regular' }]}
          placeholder="Search notes..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : filteredNotes.length === 0 ? (
        <Animated.View entering={FadeIn.duration(500)} style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.bg2 }]}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
          </View>
          <Text style={[textStyles.sectionTitle, { color: colors.textPrimary, marginTop: spacing.lg }]}>
            {searchQuery ? "No matching notes" : "No notes yet"}
          </Text>
          <Text style={[textStyles.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
            {searchQuery ? "Try a different keyword." : "Tap the + button to capture a thought."}
          </Text>
        </Animated.View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.masonryContainer}>
            {/* Left Column */}
            <View style={styles.column}>
              {leftCol.map((note, index) => {
                const pastelColors = ['#F3E8FF', '#D1FAE5', '#E0F2FE', '#FFEDD5']; 
                const darkColors = ['#4C1D95', '#064E3B', '#0C4A6E', '#7C2D12'];
                const bg = colors.bg1 === '#FFFFFF' ? pastelColors[(index * 2) % 4] : darkColors[(index * 2) % 4];
                const textColor = colors.bg1 === '#FFFFFF' ? '#18181B' : '#F8FAFC';

                return (
                  <Animated.View key={note.$id} entering={FadeInDown.delay((index * 2) * 50).duration(400)}>
                    <TouchableOpacity
                      style={[styles.noteCard, { backgroundColor: bg }]}
                      activeOpacity={0.8}
                      onPress={() => handleNotePress(note.$id)}
                    >
                      <Text style={[textStyles.cardTitle, { color: textColor }]} numberOfLines={3}>
                        {note.title || 'Untitled'}
                      </Text>
                      {note.content ? (
                        <Text style={[textStyles.body, { color: textColor, opacity: 0.8, marginTop: spacing.sm }]} numberOfLines={6}>
                          {note.content}
                        </Text>
                      ) : null}
                      <Text style={[textStyles.caption, { color: textColor, opacity: 0.6, marginTop: spacing.md }]}>
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>

            {/* Right Column */}
            <View style={styles.column}>
              {rightCol.map((note, index) => {
                const pastelColors = ['#F3E8FF', '#D1FAE5', '#E0F2FE', '#FFEDD5']; 
                const darkColors = ['#4C1D95', '#064E3B', '#0C4A6E', '#7C2D12'];
                const bg = colors.bg1 === '#FFFFFF' ? pastelColors[(index * 2 + 1) % 4] : darkColors[(index * 2 + 1) % 4];
                const textColor = colors.bg1 === '#FFFFFF' ? '#18181B' : '#F8FAFC';

                return (
                  <Animated.View key={note.$id} entering={FadeInDown.delay((index * 2 + 1) * 50).duration(400)}>
                    <TouchableOpacity
                      style={[styles.noteCard, { backgroundColor: bg }]}
                      activeOpacity={0.8}
                      onPress={() => handleNotePress(note.$id)}
                    >
                      <Text style={[textStyles.cardTitle, { color: textColor }]} numberOfLines={3}>
                        {note.title || 'Untitled'}
                      </Text>
                      {note.content ? (
                        <Text style={[textStyles.body, { color: textColor, opacity: 0.8, marginTop: spacing.sm }]} numberOfLines={6}>
                          {note.content}
                        </Text>
                      ) : null}
                      <Text style={[textStyles.caption, { color: textColor, opacity: 0.6, marginTop: spacing.md }]}>
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.success, shadowColor: colors.success }]}
        activeOpacity={0.9}
        onPress={handleCreateNote}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radii.xl,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: radii['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 140, // space for FAB and floating tab bar
  },
  masonryContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  column: {
    flex: 1,
    gap: spacing.md,
  },
  noteCard: {
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 0,
  },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: spacing.lg,
    width: 64,
    height: 64,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});
