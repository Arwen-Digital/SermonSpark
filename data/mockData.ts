import { Sermon, SermonSeries } from '@/types';

// Mock sermon series data
export const mockSermonSeries: SermonSeries[] = [
  {
    id: 'series-1',
    title: 'I Am Statements of Jesus',
    description: 'Exploring the seven profound "I Am" statements Jesus made about Himself in the Gospel of John.',
    theme: 'Identity of Christ',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-02-28'),
    imageUrl: undefined,
    color: '#3B82F6',
    sermonCount: 7,
    isActive: false,
    isCompleted: true,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-02-28'),
  },
  {
    id: 'series-2',
    title: 'Spiritual Disciplines',
    description: 'Building a foundation of spiritual practices that draw us closer to God.',
    theme: 'Christian Growth',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-04-30'),
    imageUrl: undefined,
    color: '#10B981',
    sermonCount: 8,
    isActive: true,
    isCompleted: false,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-15'),
  },
  {
    id: 'series-3',
    title: 'Psalms of Praise',
    description: 'Discovering worship and praise through the beautiful poetry of the Psalms.',
    theme: 'Worship',
    startDate: new Date('2024-05-01'),
    endDate: undefined,
    imageUrl: undefined,
    color: '#8B5CF6',
    sermonCount: 0,
    isActive: false,
    isCompleted: false,
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01'),
  },
  {
    id: 'series-4',
    title: 'Parables of Jesus',
    description: 'Understanding the Kingdom of Heaven through Jesus\' teaching stories.',
    theme: 'Kingdom Teaching',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-08-31'),
    imageUrl: undefined,
    color: '#F59E0B',
    sermonCount: 12,
    isActive: false,
    isCompleted: false,
    createdAt: new Date('2024-05-01'),
    updatedAt: new Date('2024-05-01'),
  },
];

// Updated mock sermons with series information
export const mockSermons: Sermon[] = [
  {
    id: '1',
    title: 'I Am the Good Shepherd',
    content: 'Jesus said, "I am the good shepherd. The good shepherd lays down his life for the sheep." In this passage from John 10:11, we see a beautiful picture of Christ\'s sacrificial love...',
    outline: '1. The Shepherd\'s Heart\n2. The Shepherd\'s Sacrifice\n3. The Shepherd\'s Call',
    scripture: 'John 10:11-16',
    scriptureReferences: ['John 10:11-16', 'Psalm 23:1-6', '1 Peter 5:2-4'],
    tags: ['Jesus', 'Love', 'Sacrifice', 'Shepherd'],
    seriesId: 'series-1',
    orderInSeries: 4,
    date: new Date('2024-01-28'),
    preachedDate: new Date('2024-01-28'),
    lastModified: new Date('2024-01-30'),
    wordCount: 2800,
    readingTime: 18,
    isArchived: false,
    isFavorite: true,
    notes: 'Focus on the personal nature of Christ\'s care for each believer.',
  },
  {
    id: '2',
    title: 'I Am the Bread of Life',
    content: 'When Jesus declared "I am the bread of life," He was making a profound statement about spiritual nourishment and our deepest need for Him...',
    outline: '1. Physical vs Spiritual Hunger\n2. The Bread that Satisfies\n3. Daily Dependence on Christ',
    scripture: 'John 6:35-51',
    scriptureReferences: ['John 6:35-51', 'Matthew 4:4', 'Deuteronomy 8:3'],
    tags: ['Jesus', 'Sustenance', 'Life', 'Bread'],
    seriesId: 'series-1',
    orderInSeries: 1,
    date: new Date('2024-01-07'),
    preachedDate: new Date('2024-01-07'),
    lastModified: new Date('2024-01-08'),
    wordCount: 3100,
    readingTime: 20,
    isArchived: false,
    isFavorite: true,
    notes: 'Include communion elements in the message.',
  },
  {
    id: '3',
    title: 'The Power of Prayer',
    content: 'Prayer is not just talking to God; it\'s entering into relationship with Him. In Matthew 6, Jesus teaches us how to pray with the Lord\'s Prayer as our model...',
    outline: '1. Prayer as Relationship\n2. The Lord\'s Prayer Model\n3. Persistent Prayer',
    scripture: 'Matthew 6:9-13',
    scriptureReferences: ['Matthew 6:9-13', 'Luke 11:1-13', '1 Thessalonians 5:17'],
    tags: ['Prayer', 'Relationship', 'Communication', 'God'],
    seriesId: 'series-2',
    orderInSeries: 1,
    date: new Date('2024-03-03'),
    preachedDate: new Date('2024-03-03'),
    lastModified: new Date('2024-03-05'),
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
    scriptureReferences: ['Luke 10:25-37', 'Matthew 22:37-40', '1 John 4:19-21'],
    tags: ['Love', 'Neighbor', 'Service', 'Community'],
    seriesId: undefined, // Standalone sermon
    orderInSeries: undefined,
    date: new Date('2024-02-25'),
    preachedDate: new Date('2024-02-25'),
    lastModified: new Date('2024-02-26'),
    wordCount: 3100,
    readingTime: 20,
    isArchived: false,
    isFavorite: false,
    notes: 'Challenge congregation with practical service opportunities.',
  },
  {
    id: '5',
    title: 'Scripture and Meditation',
    content: 'God\'s Word is living and active, but how do we move beyond just reading to truly meditating on Scripture? This discipline transforms our minds and hearts...',
    outline: '1. More Than Reading\n2. The Art of Meditation\n3. Applying God\'s Word',
    scripture: 'Psalm 1:1-3',
    scriptureReferences: ['Psalm 1:1-3', 'Joshua 1:8', 'Hebrews 4:12'],
    tags: ['Scripture', 'Meditation', 'Word', 'Discipline'],
    seriesId: 'series-2',
    orderInSeries: 2,
    date: new Date('2024-03-10'),
    preachedDate: new Date('2024-03-10'),
    lastModified: new Date('2024-03-12'),
    wordCount: 2750,
    readingTime: 17,
    isArchived: false,
    isFavorite: false,
    notes: 'Provide practical meditation techniques.',
  },
  {
    id: '6',
    title: 'Hope in Times of Trouble',
    content: 'When life gets difficult, where do we turn for hope? The Psalms show us that even in our darkest moments, we can find refuge in God\'s unchanging character...',
    outline: '1. Acknowledging Our Troubles\n2. Finding Hope in God\'s Character\n3. Holding onto His Promises',
    scripture: 'Psalm 46:1-11',
    scriptureReferences: ['Psalm 46:1-11', 'Romans 8:28', 'Jeremiah 29:11'],
    tags: ['Hope', 'Trouble', 'Refuge', 'Psalms'],
    seriesId: undefined, // Standalone sermon
    orderInSeries: undefined,
    date: new Date('2023-12-18'),
    preachedDate: new Date('2023-12-18'),
    lastModified: new Date('2023-12-20'),
    wordCount: 2400,
    readingTime: 15,
    isArchived: true,
    isFavorite: false,
    notes: 'Share personal testimony about finding hope in difficult times.',
  },
];

// Helper functions for working with series and sermons
export const getSermonsBySeries = (seriesId: string): Sermon[] => {
  return mockSermons
    .filter(sermon => sermon.seriesId === seriesId)
    .sort((a, b) => (a.orderInSeries || 0) - (b.orderInSeries || 0));
};

export const getStandaloneSermons = (): Sermon[] => {
  return mockSermons.filter(sermon => !sermon.seriesId);
};

export const getSeriesById = (seriesId: string): SermonSeries | undefined => {
  return mockSermonSeries.find(series => series.id === seriesId);
};

export const updateSeriesSermonCount = (): SermonSeries[] => {
  return mockSermonSeries.map(series => ({
    ...series,
    sermonCount: mockSermons.filter(sermon => sermon.seriesId === series.id).length,
  }));
};