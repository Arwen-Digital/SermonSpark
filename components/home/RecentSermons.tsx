import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/Theme';
import { SermonDto } from '@/services/expressSermonService';

export function RecentSermons({ sermons, onOpen }: { sermons: SermonDto[]; onOpen: (s: SermonDto) => void }) {
  if (!sermons || sermons.length === 0) return null;
  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Recent sermons</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {sermons.map((s) => (
          <Pressable key={s.id} style={styles.card} onPress={() => onOpen(s)}>
            <Ionicons name="document-text-outline" size={18} color={theme.colors.primary} />
            <Text numberOfLines={2} style={styles.cardTitle}>{s.title || 'Untitled sermon'}</Text>
            {s.date && <Text style={styles.cardMeta}>{new Date(s.date).toLocaleDateString()}</Text>}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  header: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
  },
  row: {
    gap: theme.spacing.md as unknown as number,
  },
  card: {
    width: 180,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  cardTitle: {
    marginTop: theme.spacing.sm,
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
  },
  cardMeta: {
    marginTop: theme.spacing.xs,
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
});

