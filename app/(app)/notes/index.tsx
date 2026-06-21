import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeContext';
import { Screen } from '@/src/components/layout/Screen';
import { textStyles } from '@/src/theme/typography';
import { spacing, radii } from '@/src/theme/tokens';
import { GlassCard } from '@/src/components/ui/GlassCard';
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

  const pinnedNotes = useMemo(() => {
    return filteredNotes.filter(n => n.pinned);
  }, [filteredNotes]);

  // Split unpinned notes into two columns for pseudo-masonry layout
  const { leftCol, rightCol } = useMemo(() => {
    const unpinned = filteredNotes.filter(n => !n.pinned);
    const left: typeof filteredNotes = [];
    const right: typeof filteredNotes = [];
    unpinned.forEach((note, index) => {
      if (index % 2 === 0) left.push(note);
      else right.push(note);
    });
    return { leftCol: left, rightCol: right };
  }, [filteredNotes]);

  return (
    <Screen withBottomPad noPadding>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} stickyHeaderIndices={[]}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(10).duration(500)} style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[textStyles.screenTitle, { color: colors.textPrimary, fontSize: 36, lineHeight: 44, fontWeight: '800' }]}>
              My Notes
            </Text>
            {/* <Text style={[textStyles.bodyMd, { color: colors.textSecondary, marginTop: spacing.xs, fontWeight: '500' }]}>
              {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'} captured
            </Text> */}
          </View>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={[styles.searchContainer, { backgroundColor: colors.glassSoft, borderColor: colors.glassBorder, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }]}>
          <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary, fontFamily: 'Inter_500Medium' }]}
            placeholder="Search your thoughts..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : filteredNotes.length === 0 ? (
          <Animated.View entering={FadeIn.duration(500)} style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.glassSoft }]}>
              <Ionicons name="document-text" size={48} color={colors.accent} />
            </View>
            <Text style={[textStyles.sectionTitle, { color: colors.textPrimary, marginTop: spacing.xl }]}>
              {searchQuery ? "No matching notes" : "No notes yet"}
            </Text>
            <Text style={[textStyles.body, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
              {searchQuery ? "Try a different keyword." : "Tap the pencil button to capture a thought."}
            </Text>
          </Animated.View>
        ) : (
          <>
            {pinnedNotes.length > 0 && (
              <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.pinnedSection}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
                  <Ionicons name="pin" size={16} color={colors.textSecondary} style={{ marginRight: spacing.xs }} />
                  <Text style={[textStyles.labelLg, { color: colors.textSecondary }]}>
                    Pinned
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.sm }}>
                  {pinnedNotes.map((note) => (
                    <TouchableOpacity
                      key={note.$id}
                      activeOpacity={0.8}
                      onPress={() => handleNotePress(note.$id)}
                    >
                      <GlassCard intensity={40} style={[styles.noteCard, { width: 220, borderColor: colors.glassBorder }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Text style={[textStyles.cardTitle, { color: colors.textPrimary, flex: 1 }]} numberOfLines={2}>
                            {note.title || 'Untitled'}
                          </Text>
                          <View style={{ backgroundColor: colors.accent + '20', padding: 4, borderRadius: 10 }}>
                            <Ionicons name="pin" size={14} color={colors.accent} />
                          </View>
                        </View>
                        {note.content ? (
                          <Text style={[textStyles.body, { color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 22 }]} numberOfLines={3}>
                            {note.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim()}
                          </Text>
                        ) : null}
                      </GlassCard>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>
            )}

            <View style={styles.masonryContainer}>
              {/* Left Column */}
              <View style={styles.column}>
                {leftCol.map((note, index) => {
                  const pastelColors = ['rgba(243,232,255,0.4)', 'rgba(209,250,229,0.4)', 'rgba(224,242,254,0.4)', 'rgba(255,237,213,0.4)'];
                  const darkColors = ['rgba(76,29,149,0.4)', 'rgba(6,78,59,0.4)', 'rgba(12,74,110,0.4)', 'rgba(124,45,18,0.4)'];
                  const bg = note.color || (colors.bg1 === '#FFFFFF' ? pastelColors[(index * 2) % 4] : darkColors[(index * 2) % 4]);
                  const textColor = note.color ? '#18181B' : colors.textPrimary;

                  return (
                    <Animated.View key={note.$id} entering={FadeInDown.delay((index * 2) * 50).duration(400)}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleNotePress(note.$id)}
                      >
                        <GlassCard intensity={30} style={[styles.noteCard, { backgroundColor: bg, borderColor: colors.glassBorder }]}>
                          <Text style={[textStyles.cardTitle, { color: textColor }]} numberOfLines={3}>
                            {note.title || 'Untitled'}
                          </Text>
                          {note.content ? (
                            <Text style={[textStyles.body, { color: textColor, opacity: 0.8, marginTop: spacing.sm, lineHeight: 22 }]} numberOfLines={6}>
                              {note.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim()}
                            </Text>
                          ) : null}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md }}>
                            <Text style={[textStyles.caption, { color: textColor, opacity: 0.6, fontWeight: '600' }]}>
                              {new Date(note.updatedAt).toLocaleDateString()}
                            </Text>
                            {note.attachments && note.attachments.length > 0 && (
                              <Ionicons name="attach" size={16} color={textColor} style={{ opacity: 0.8 }} />
                            )}
                          </View>
                        </GlassCard>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>

              {/* Right Column */}
              <View style={styles.column}>
                {rightCol.map((note, index) => {
                  const pastelColors = ['rgba(243,232,255,0.4)', 'rgba(209,250,229,0.4)', 'rgba(224,242,254,0.4)', 'rgba(255,237,213,0.4)'];
                  const darkColors = ['rgba(76,29,149,0.4)', 'rgba(6,78,59,0.4)', 'rgba(12,74,110,0.4)', 'rgba(124,45,18,0.4)'];
                  const bg = note.color || (colors.bg1 === '#FFFFFF' ? pastelColors[(index * 2 + 1) % 4] : darkColors[(index * 2 + 1) % 4]);
                  const textColor = note.color ? '#18181B' : colors.textPrimary;

                  return (
                    <Animated.View key={note.$id} entering={FadeInDown.delay((index * 2 + 1) * 50).duration(400)}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleNotePress(note.$id)}
                      >
                        <GlassCard intensity={30} style={[styles.noteCard, { backgroundColor: bg, borderColor: colors.glassBorder }]}>
                          <Text style={[textStyles.cardTitle, { color: textColor }]} numberOfLines={3}>
                            {note.title || 'Untitled'}
                          </Text>
                          {note.content ? (
                            <Text style={[textStyles.body, { color: textColor, opacity: 0.8, marginTop: spacing.sm, lineHeight: 22 }]} numberOfLines={6}>
                              {note.content.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim()}
                            </Text>
                          ) : null}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md }}>
                            <Text style={[textStyles.caption, { color: textColor, opacity: 0.6, fontWeight: '600' }]}>
                              {new Date(note.updatedAt).toLocaleDateString()}
                            </Text>
                            {note.attachments && note.attachments.length > 0 && (
                              <Ionicons name="attach" size={16} color={textColor} style={{ opacity: 0.8 }} />
                            )}
                          </View>
                        </GlassCard>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* FAB - Fixed color and icon */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
        activeOpacity={0.9}
        onPress={handleCreateNote}
      >
        <Ionicons name="pencil" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 52,
    borderRadius: radii.full,
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
  pinnedSection: {
    marginBottom: spacing.xl,
  },
  column: {
    flex: 1,
    gap: spacing.md,
  },
  noteCard: {
    padding: spacing.lg,
    borderRadius: radii['2xl'],
    borderWidth: 0,
  },
  fab: {
    position: 'absolute',
    bottom: 130,
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
