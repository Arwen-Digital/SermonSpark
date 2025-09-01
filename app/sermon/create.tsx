import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { SermonEditor } from '@/components/sermon-editor/SermonEditor';
import { theme } from '@/constants/Theme';
import { router } from 'expo-router';
import { Sermon } from '@/types';

export default function CreateSermonPage() {
  const handleSave = (sermonData: Partial<Sermon>) => {
    console.log('Saving new sermon:', sermonData);
    // In a real app, this would save to local storage or API
    // Then navigate back to sermons list
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