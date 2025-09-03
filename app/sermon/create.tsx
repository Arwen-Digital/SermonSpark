import React from 'react';
import { SafeAreaView, StyleSheet, Alert } from 'react-native';
import { SermonEditor } from '@/components/sermon-editor/SermonEditor';
import { theme } from '@/constants/Theme';
import { router } from 'expo-router';
import { Sermon } from '@/types';
import sermonService from '@/services/supabaseSermonService';
import { useLocalSearchParams } from 'expo-router';

export default function CreateSermonPage() {
  const params = useLocalSearchParams<{ seriesId?: string }>();

  const handleSave = async (sermonData: Partial<Sermon>) => {
    try {
      // Prefer selection from editor, fallback to route param
      const selectedSeries = sermonData.seriesId ?? (params.seriesId as string | undefined);
      
      await sermonService.create({
        title: sermonData.title || 'Untitled Sermon',
        content: sermonData.content,
        outline: sermonData.outline,
        scripture: sermonData.scripture,
        tags: sermonData.tags,
        notes: sermonData.notes,
        date: sermonData.date ? new Date(sermonData.date).toISOString() : undefined,
        seriesId: selectedSeries && selectedSeries.trim() ? selectedSeries : null,
        status: 'draft',
        visibility: 'private',
      });
      if (router.canGoBack()) router.back();
      else router.push('/');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create sermon');
    }
  };

  const handleCancel = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      router.push('/');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <SermonEditor
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
