import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { LoadingIndicator } from '../common/LoadingIndicator';
import { theme } from '@/constants/Theme';
import { seriesRepository } from '@/services/repositories';
import { syncAll } from '@/services/sync/syncService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWindowDimensions } from 'react-native';

type SeriesItem = {
  id: string;
  title: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  tags?: string[];
  status: 'planning' | 'active' | 'completed' | 'archived';
  sermonCount?: number;
};

interface SeriesListScreenProps {
  onCreateSeries: () => void;
  onViewSeries: (seriesId: string) => void;
}

export const SeriesListScreen: React.FC<SeriesListScreenProps> = ({
  onCreateSeries,
  onViewSeries
}) => {
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLargeScreen = Math.min(width, height) >= 768;

  const loadSeries = useCallback(async () => {
    try {
      const data = await seriesRepository.list();
      const mapped: SeriesItem[] = data.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description ?? undefined,
        startDate: s.startDate ?? undefined,
        endDate: s.endDate ?? undefined,
        tags: s.tags ?? [],
        status: s.status,
        sermonCount: (s as any).sermonCount ?? 0,
      }));
      setSeries(mapped);
    } catch (error) {
      console.error('Error loading series:', error);
      Alert.alert('Error', 'Failed to load series. Please try again.');
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSeries();
    setRefreshing(false);
  }, [loadSeries]);

  const handleSyncNow = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await syncAll();
      await loadSeries();
    } catch (e: any) {
      console.warn('Series sync failed', e);
      Alert.alert('Sync failed', e?.message || 'Please try again.');
    } finally {
      setSyncing(false);
    }
  }, [syncing, loadSeries]);

  // handleDeleteSeries defined below with cross-platform confirm

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return theme.colors.warning;
      case 'active': return theme.colors.success;
      case 'completed': return theme.colors.primary;
      case 'archived': return theme.colors.textSecondary;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return 'calendar-outline';
      case 'active': return 'play-circle-outline';
      case 'completed': return 'checkmark-circle-outline';
      case 'archived': return 'archive-outline';
      default: return 'help-circle-outline';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  // Deletion is handled on the series details page

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await loadSeries();
      setLoading(false);
    };
    initializeData();
  }, [loadSeries]);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingState]}>
        <LoadingIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[
        styles.headerContainer,
        { paddingTop: Math.max((insets.top || 0) + (isLargeScreen ? theme.spacing.md : theme.spacing.sm), isLargeScreen ? theme.spacing.xl : theme.spacing.md) }
      ]}>
        <View style={styles.headerTopRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>My Series</Text>
          <View style={styles.headerRightRow}>
            <Pressable
              onPress={handleSyncNow}
              style={({ pressed }) => [styles.syncGhostButton, pressed && { opacity: 0.9 }]}
              disabled={syncing}
              accessibilityRole="button"
              accessibilityLabel="Sync now"
            >
              {syncing ? (
                <LoadingIndicator color={theme.colors.primary} size="small" />
              ) : (
                <Ionicons name="sync" size={18} color={theme.colors.primary} />
              )}
            </Pressable>
            <Button
              title="New Series"
              onPress={onCreateSeries}
              style={styles.createButton}
              icon={<Ionicons name="add" size={16} color={theme.colors.textOnPrimary} />}
            />
          </View>
        </View>
      </View>

      {/* Series List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {series.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Series Yet</Text>
            <Text style={styles.emptyDescription}>
              Create your first sermon series to get started organizing your messages.
            </Text>
            <Button
              title="Create Your First Series"
              onPress={onCreateSeries}
              style={styles.emptyButton}
            />
          </View>
        ) : (
          series.map((seriesItem) => (
            <Card key={seriesItem.id} style={styles.seriesCard}>
              <Pressable
                style={styles.cardContent}
                onPress={() => onViewSeries(seriesItem.id)}
                android_ripple={{ color: theme.colors.primary + '20' }}
              >
                {/* Series Header */}
                <View style={styles.seriesHeader}>
                  <Text style={styles.seriesTitle} numberOfLines={2}>
                    {seriesItem.title}
                  </Text>
                  {seriesItem.description && (
                    <Text style={styles.seriesDescription} numberOfLines={3}>
                      {seriesItem.description}
                    </Text>
                  )}
                </View>

                {/* Series Meta */}
                <View style={styles.seriesMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(seriesItem.status) + '20' }]}>
                    <Ionicons
                      name={getStatusIcon(seriesItem.status) as any}
                      size={12}
                      color={getStatusColor(seriesItem.status)}
                    />
                    <Text style={[styles.statusText, { color: getStatusColor(seriesItem.status) }]}>
                      {seriesItem.status}
                    </Text>
                  </View>

                  {(seriesItem.startDate || seriesItem.endDate) && (
                    <View style={styles.dateRange}>
                      <Ionicons name="calendar-outline" size={12} color={theme.colors.textSecondary} />
                      <Text style={styles.dateText}>
                        {seriesItem.startDate && formatDate(seriesItem.startDate)}
                        {seriesItem.startDate && seriesItem.endDate && ' - '}
                        {seriesItem.endDate && formatDate(seriesItem.endDate)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.sermonCount}>
                    <Ionicons name="document-text-outline" size={12} color={theme.colors.textSecondary} />
                    <Text style={styles.countText}>
                      {seriesItem.sermonCount ?? 0} sermons
                    </Text>
                  </View>
                </View>

                {/* Tags */}
                {seriesItem.tags && seriesItem.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {seriesItem.tags.slice(0, 3).map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                    {seriesItem.tags.length > 3 && (
                      <Text style={styles.moreTagsText}>+{seriesItem.tags.length - 3} more</Text>
                    )}
                  </View>
                )}
              </Pressable>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingState: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  headerContainer: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    
  },
  backButton: {
    paddingRight: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  createButton: {
    paddingHorizontal: theme.spacing.md,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  syncGhostButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: theme.typography.h5.fontSize,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyDescription: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    lineHeight: 22,
  },
  emptyButton: {
    minWidth: 200,
  },
  seriesCard: {
    marginBottom: theme.spacing.md,
  },
  cardContent: {
    padding: theme.spacing.sm,
  },
  seriesHeader: {
    marginBottom: theme.spacing.md,
  },
  seriesTitle: {
    fontSize: theme.typography.h5.fontSize,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  seriesDescription: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  seriesMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
    textTransform: 'capitalize',
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  sermonCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  tag: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  tagText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
});
