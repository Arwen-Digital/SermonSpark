import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/Theme';
import { SermonDto } from '@/services/supabaseSermonService';

export function UpcomingCard({ sermon }: { sermon: SermonDto | null }) {
  if (!sermon || !sermon.date) return null;
  const date = new Date(sermon.date);
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Upcoming</Text>
          <Text style={styles.subtitle} numberOfLines={2}>{date.toLocaleDateString()} • {sermon.title || 'Untitled sermon'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '15',
  },
  content: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
  },
  title: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  subtitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
  },
});

