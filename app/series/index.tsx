import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  SafeAreaView, 
  ScrollView, 
  Text, 
  FlatList,
  Pressable 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { SeriesCard } from '@/components/series/SeriesCard';
import { FadeInView } from '@/components/common/FadeInView';
import { theme } from '@/constants/Theme';
import { SermonSeries } from '@/types';
import { mockSermonSeries, updateSeriesSermonCount } from '@/data/mockData';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All Series', icon: 'library' },
  { key: 'active', label: 'Active', icon: 'play-circle' },
  { key: 'completed', label: 'Completed', icon: 'checkmark-circle' },
  { key: 'planned', label: 'Planned', icon: 'time' },
];

export default function SeriesScreen() {
  const [series, setSeries] = useState<SermonSeries[]>(updateSeriesSermonCount());
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredSeries = series.filter(s => {
    switch (selectedFilter) {
      case 'active':
        return s.isActive;
      case 'completed':
        return s.isCompleted;
      case 'planned':
        return !s.isActive && !s.isCompleted;
      default:
        return true;
    }
  });

  const handleSeriesPress = (series: SermonSeries) => {
    router.push(`/series/${series.id}`);
  };

  const handleCreateSeries = () => {
    router.push('/series/create');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Back button row */}
      <View style={styles.backButtonRow}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
      </View>
      
      {/* Title and add button row */}
      <View style={styles.titleRow}>
        <View style={styles.titleSection}>
          <Text style={styles.headerTitle}>Sermon Series</Text>
          <Text style={styles.headerSubtitle}>
            Organize your sermons into meaningful series
          </Text>
        </View>
        
        <Pressable 
          style={styles.createButton} 
          onPress={handleCreateSeries}
        >
          <Ionicons name="add" size={24} color={theme.colors.white} />
        </Pressable>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTER_OPTIONS.map((filter) => (
          <Pressable
            key={filter.key}
            style={[
              styles.filterChip,
              selectedFilter === filter.key && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Ionicons
              name={filter.icon as any}
              size={16}
              color={
                selectedFilter === filter.key
                  ? theme.colors.white
                  : theme.colors.gray600
              }
            />
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.key && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
          <Ionicons name="library" size={20} color={theme.colors.primary} />
        </View>
        <Text style={styles.statNumber}>{series.length}</Text>
        <Text style={styles.statLabel}>Total Series</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={[styles.statIconContainer, { backgroundColor: theme.colors.success + '15' }]}>
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
        </View>
        <Text style={styles.statNumber}>
          {series.filter(s => s.isCompleted).length}
        </Text>
        <Text style={styles.statLabel}>Completed</Text>
      </View>
      
      <View style={styles.statCard}>
        <View style={[styles.statIconContainer, { backgroundColor: theme.colors.warning + '15' }]}>
          <Ionicons name="play-circle" size={20} color={theme.colors.warning} />
        </View>
        <Text style={styles.statNumber}>
          {series.filter(s => s.isActive).length}
        </Text>
        <Text style={styles.statLabel}>Active</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name="library-outline" 
        size={64} 
        color={theme.colors.gray400} 
      />
      <Text style={styles.emptyTitle}>No Series Found</Text>
      <Text style={styles.emptyText}>
        {selectedFilter === 'all' 
          ? 'Create your first sermon series to get started' 
          : `No ${selectedFilter} series found`}
      </Text>
      {selectedFilter === 'all' && (
        <Pressable 
          style={styles.emptyButton} 
          onPress={handleCreateSeries}
        >
          <Text style={styles.emptyButtonText}>Create Series</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <FadeInView style={styles.container}>
      <Stack.Screen options={{ title: 'Sermon Series', headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
        >
          {renderHeader()}
          {renderStatsCards()}
          {renderFilters()}
          
          <View style={styles.seriesSection}>
            <Text style={styles.sectionTitle}>
              {selectedFilter === 'all' ? 'All Series' : 
               FILTER_OPTIONS.find(f => f.key === selectedFilter)?.label}
              {' '}({filteredSeries.length})
            </Text>
            
            {filteredSeries.length > 0 ? (
              <FlatList
                data={filteredSeries}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <SeriesCard 
                    series={item} 
                    onPress={handleSeriesPress} 
                  />
                )}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              renderEmptyState()
            )}
          </View>
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
    marginBottom: theme.spacing.lg,
  },
  backButtonRow: {
    marginBottom: theme.spacing.sm,
  },
  backButton: {
    padding: theme.spacing.xs,
    alignSelf: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.25)',
    elevation: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statNumber: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  filtersContainer: {
    marginBottom: theme.spacing.lg,
  },
  filtersContent: {
    gap: theme.spacing.sm,
    paddingHorizontal: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: theme.colors.white,
  },
  seriesSection: {
    marginBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  emptyState: {
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
});