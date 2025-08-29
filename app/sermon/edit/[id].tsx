import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { SermonEditor } from '@/components/sermon-editor/SermonEditor';
import { theme } from '@/constants/Theme';
import { router, useLocalSearchParams } from 'expo-router';
import { Sermon } from '@/types';

// Mock sermon data - in a real app, this would come from local storage or API
const mockSermon: Sermon = {
  id: '1',
  title: 'The Good Shepherd',
  content: 'Jesus said, "I am the good shepherd. The good shepherd lays down his life for the sheep." In this passage from John 10:11, we see a beautiful picture of Christ\'s sacrificial love...',
  outline: '1. The Shepherd\'s Heart\n2. The Shepherd\'s Sacrifice\n3. The Shepherd\'s Call',
  scripture: 'John 10:11-16',
  tags: ['Jesus', 'Love', 'Sacrifice', 'Shepherd'],
  series: 'I Am Statements',
  date: new Date('2024-01-15'),
  lastModified: new Date('2024-01-20'),
  wordCount: 2800,
  readingTime: 18,
  isArchived: false,
  isFavorite: true,
  notes: 'Focus on the personal nature of Christ\'s care for each believer.',
};

export default function EditSermonPage() {
  const { id } = useLocalSearchParams();
  
  // In a real app, you would fetch the sermon by ID
  const sermon = mockSermon;

  const handleSave = (sermonData: Partial<Sermon>) => {
    console.log('Saving sermon:', sermonData);
    // In a real app, this would update the sermon in local storage or API
    // Then navigate back to sermons list
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <SermonEditor
        sermon={sermon}
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