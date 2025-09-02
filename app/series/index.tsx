import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SeriesListScreen } from '@/components/series/SeriesListScreen';
import { Series } from '@/services/seriesService';

export default function SeriesScreen() {
  const handleSeriesPress = (series: Series) => {
    router.push(`/series/${series.documentId}`);
  };

  const handleCreateSeries = () => {
    router.push('/series/create');
  };

  const handleEditSeries = (series: Series) => {
    router.push(`/series/${series.documentId}/edit`);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Sermon Series', headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <SeriesListScreen
          onCreateSeries={handleCreateSeries}
          onEditSeries={handleEditSeries}
          onViewSeries={handleSeriesPress}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
