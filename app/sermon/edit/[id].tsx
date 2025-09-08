import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Platform } from 'react-native';
import { SermonEditor } from '@/components/sermon-editor/SermonEditor';
import { theme } from '@/constants/Theme';
import { router, useLocalSearchParams } from 'expo-router';
import { Sermon } from '@/types';
import { sermonRepository } from '@/services/repositories';

export default function EditSermonPage() {
  const { id } = useLocalSearchParams();
  const [sermon, setSermon] = useState<Sermon | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id || Array.isArray(id)) throw new Error('Invalid sermon id');
        const s = await sermonRepository.get(id);
        // Map DTO -> editor Sermon shape  
        const mapped: Sermon = {
          id: s.id,
          title: s.title,
          content: s.content || '',
          outline: typeof s.outline === 'string' ? s.outline : JSON.stringify(s.outline ?? ''),
          scripture: s.scripture || '',
          tags: s.tags || [],
          seriesId: (s as any).seriesId || '',
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
        };
        setSermon(mapped);
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Failed to load sermon');
        router.push('/');
      }
    };
    load();
  }, [id]);

  const handleSave = async (sermonData: Partial<Sermon>) => {
    console.log('Edit page handleSave called with:', sermonData);
    try {
      if (!id || Array.isArray(id)) throw new Error('Invalid sermon id');
      console.log('About to update sermon with id:', id);
      
      const updateData = {
        title: sermonData.title || '',
        content: sermonData.content,
        outline: sermonData.outline,
        scripture: sermonData.scripture,
        tags: sermonData.tags,
        notes: sermonData.notes,
        date: sermonData.date ? new Date(sermonData.date).toISOString() : undefined,
        seriesId: sermonData.seriesId && sermonData.seriesId.trim() ? sermonData.seriesId : null,
      };
      
      console.log('Update data:', updateData);
      await sermonRepository.update(id as string, updateData);
      console.log('Update successful, navigating...');
      
      if (router.canGoBack()) {
        router.back();
      } else if (!id || Array.isArray(id)) {
        router.replace('/');
      } else {
        router.replace(`/sermon/${id}`);
      }
    } catch (e: any) {
      console.error('Save failed:', e);
      if (Platform.OS === 'web') {
        alert(`Error: ${e?.message || 'Failed to update sermon'}`);
      } else {
        Alert.alert('Error', e?.message || 'Failed to update sermon');
      }
    }
  };

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (!id || Array.isArray(id)) {
      router.replace('/');
    } else {
      router.replace(`/sermon/${id}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {sermon && (
        <SermonEditor
          sermon={sermon}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
