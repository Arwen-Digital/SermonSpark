import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet } from 'react-native';
import { SermonEditor } from '@/components/sermon-editor/SermonEditor';
import { theme } from '@/constants/Theme';
import { router, useLocalSearchParams } from 'expo-router';
import { Sermon } from '@/types';
import sermonService from '@/services/sermonService';

export default function EditSermonPage() {
  const { id } = useLocalSearchParams();
  const [sermon, setSermon] = useState<Sermon | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id || Array.isArray(id)) throw new Error('Invalid sermon id');
        const s = await sermonService.getByDocumentId(id);
        // Map DTO -> editor Sermon shape
        const mapped: Sermon = {
          id: s.documentId,
          title: s.title,
          content: s.content || '',
          outline: typeof s.outline === 'string' ? s.outline : JSON.stringify(s.outline ?? ''),
          scripture: s.scripture || '',
          tags: s.tags || [],
          seriesId: s.series?.documentId || '',
          date: s.date ? new Date(s.date) : new Date(),
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
        router.back();
      }
    };
    load();
  }, [id]);

  const handleSave = async (sermonData: Partial<Sermon>) => {
    try {
      if (!id || Array.isArray(id)) throw new Error('Invalid sermon id');
      await sermonService.update(id as string, {
        title: sermonData.title || '',
        content: sermonData.content,
        outline: sermonData.outline,
        scripture: sermonData.scripture,
        tags: sermonData.tags,
        notes: sermonData.notes,
        date: sermonData.date ? new Date(sermonData.date).toISOString() : undefined,
        seriesDocumentId: sermonData.seriesId,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update sermon');
    }
  };

  const handleCancel = () => {
    router.back();
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
