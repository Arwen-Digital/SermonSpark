import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SermonSeries } from '@/types';
import { theme } from '@/constants/Theme';

interface SeriesCardProps {
  series: SermonSeries;
  onPress: (series: SermonSeries) => void;
}

export const SeriesCard: React.FC<SeriesCardProps> = ({ series, onPress }) => {
  const getStatusInfo = () => {
    if (series.isCompleted) {
      return { label: 'Completed', color: theme.colors.success, icon: 'checkmark-circle' as const };
    }
    if (series.isActive) {
      return { label: 'Active', color: theme.colors.primary, icon: 'play-circle' as const };
    }
    return { label: 'Planned', color: theme.colors.gray500, icon: 'time' as const };
  };

  const statusInfo = getStatusInfo();
  
  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <Pressable 
      style={[styles.card, { borderLeftColor: series.color }]} 
      onPress={() => onPress(series)}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {series.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
            <Ionicons 
              name={statusInfo.icon} 
              size={12} 
              color={statusInfo.color} 
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={theme.colors.gray400} 
        />
      </View>

      {series.description && (
        <Text style={styles.description} numberOfLines={2}>
          {series.description}
        </Text>
      )}

      <View style={styles.metadata}>
        <View style={styles.metaItem}>
          <Ionicons 
            name="library" 
            size={14} 
            color={theme.colors.gray500} 
          />
          <Text style={styles.metaText}>
            {series.sermonCount} sermon{series.sermonCount !== 1 ? 's' : ''}
          </Text>
        </View>

        {series.theme && (
          <View style={styles.metaItem}>
            <Ionicons 
              name="bookmark" 
              size={14} 
              color={theme.colors.gray500} 
            />
            <Text style={styles.metaText}>
              {series.theme}
            </Text>
          </View>
        )}

        {(series.startDate || series.endDate) && (
          <View style={styles.metaItem}>
            <Ionicons 
              name="calendar" 
              size={14} 
              color={theme.colors.gray500} 
            />
            <Text style={styles.metaText}>
              {formatDate(series.startDate)}
              {series.endDate && ` - ${formatDate(series.endDate)}`}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  titleContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
    gap: 4,
  },
  statusText: {
    ...theme.typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  description: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  metadata: {
    gap: theme.spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metaText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
});