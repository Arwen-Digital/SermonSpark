import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { FileManager } from '@/components/file-management/FileManager';
import { FadeInView } from '@/components/common/FadeInView';
import { theme } from '@/constants/Theme';
import { Sermon } from '@/types';
import { sermonRepository } from '@/services/repositories';
import { syncAll } from '@/services/sync/syncService';
 

export default function SermonsScreen() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadSermons = useCallback(async () => {
    setLoading(true);
    try {
      const list = await sermonRepository.list();
      const mapped: Sermon[] = list.map((s) => ({
        id: s.id,
        title: s.title || 'Untitled Sermon',
        content: s.content || '',
        outline: typeof s.outline === 'string' ? s.outline : JSON.stringify(s.outline ?? ''),
        scripture: s.scripture || '',
        tags: s.tags || [],
        seriesId: s.seriesId || '',
        orderInSeries: undefined,
        date: s.date ? new Date(s.date) : new Date(),
        preachedDate: undefined,
        lastModified: new Date(),
        wordCount: (s.content || '').trim().split(/\s+/).filter(Boolean).length,
        readingTime: Math.ceil(((s.content || '').trim().split(/\s+/).filter(Boolean).length || 0) / 150),
        isArchived: s.status === 'archived',
        isFavorite: false,
        notes: s.notes || '',
        // Extra fields ignored by FileManager
      }));
      setSermons(mapped);
    } catch (e) {
      console.warn('Failed to load sermons', e);
      setSermons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load sermons when component mounts
  useEffect(() => {
    loadSermons();
  }, [loadSermons]);

  // Refresh sermons when screen comes into focus (e.g., after creating a new sermon)
  useFocusEffect(
    useCallback(() => {
      loadSermons();
    }, [loadSermons])
  );

  const handleSermonPress = (sermon: Sermon) => {
    console.log('Opening sermon:', sermon.title);
    router.push(`/sermon/${sermon.id}`);
  };

  const handleCreateNew = () => {
    console.log('Creating new sermon');
    router.push('/sermon/create');
  };

  const handleSearch = (query: string) => {
    console.log('Searching for:', query);
    // Implement search logic
  };

  const handleFilter = (filter: any) => {
    console.log('Applying filter:', filter);
    // Implement filter logic
  };

  const handlePulpit = (sermon: Sermon) => {
    console.log('Opening pulpit mode for:', sermon.title);
    router.push(`/pulpit/${sermon.id}`);
  };

  const handleSeriesPress = () => {
    console.log('Opening series management');
    router.push('/series');
  };

  const handleSyncNow = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await syncAll();
      await loadSermons();
      console.log('Sync complete');
    } catch (e: any) {
      console.warn('Sync failed', e);
      if (typeof e?.message === 'string') {
        Alert.alert('Sync failed', e.message);
      } else {
        Alert.alert('Sync failed', 'Please check your connection and try again.');
      }
    } finally {
      setSyncing(false);
    }
  }, [syncing, loadSermons]);

  return (
    <FadeInView style={styles.container}>
      <FileManager
        sermons={sermons}
        onSermonPress={handleSermonPress}
        onCreateNew={handleCreateNew}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onPulpit={handlePulpit}
        onSeriesPress={handleSeriesPress}
        loading={loading}
        onSyncNow={handleSyncNow}
        syncing={syncing}
      />
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
