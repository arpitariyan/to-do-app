import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
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
  const { data: notes, isLoading } = useNotes();

  const handleCreateNote = () => {
    router.push('/(app)/notes/new');
  };

  const handleNotePress = (id: string) => {
    router.push(`/(app)/notes/${id}`);
  };

  return (
    <Screen withBottomPad>
      <Animated.View entering={FadeInDown.delay(0).duration(500)} style={styles.header}>
        <Text style={[textStyles.headingLg, { color: colors.textPrimary }]}>Notes</Text>
        <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name="search-outline" size={20} color={colors.accent} />
        </TouchableOpacity>
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : notes?.length === 0 ? (
        <Animated.View entering={FadeIn.duration(500)} style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.successSoft }]}>
            <Ionicons name="document-text-outline" size={48} color={colors.success} />
          </View>
          <Text style={[textStyles.headingMd, { color: colors.textPrimary, marginTop: spacing.lg }]}>
            No notes yet
          </Text>
          <Text style={[textStyles.bodyMd, { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }]}>
            Tap the + button to create your first note.
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.$id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(400)} style={styles.noteCardWrapper}>
              <TouchableOpacity
                style={[styles.noteCard, { backgroundColor: colors.bg2, borderColor: colors.border }]}
                activeOpacity={0.7}
                onPress={() => handleNotePress(item.$id)}
              >
                <Text style={[textStyles.labelLg, { color: colors.textPrimary }]} numberOfLines={2}>
                  {item.title || 'Untitled Note'}
                </Text>
                {item.content ? (
                  <Text style={[textStyles.bodySm, { color: colors.textSecondary, marginTop: spacing.xs }]} numberOfLines={4}>
                    {item.content}
                  </Text>
                ) : null}
                <Text style={[textStyles.caption, { color: colors.textMuted, marginTop: spacing.md }]}>
                  {new Date(item.updatedAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.success }]}
        activeOpacity={0.85}
        onPress={handleCreateNote}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.base,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: radii['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 100, // Make room for FAB
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  noteCardWrapper: {
    width: '48%',
  },
  noteCard: {
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    minHeight: 140,
  },
  fab: {
    position: 'absolute',
    bottom: spacing['2xl'],
    right: spacing.base,
    width: 56,
    height: 56,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
});
