import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SeriesListScreen } from '@/components/series/SeriesListScreen';

export default function SeriesScreen() {
  const handleSeriesPress = (seriesId: string) => {
    router.push(`/series/${seriesId}`);
  };

  const handleCreateSeries = () => {
    router.push('/series/create');
  };


  return (
    <>
      <Stack.Screen options={{ title: 'Sermon Series', headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <SeriesListScreen
          onCreateSeries={handleCreateSeries}
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
