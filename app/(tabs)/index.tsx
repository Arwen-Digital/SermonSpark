import React, { useState } from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { FileManager } from '@/components/file-management/FileManager';
import { FadeInView } from '@/components/common/FadeInView';
import { theme } from '@/constants/Theme';
import { Sermon } from '@/types';
import { mockSermons } from '@/data/mockData';

export default function SermonsScreen() {
  const [sermons] = useState<Sermon[]>(mockSermons);

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

  return (
    <FadeInView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <FileManager
          sermons={sermons}
          onSermonPress={handleSermonPress}
          onCreateNew={handleCreateNew}
          onSearch={handleSearch}
          onFilter={handleFilter}
          onPulpit={handlePulpit}
          onSeriesPress={handleSeriesPress}
        />
      </SafeAreaView>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
