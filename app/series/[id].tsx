import React, { useEffect, useMemo, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  SafeAreaView, 
  ScrollView, 
  Text, 
  FlatList,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { FadeInView } from '@/components/common/FadeInView';
import { theme } from '@/constants/Theme';
import seriesService, { Series } from '@/services/supabaseSeriesService';

export default function SeriesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!id) throw new Error('Missing series id');
        const s = await seriesService.getSeriesById(id);
        if (mounted) setSeries(s);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load series');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const statusInfo = useMemo(() => {
    const s = series?.status;
    if (s === 'completed') return { label: 'Completed', color: theme.colors.primary, icon: 'checkmark-circle' as const };
    if (s === 'active') return { label: 'Active', color: theme.colors.success, icon: 'play-circle' as const };
    if (s === 'archived') return { label: 'Archived', color: theme.colors.gray500, icon: 'archive' as const };
    return { label: 'Planning', color: theme.colors.warning, icon: 'calendar' as const };
  }, [series?.status]);

  const sermonCount = series?.sermons?.length || 0;

  if (loading) {
    return (
      <FadeInView style={styles.container}>
        <Stack.Screen options={{ title: 'Loading Series', headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.notFound}>
            <Ionicons name="sync" size={32} color={theme.colors.gray500} />
            <Text style={styles.notFoundText}>Loading series…</Text>
          </View>
        </SafeAreaView>
      </FadeInView>
    );
  }

  if (!series || error) {
    return (
      <FadeInView style={styles.container}>
        <Stack.Screen options={{ title: 'Series Not Found', headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.notFound}>
            <Ionicons name="library-outline" size={64} color={theme.colors.gray400} />
            <Text style={styles.notFoundTitle}>Series Not Found</Text>
            <Text style={styles.notFoundText}>
              {error || 'The requested series could not be found.'}
            </Text>
            <Pressable 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </FadeInView>
    );
  }


  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const handleAddSermon = () => {
    router.push(`/sermon/create?seriesId=${series.id}`);
  };

  const handleEditSeries = () => {
    router.push(`/series/${series.documentId}/edit`);
  };

  const handleDeleteSeries = () => {
    if (!series) return;

    const doDelete = async () => {
      try {
        await seriesService.deleteSeries(series.documentId);
        if (Platform.OS === 'web') {
          router.replace('/series');
        } else if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/series');
        }
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to delete series');
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined'
        ? window.confirm('Delete this series? This action cannot be undone.')
        : true;
      if (confirmed) void doDelete();
      return;
    }

    Alert.alert(
      'Delete Series',
      'Are you sure you want to delete this series? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void doDelete() },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
      </Pressable>
      
      <View style={styles.headerActions}>
        <Pressable style={styles.headerButton} onPress={handleEditSeries}>
          <Ionicons name="pencil" size={20} color={theme.colors.textPrimary} />
        </Pressable>
        <Pressable style={styles.headerButton} onPress={handleDeleteSeries}>
          <Ionicons name="trash" size={20} color={theme.colors.error} />
        </Pressable>
      </View>
    </View>
  );

  const renderSeriesInfo = () => (
    <View style={[styles.seriesCard, { borderLeftColor: theme.colors.primary }] }>
      <View style={styles.seriesHeader}>
        <View style={styles.seriesTitleSection}>
          <Text style={styles.seriesTitle}>{series.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
            <Ionicons 
              name={statusInfo.icon} 
              size={14} 
              color={statusInfo.color} 
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>
      </View>

      {series.description && (
        <Text style={styles.seriesDescription}>{series.description}</Text>
      )}

      <View style={styles.seriesMetadata}>
        {series.startDate && (
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={16} color={theme.colors.gray500} />
            <Text style={styles.metaText}>
              {formatDate(series.startDate)}
              {series.endDate && ` - ${formatDate(series.endDate)}`}
            </Text>
          </View>
        )}

        {Array.isArray(series.tags) && series.tags.length > 0 && (
          <View style={styles.metaItem}>
            <Ionicons name="pricetags" size={16} color={theme.colors.gray500} />
            <Text style={styles.metaText}>{series.tags.join(', ')}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{sermonCount}</Text>
        <Text style={styles.statLabel}>Sermons</Text>
      </View>
      <View style={styles.statItem} />
      <View style={styles.statItem} />
    </View>
  );

  const handleSermonPress = (sermon: any) => {
    router.push(`/sermon/${sermon.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return theme.colors.gray500;
      case 'preparing': return theme.colors.warning;
      case 'ready': return theme.colors.success;
      case 'delivered': return theme.colors.primary;
      case 'archived': return theme.colors.gray400;
      default: return theme.colors.gray500;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return 'document-outline';
      case 'preparing': return 'construct-outline';
      case 'ready': return 'checkmark-circle-outline';
      case 'delivered': return 'megaphone-outline';
      case 'archived': return 'archive-outline';
      default: return 'document-outline';
    }
  };

  const formatSermonDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const renderSermonItem = (sermon: any, index: number) => {
    const isLastItem = index === (series?.sermons?.length || 0) - 1;
    return (
      <Pressable 
        key={sermon.id} 
        style={[styles.sermonItem, isLastItem && styles.sermonItemLast]}
        onPress={() => handleSermonPress(sermon)}
      >
      <View style={styles.sermonOrder}>
        <Text style={styles.sermonOrderText}>{index + 1}</Text>
      </View>
      <View style={styles.sermonContent}>
        <View style={styles.sermonHeader}>
          <Text style={styles.sermonTitle} numberOfLines={2}>
            {sermon.title || 'Untitled Sermon'}
          </Text>
          <View style={[styles.sermonStatusBadge, { backgroundColor: getStatusColor(sermon.status) + '15' }]}>
            <Ionicons 
              name={getStatusIcon(sermon.status) as any} 
              size={12} 
              color={getStatusColor(sermon.status)} 
            />
            <Text style={[styles.sermonStatusText, { color: getStatusColor(sermon.status) }]}>
              {sermon.status || 'draft'}
            </Text>
          </View>
        </View>
        <View style={styles.sermonMeta}>
          {sermon.date && (
            <View style={styles.sermonMetaItem}>
              <Ionicons name="calendar-outline" size={12} color={theme.colors.textSecondary} />
              <Text style={styles.sermonMetaText}>
                {formatSermonDate(sermon.date)}
              </Text>
            </View>
          )}
          {sermon.scripture && (
            <View style={styles.sermonMetaItem}>
              <Ionicons name="book-outline" size={12} color={theme.colors.textSecondary} />
              <Text style={styles.sermonMetaText} numberOfLines={1}>
                {sermon.scripture}
              </Text>
            </View>
          )}
          {!sermon.date && !sermon.scripture && sermon.created_at && (
            <View style={styles.sermonMetaItem}>
              <Ionicons name="time-outline" size={12} color={theme.colors.textSecondary} />
              <Text style={styles.sermonMetaText}>
                Created {formatSermonDate(sermon.created_at)}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.sermonActions}>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
      </View>
    </Pressable>
    );
  };

  const renderSermonsSection = () => (
    <View style={styles.sermonsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Sermons ({sermonCount})
        </Text>
        <Pressable 
          style={styles.addButton} 
          onPress={handleAddSermon}
        >
          <Ionicons name="add" size={20} color={theme.colors.primary} />
          <Text style={styles.addButtonText}>Add Sermon</Text>
        </Pressable>
      </View>

      {sermonCount === 0 ? (
        <View style={styles.emptySermons}>
          <Ionicons name="document-outline" size={48} color={theme.colors.gray400} />
          <Text style={styles.emptyTitle}>No Sermons Yet</Text>
          <Text style={styles.emptyText}>
            Start building your series by adding your first sermon
          </Text>
          <Pressable style={styles.emptyButton} onPress={handleAddSermon}>
            <Text style={styles.emptyButtonText}>Add First Sermon</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.sermonsList}>
          {(series?.sermons || []).map((sermon: any, index: number) => 
            renderSermonItem(sermon, index)
          )}
        </View>
      )}
    </View>
  );

  return (
    <FadeInView style={styles.container}>
      <Stack.Screen options={{ 
        title: series?.title || 'Series Detail', 
        headerShown: false 
      }} />
      <SafeAreaView style={styles.container}>
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
        >
          {renderHeader()}
          {renderSeriesInfo()}
          {renderStats()}
          {renderSermonsSection()}
        </ScrollView>
      </SafeAreaView>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  headerButton: {
    padding: theme.spacing.xs,
  },
  seriesCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  seriesHeader: {
    marginBottom: theme.spacing.md,
  },
  seriesTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  seriesTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  statusText: {
    ...theme.typography.caption,
    fontWeight: '600',
  },
  seriesDescription: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  seriesMetadata: {
    gap: theme.spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  metaText: {
    ...theme.typography.body2,
    color: theme.colors.textTertiary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    ...theme.typography.h4,
    color: theme.colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  sermonsSection: {
    marginBottom: theme.spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  addButtonText: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  sermonsList: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  sermonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  sermonItemLast: {
    borderBottomWidth: 0,
  },
  sermonOrder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  sermonOrderText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: '700',
  },
  sermonContent: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  sermonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  sermonTitle: {
    ...theme.typography.body1,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  sermonStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  sermonStatusText: {
    ...theme.typography.caption,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sermonMeta: {
    flexDirection: 'column',
    gap: theme.spacing.xs / 2,
  },
  sermonMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  sermonMetaText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  sermonActions: {
    paddingLeft: theme.spacing.sm,
  },
  emptySermons: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  emptyButtonText: {
    ...theme.typography.body1,
    color: theme.colors.white,
    fontWeight: '600',
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  notFoundTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  notFoundText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
});
