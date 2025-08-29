import React, { useState } from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { FileManager } from '@/components/file-management/FileManager';
import { theme } from '@/constants/Theme';
import { Sermon } from '@/types';

// Mock data for demonstration - 5 sermons total
const mockSermons: Sermon[] = [
  {
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
  },
  {
    id: '2',
    title: 'Walking in Faith',
    content: 'Faith is not the absence of doubt, but the presence of trust. When we look at the heroes of faith in Hebrews 11, we see ordinary people who did extraordinary things...',
    outline: '1. What is Faith?\n2. Examples of Faith\n3. Living by Faith Today',
    scripture: 'Hebrews 11:1-6',
    tags: ['Faith', 'Trust', 'Heroes', 'Courage'],
    date: new Date('2024-01-08'),
    lastModified: new Date('2024-01-08'),
    wordCount: 3200,
    readingTime: 22,
    isArchived: false,
    isFavorite: false,
    notes: 'Include testimonies from congregation members.',
  },
  {
    id: '3',
    title: 'The Power of Prayer',
    content: 'Prayer is not just talking to God; it\'s entering into relationship with Him. In Matthew 6, Jesus teaches us how to pray with the Lord\'s Prayer as our model...',
    outline: '1. Prayer as Relationship\n2. The Lord\'s Prayer Model\n3. Persistent Prayer',
    scripture: 'Matthew 6:9-13',
    tags: ['Prayer', 'Relationship', 'Communication', 'God'],
    series: 'Spiritual Disciplines',
    date: new Date('2024-01-01'),
    lastModified: new Date('2024-01-05'),
    wordCount: 2600,
    readingTime: 16,
    isArchived: false,
    isFavorite: true,
    notes: 'End with a corporate prayer time.',
  },
  {
    id: '4',
    title: 'Loving Your Neighbor',
    content: 'When Jesus was asked about the greatest commandment, He gave two: love God and love your neighbor. But who is your neighbor, and what does it mean to love them?...',
    outline: '1. The Two Great Commandments\n2. Who is My Neighbor?\n3. Practical Love in Action',
    scripture: 'Luke 10:25-37',
    tags: ['Love', 'Neighbor', 'Service', 'Community'],
    date: new Date('2023-12-25'),
    lastModified: new Date('2023-12-30'),
    wordCount: 3100,
    readingTime: 20,
    isArchived: false,
    isFavorite: false,
    notes: 'Challenge congregation with practical service opportunities.',
  },
  {
    id: '5',
    title: 'Hope in Times of Trouble',
    content: 'When life gets difficult, where do we turn for hope? The Psalms show us that even in our darkest moments, we can find refuge in God\'s unchanging character...',
    outline: '1. Acknowledging Our Troubles\n2. Finding Hope in God\'s Character\n3. Holding onto His Promises',
    scripture: 'Psalm 46:1-11',
    tags: ['Hope', 'Trouble', 'Refuge', 'Psalms'],
    date: new Date('2023-12-18'),
    lastModified: new Date('2023-12-20'),
    wordCount: 2400,
    readingTime: 15,
    isArchived: true,
    isFavorite: false,
    notes: 'Share personal testimony about finding hope in difficult times.',
  },
];

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

  return (
    <SafeAreaView style={styles.container}>
      <FileManager
        sermons={sermons}
        onSermonPress={handleSermonPress}
        onCreateNew={handleCreateNew}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onPulpit={handlePulpit}
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
