import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Platform, useWindowDimensions } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { FadeInView } from '@/components/common/FadeInView';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { theme } from '@/constants/Theme';
import { seriesRepository } from '@/services/repositories';
import type { SeriesDTO } from '@/services/repositories/types';
import { SeriesFormScreen } from '@/components/series/SeriesFormScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EditSeriesScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLargeScreen = Math.min(width, height) >= 768;
  const { id } = useLocalSearchParams<{ id: string }>();
  const [series, setSeries] = useState<SeriesDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!id) throw new Error('Missing series id');
        const s = await seriesRepository.get(id);
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

  const handleCancel = () => {
    if (Platform.OS === 'web') {
      router.push('/series');
      return;
    }
    if (router.canGoBack()) router.back();
    else router.push('/series');
  };

  const handleSaved = () => {
    if (router.canGoBack()) router.back();
    else router.push('/series');
  };

  if (loading) {
    return (
      <FadeInView style={styles.container}>
        <Stack.Screen options={{ title: 'Loading series', headerShown: false }} />
        <SafeAreaView
          style={[
            styles.loadingContainer,
            { paddingTop: Math.max(insets.top || 0, isLargeScreen ? 24 : 10) },
          ]}
        > 
          <LoadingIndicator size="large" />
        </SafeAreaView>
      </FadeInView>
    );
  }

  if (error || !series) {
    return (
      <FadeInView style={styles.container}>
        <Stack.Screen options={{ title: 'Series not found', headerShown: false }} />
        <SafeAreaView
          style={[
            styles.center,
            { paddingTop: Math.max(insets.top || 0, isLargeScreen ? 24 : 10) },
          ]}
        > 
          <Ionicons name="alert-circle" size={36} color={theme.colors.error} />
          <Text style={styles.errorText}>{error || 'Series not found'}</Text>
        </SafeAreaView>
      </FadeInView>
    );
  }

  return (
    <FadeInView style={styles.container}>
      <Stack.Screen options={{ title: 'Edit Series', headerShown: false }} />
      <SafeAreaView style={styles.container}>
        <SeriesFormScreen series={series} onSave={handleSaved} onCancel={handleCancel} />
      </SafeAreaView>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    marginTop: 8,
    color: theme.colors.error,
  },
});
