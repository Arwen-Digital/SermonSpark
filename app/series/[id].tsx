import React, { useState, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  SafeAreaView, 
  ScrollView, 
  Text, 
  FlatList,
  Pressable,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { FadeInView } from '@/components/common/FadeInView';
import { SermonCard } from '@/components/file-management/SermonCard';
import { theme } from '@/constants/Theme';
import { SermonSeries, Sermon } from '@/types';
import { 
  mockSermonSeries, 
  mockSermons, 
  getSermonsBySeries, 
  getSeriesById 
} from '@/data/mockData';

export default function SeriesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [series, setSeries] = useState<SermonSeries | undefined>(
    getSeriesById(id!)
  );
  const [sermons, setSermons] = useState<Sermon[]>(
    getSermonsBySeries(id!)
  );

  const seriesStats = useMemo(() => {
    const totalSermons = sermons.length;
    const totalWords = sermons.reduce((sum, sermon) => sum + sermon.wordCount, 0);
    const avgReadingTime = sermons.length > 0 
      ? Math.round(sermons.reduce((sum, sermon) => sum + sermon.readingTime, 0) / sermons.length)
      : 0;
    
    return { totalSermons, totalWords, avgReadingTime };
  }, [sermons]);

  if (!series) {
    return (
      <FadeInView style={styles.container}>
        <Stack.Screen options={{ title: 'Series Not Found', headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.notFound}>
            <Ionicons name="library-outline" size={64} color={theme.colors.gray400} />
            <Text style={styles.notFoundTitle}>Series Not Found</Text>
            <Text style={styles.notFoundText}>
              The requested series could not be found.
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
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const handleSermonPress = (sermon: Sermon) => {
    router.push(`/sermon/${sermon.id}`);
  };

  const handleAddSermon = () => {
    router.push(`/sermon/create?seriesId=${series.id}`);
  };

  const handleEditSeries = () => {
    router.push(`/series/${series.id}/edit`);
  };

  const handleDeleteSeries = () => {
    Alert.alert(
      'Delete Series',
      'Are you sure you want to delete this series? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Handle deletion logic here
            router.back();
          }
        }
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
    <View style={[styles.seriesCard, { borderLeftColor: series.color }]}>
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
        {series.theme && (
          <View style={styles.metaItem}>
            <Ionicons name="bookmark" size={16} color={theme.colors.gray500} />
            <Text style={styles.metaText}>{series.theme}</Text>
          </View>
        )}
        
        {series.startDate && (
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={16} color={theme.colors.gray500} />
            <Text style={styles.metaText}>
              Started {formatDate(series.startDate)}
              {series.endDate && ` - Ended ${formatDate(series.endDate)}`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{seriesStats.totalSermons}</Text>
        <Text style={styles.statLabel}>Sermons</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {seriesStats.totalWords.toLocaleString()}
        </Text>
        <Text style={styles.statLabel}>Total Words</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{seriesStats.avgReadingTime}m</Text>
        <Text style={styles.statLabel}>Avg Reading</Text>
      </View>
    </View>
  );

  const renderSermonsSection = () => (
    <View style={styles.sermonsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Sermons ({sermons.length})
        </Text>
        <Pressable 
          style={styles.addButton} 
          onPress={handleAddSermon}
        >
          <Ionicons name="add" size={20} color={theme.colors.primary} />
          <Text style={styles.addButtonText}>Add Sermon</Text>
        </Pressable>
      </View>

      {sermons.length > 0 ? (
        <FlatList
          data={sermons}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={styles.sermonItem}>
              <View style={styles.sermonOrder}>
                <Text style={styles.sermonOrderText}>{index + 1}</Text>
              </View>
              <View style={styles.sermonCardContainer}>
                <SermonCard
                  sermon={item}
                  onPress={() => handleSermonPress(item)}
                  onFavorite={() => console.log('Toggle favorite')}
                  onOptions={() => console.log('Show options')}
                  variant="list"
                />
              </View>
            </View>
          )}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      ) : (
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
  sermonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  sermonOrder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  sermonOrderText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: '700',
  },
  sermonCardContainer: {
    flex: 1,
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