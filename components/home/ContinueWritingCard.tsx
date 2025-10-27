import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/Theme';
import type { SermonDTO } from '@/services/repositories/types';

export function ContinueWritingCard({ sermon, onResume }: { sermon: SermonDto | null; onResume: (s: SermonDto) => void }) {
  if (!sermon) return null;
  return (
    <TouchableOpacity style={styles.container} onPress={() => onResume(sermon)}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Continue writing</Text>
          <Text style={styles.subtitle} numberOfLines={2}>{sermon.title || 'Untitled sermon'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
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

