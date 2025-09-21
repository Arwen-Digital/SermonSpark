import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { theme } from '@/constants/Theme';
import { sermonRepository } from '@/services/repositories';
import { Sermon } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SermonDetailPage() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLargeScreen = Math.min(width, height) >= 768;
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadSermon = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const sermonData = await sermonRepository.get(id);
      
      // Convert Supabase data to app Sermon format
      const mappedSermon: Sermon = {
        id: sermonData.id,
        title: sermonData.title || 'Untitled Sermon',
        content: sermonData.content || '',
        outline: typeof sermonData.outline === 'string' ? sermonData.outline : JSON.stringify(sermonData.outline ?? ''),
        scripture: sermonData.scripture || '',
        tags: sermonData.tags || [],
        seriesId: (sermonData as any).seriesId || '',
        series: (sermonData as any).seriesTitle || '',
        orderInSeries: undefined,
        date: sermonData.date ? new Date(sermonData.date) : new Date(),
        preachedDate: undefined,
        lastModified: new Date(),
        wordCount: (sermonData.content || '').trim().split(/\s+/).filter(Boolean).length,
        readingTime: Math.ceil(((sermonData.content || '').trim().split(/\s+/).filter(Boolean).length || 0) / 150),
        isArchived: sermonData.status === 'archived',
        isFavorite: false,
        notes: sermonData.notes || '',
      };
      
      setSermon(mappedSermon);
    } catch (e: any) {
      console.error('Failed to load sermon:', e);
      setError(e?.message || 'Failed to load sermon');
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  // Load sermon when component mounts or ID changes
  useFocusEffect(
    useCallback(() => {
      loadSermon();
    }, [loadSermon])
  );
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Try Again" onPress={loadSermon} />
        </View>
      </SafeAreaView>
    );
  }
  
  if (!sermon) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="document-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={styles.errorText}>Sermon not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const handleEdit = () => {
    router.push(`/sermon/edit/${sermon.id}`);
  };

  const handlePulpitView = () => {
    router.push(`/pulpit/${sermon.id}`);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleDelete = () => {
    // Web: use window.confirm to get a real confirm dialog with an actionable result
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(`Delete this sermon? This action cannot be undone.`) : false;
      if (!confirmed) return;
      (async () => {
        try {
          if (sermon?.id) {
            await sermonRepository.remove(sermon.id);
            if (router.canGoBack()) router.back();
            else router.replace('/');
          }
        } catch (error: any) {
          alert(error?.message || 'Failed to delete sermon');
        }
      })();
      return;
    }

    Alert.alert(
      'Delete Sermon',
      `Are you sure you want to delete "${sermon?.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (sermon?.id) {
                await sermonRepository.remove(sermon.id);
                Alert.alert('Success', 'Sermon deleted successfully', [
                  {
                    text: 'OK',
                    onPress: () => {
                      if (router.canGoBack()) router.back();
                      else router.replace('/');
                    },
                  },
                ]);
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete sermon');
            }
          },
        },
      ]
    );
  };

  // Highlight ==text== while preserving inherited formatting
  const highlightRules = {
    text: (
      node: any,
      _children: any,
      _parent: any,
      styles: any,
      inheritedStyles: any = {}
    ) => {
      const content: string = node.content ?? '';
      if (!content) return null;

      if (content.indexOf('==') === -1) {
        return (
          <Text key={node.key} style={[inheritedStyles, styles.text]}>
            {content}
          </Text>
        );
      }

      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let idx = 0;
      const regex = /==(.+?)==/g;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.slice(lastIndex, match.index));
        }
        parts.push(
          <Text
            key={`h-${idx}-${match.index}`}
            style={[inheritedStyles, styles.text, markdownStyles.highlight]}
          >
            {match[1]}
          </Text>
        );
        lastIndex = match.index + match[0].length;
        idx++;
      }

      if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex));
      }

      return (
        <Text key={`text-${node.key || Math.random()}`} style={[inheritedStyles, styles.text]}>
          {parts}
        </Text>
      );
    },
  } as const;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const minHeaderPad = isLargeScreen ? 28 : 12;
  // const headerTopPad = Math.max(insets.top || 0, minHeaderPad);
  const headerTopPad = 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerTopPad }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Sermons</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={handleEdit} style={styles.headerAction}>
            <Ionicons name="create-outline" size={20} color={theme.colors.textSecondary} />
          </Pressable>
          <Pressable onPress={handlePulpitView} style={styles.pulpitButton}>
            <Ionicons name="tv-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.pulpitButtonText}>PULPIT</Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sermon Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.sermonHeader}>
            <Text style={styles.title}>{sermon.title}</Text>
            {sermon.series && (
              <View style={styles.seriesBadge}>
                <Text style={styles.seriesText}>SERIES: {sermon.series.toUpperCase()}</Text>
              </View>
            )}
          </View>

          <View style={styles.metaInfo}>
            <View style={styles.metaRow}>
              <Ionicons name="book" size={16} color={theme.colors.primary} />
              <Text style={styles.metaText}>{sermon.scripture}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{formatDate(sermon.date)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{sermon.readingTime} min read • {sermon.wordCount} words</Text>
            </View>
          </View>

          {sermon.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {sermon.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Sermon Content */}
        <Card style={styles.contentCard}>
          <Markdown style={markdownStyles} rules={highlightRules}>
            {sermon.content || ''}
          </Markdown>
        </Card>

        {/* Delete Button */}
        <View style={styles.deleteButtonContainer}>
          <Pressable 
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.deleteButtonPressed
            ]} 
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.surface} />
            <Text style={styles.deleteButtonText}>Delete Sermon</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  headerAction: {
    padding: theme.spacing.xs,
  },
  pulpitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  pulpitButtonText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  infoCard: {
    marginBottom: theme.spacing.lg,
  },
  sermonHeader: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: theme.spacing.md,
  },
  seriesBadge: {
    backgroundColor: theme.colors.accent + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  seriesText: {
    ...theme.typography.overline,
    color: theme.colors.accent,
    fontWeight: '700',
  },
  metaInfo: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  metaText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  tag: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  tagText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '500',
  },
  contentCard: {
    marginBottom: theme.spacing.lg,
  },
  deleteButtonContainer: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  deleteButtonText: {
    color: theme.colors.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  deleteButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  contentText: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    lineHeight: 28,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  errorText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

const markdownStyles = {
  body: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    lineHeight: 28,
    fontSize: 16,
  },
  heading1: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  heading2: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  heading3: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  paragraph: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    lineHeight: 28,
    fontSize: 16,
    marginBottom: theme.spacing.md,
  },
  strong: {
    fontWeight: '700',
  },
  em: {
    fontStyle: 'italic',
  },
  list_item: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    lineHeight: 24,
    marginBottom: theme.spacing.xs,
  },
  blockquote: {
    backgroundColor: theme.colors.gray100,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    paddingLeft: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginVertical: theme.spacing.md,
    fontStyle: 'italic',
  },
  // Inline highlight span for ==text==
  highlight: {
    backgroundColor: '#FFF59D',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
};
