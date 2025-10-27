import { ClerkSignInModal } from '@/components/auth/ClerkSignInModal';
import { FadeInView } from '@/components/common/FadeInView';
import { FileManager } from '@/components/file-management/FileManager';
import { theme } from '@/constants/Theme';
import { sermonRepository } from '@/services/repositories';
import { syncToConvex } from '@/services/sync/convexSyncHandler';
import { Sermon } from '@/types';
import { useAuth } from '@clerk/clerk-expo';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
 

export default function SermonsScreen() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showClerkSignIn, setShowClerkSignIn] = useState(false);
  const { isSignedIn } = useAuth();

  const loadSermons = useCallback(async () => {
    // No loading indicator for local-first - data loads instantly from SQLite
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
        series: (s as any).seriesTitle || '',
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
      setLoading(false); // Set to false after first load
    } catch (e) {
      console.warn('Failed to load sermons', e);
      setSermons([]);
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
    // Check if user is authenticated
    if (!isSignedIn) {
      setShowClerkSignIn(true);
      return;
    }

    if (syncing) return;
    setSyncing(true);
    try {
      // Use Convex sync
      const result = await syncToConvex();
      
      Alert.alert(
        'Sync Complete',
        `Pushed: ${result.seriesStats.pushed + result.sermonStats.pushed}, Pulled: ${result.seriesStats.pulled + result.sermonStats.pulled}`
      );
      
      if (result.conflicts?.length > 0) {
        Alert.alert(
          'Conflicts Detected',
          `${result.conflicts.length} conflicts require manual resolution`
        );
      }
      
      await loadSermons();
      console.log('Sync complete');
    } catch (e: any) {
      console.warn('Sync failed', e);
      Alert.alert('Sync Failed', e.message || 'Please check your connection and try again.');
    } finally {
      setSyncing(false);
    }
  }, [syncing, loadSermons, isSignedIn]);

  const handleAuthSuccess = async () => {
    // Auto-trigger sync after successful login
    await handleSyncNow();
  };

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
      
      {/* Clerk Sign-In Modal */}
      <ClerkSignInModal
        visible={showClerkSignIn}
        onClose={() => setShowClerkSignIn(false)}
        onAuthSuccess={handleAuthSuccess}
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
