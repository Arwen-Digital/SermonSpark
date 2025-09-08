import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { theme } from '../../constants/Theme';
import { Sermon } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { SermonCard } from './SermonCard';

interface FileManagerProps {
  sermons: Sermon[];
  onSermonPress: (sermon: Sermon) => void;
  onCreateNew: () => void;
  onSearch: (query: string) => void;
  onFilter: (filter: FileFilter) => void;
  onPulpit?: (sermon: Sermon) => void;
  onSeriesPress?: () => void;
  loading?: boolean;
  onSyncNow?: () => void | Promise<void>;
  syncing?: boolean;
}

export interface FileFilter {
  category: 'all' | 'recent' | 'favorites' | 'series' | 'archived';
  sortBy: 'date' | 'title' | 'modified';
  sortOrder: 'asc' | 'desc';
  tags: string[];
}

const FILTER_OPTIONS = [
  { key: 'all', label: 'All Sermons', icon: 'documents' },
  { key: 'recent', label: 'Recent', icon: 'time' },
  { key: 'favorites', label: 'Favorites', icon: 'heart' },
  { key: 'series', label: 'Series', icon: 'folder' },
  { key: 'archived', label: 'Archived', icon: 'archive' },
] as const;

const SORT_OPTIONS = [
  { key: 'date', label: 'Date Created' },
  { key: 'modified', label: 'Last Modified' },
  { key: 'title', label: 'Title' },
] as const;

export const FileManager: React.FC<FileManagerProps> = ({
  sermons,
  onSermonPress,
  onCreateNew,
  onSearch,
  onFilter,
  onPulpit,
  onSeriesPress,
  loading = false,
  onSyncNow,
  syncing = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showSearchField, setShowSearchField] = useState(false);
  const [filter, setFilter] = useState<FileFilter>({
    category: 'all',
    sortBy: 'modified',
    sortOrder: 'desc',
    tags: [],
  });

  const filteredSermons = useMemo(() => {
    let filtered = [...sermons];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (sermon) =>
          sermon.title.toLowerCase().includes(query) ||
          sermon.content.toLowerCase().includes(query) ||
          sermon.tags.some(tag => tag.toLowerCase().includes(query)) ||
          sermon.scripture?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    switch (filter.category) {
      case 'recent':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(sermon => sermon.date >= oneWeekAgo);
        break;
      case 'favorites':
        filtered = filtered.filter(sermon => sermon.isFavorite);
        break;
      case 'series':
        filtered = filtered.filter(sermon => sermon.series);
        break;
      case 'archived':
        filtered = filtered.filter(sermon => sermon.isArchived);
        break;
      default:
        filtered = filtered.filter(sermon => !sermon.isArchived);
    }

    // Apply tag filter
    if (filter.tags.length > 0) {
      filtered = filtered.filter(sermon =>
        filter.tags.some(tag => sermon.tags.includes(tag))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filter.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'modified':
          comparison = a.lastModified.getTime() - b.lastModified.getTime();
          break;
      }

      return filter.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [sermons, searchQuery, filter]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const handleFilterChange = (newFilter: Partial<FileFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    onFilter(updatedFilter);
  };

  const handleFavorite = (sermon: Sermon) => {
    // This would typically call a parent handler or API
    console.log('Toggle favorite for:', sermon.title);
  };

  const handleOptions = (sermon: Sermon) => {
    // This would typically show a menu with options like edit, delete, share
    console.log('Show options for:', sermon.title);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* <View style={styles.titleSection}>
        
        <Text style={styles.welcomeText}>Good morning, Arnold</Text>
        <Text style={styles.greeting}>Welcome to YouPreacher</Text>
      </View>
      
      <Pressable style={styles.profileButton}>
        <View style={styles.profileAvatar}>
          <Ionicons name="person" size={20} color={theme.colors.gray600} />
        </View>
      </Pressable> */}
    </View>
  );

  const renderSearchBar = () => {
    if (!showSearchField) return null;
    
    return (
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={theme.colors.gray500} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sermons, topics, scripture..."
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoFocus={true}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.gray500} />
            </Pressable>
          )}
        </View>
        <Pressable
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons 
            name="filter" 
            size={20} 
            color={showFilters ? theme.colors.accent : theme.colors.gray600} 
          />
        </Pressable>
      </View>
    );
  };

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <Card style={styles.filtersCard}>
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Category</Text>
          <View style={styles.filterOptions}>
            {FILTER_OPTIONS.map((option) => (
              <Pressable
                key={option.key}
                style={[
                  styles.filterChip,
                  filter.category === option.key && styles.filterChipActive,
                ]}
                onPress={() => handleFilterChange({ category: option.key as any })}
              >
                <Ionicons
                  name={option.icon as any}
                  size={16}
                  color={
                    filter.category === option.key
                      ? theme.colors.white
                      : theme.colors.gray600
                  }
                />
                <Text
                  style={[
                    styles.filterChipText,
                    filter.category === option.key && styles.filterChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Sort By</Text>
          <View style={styles.sortContainer}>
            <View style={styles.filterOptions}>
              {SORT_OPTIONS.map((option) => (
                <Pressable
                  key={option.key}
                  style={[
                    styles.filterChip,
                    filter.sortBy === option.key && styles.filterChipActive,
                  ]}
                  onPress={() => handleFilterChange({ sortBy: option.key as any })}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filter.sortBy === option.key && styles.filterChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={styles.sortOrderButton}
              onPress={() =>
                handleFilterChange({
                  sortOrder: filter.sortOrder === 'asc' ? 'desc' : 'asc',
                })
              }
            >
              <Ionicons
                name={filter.sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                size={16}
                color={theme.colors.gray600}
              />
            </Pressable>
          </View>
        </View>
      </Card>
    );
  };

  const renderViewToggle = () => (
    <View style={styles.viewToggle}>
      <Pressable
        style={[
          styles.viewButton,
          viewMode === 'grid' && styles.viewButtonActive,
        ]}
        onPress={() => setViewMode('grid')}
      >
        <Ionicons
          name="grid"
          size={20}
          color={viewMode === 'grid' ? theme.colors.gray700 : theme.colors.gray600}
        />
      </Pressable>
      <Pressable
        style={[
          styles.viewButton,
          viewMode === 'list' && styles.viewButtonActive,
        ]}
        onPress={() => setViewMode('list')}
      >
        <Ionicons
          name="list"
          size={20}
          color={viewMode === 'list' ? theme.colors.gray700 : theme.colors.gray600}
        />
      </Pressable>
    </View>
  );

  const renderSermons = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading sermons...</Text>
        </View>
      );
    }

    if (filteredSermons.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={theme.colors.gray400} />
          <Text style={styles.emptyTitle}>
            {searchQuery.trim() ? 'No sermons found' : 'No sermons yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery.trim()
              ? 'Try adjusting your search or filters'
              : 'Create your first sermon to get started'}
          </Text>
          {!searchQuery.trim() && (
            <Button
              title="Create First Sermon"
              onPress={onCreateNew}
              variant="primary"
              style={{ marginTop: theme.spacing.md }}
            />
          )}
        </View>
      );
    }

    return (
      <FlatList
        data={filteredSermons}
        keyExtractor={(item) => item.id}
        numColumns={1}
        style={styles.flatListStyle}
        contentContainerStyle={styles.sermonsList}
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
        renderItem={({ item }) => (
          <SermonCard
            sermon={item}
            onPress={() => onSermonPress(item)}
            onFavorite={() => handleFavorite(item)}
            onOptions={() => handleOptions(item)}
            onPulpit={onPulpit ? () => onPulpit(item) : undefined}
            variant="list"
          />
        )}
      />
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsCard}>
      <View style={styles.quickActionsGrid}>
        <Pressable onPress={onCreateNew} style={styles.quickActionItem}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="add" size={20} color={theme.colors.white} />
          </View>
          <Text style={styles.quickActionLabel}>Create a Sermon</Text>
        </Pressable>
        
        <Pressable onPress={onSeriesPress} style={styles.quickActionItem}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="library" size={20} color={theme.colors.white} />
          </View>
          <Text style={styles.quickActionLabel}>Manage Series</Text>
        </Pressable>
        
        <Pressable onPress={() => console.log('Research topic')} style={styles.quickActionItem}>
          <View style={styles.quickActionIcon}>
            <Ionicons name="search" size={20} color={theme.colors.white} />
          </View>
          <Text style={styles.quickActionLabel}>Research a Topic</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* {renderHeader()} */}
     
      <View style={styles.sermonsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.headerTitle}>My Sermons</Text>
          <View style={styles.headerActions}>
            <Pressable 
              onPress={() => {
                if (showSearchField) {
                  setSearchQuery('');
                  onSearch('');
                }
                setShowSearchField(!showSearchField);
              }}
              style={styles.searchIconButton}
            >
              <Ionicons 
                name={showSearchField ? "close" : "search"} 
                size={20} 
                color={theme.colors.textSecondary} 
              />
            </Pressable>
            {onSyncNow && (
              <Pressable
                onPress={() => onSyncNow?.()}
                style={styles.syncGhostButton}
                disabled={syncing}
                accessibilityRole="button"
                accessibilityLabel="Sync now"
              >
                {syncing ? (
                  <ActivityIndicator color={theme.colors.primary} />
                ) : (
                  <Ionicons name="sync" size={18} color={theme.colors.primary} />
                )}
              </Pressable>
            )}
          </View>
        </View>
        {renderQuickActions()}
      {renderSearchBar()}
      {renderFilters()}
        {renderSermons()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  titleSection: {
    flex: 1,
  },
  greeting: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  welcomeText: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  profileButton: {
    padding: theme.spacing.xs,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionsCard: {
    marginBottom: theme.spacing.md,
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray600,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  quickActionLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
  },
  filterButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersCard: {
    marginBottom: theme.spacing.md,
  },
  filterSection: {
    marginBottom: theme.spacing.md,
  },
  filterTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  filterChipActive: {
    backgroundColor: theme.colors.gray600,
  },
  filterChipText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: theme.colors.white,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sortOrderButton: {
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
  },
  sermonsSection: {
    flex: 1,
    minHeight: 0, // Ensures proper flex behavior
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  searchIconButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
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
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 2,
  },
  viewButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  viewButtonActive: {
    backgroundColor: theme.colors.white,
  },
  flatListStyle: {
    flex: 1,
  },
  sermonsList: {
    paddingBottom: 100, // Extra bottom padding for comfortable scrolling
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
