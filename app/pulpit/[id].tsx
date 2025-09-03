import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, StyleSheet, ScrollView, View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { theme } from '@/constants/Theme';
import { Sermon } from '@/types';
import sermonService from '@/services/supabaseSermonService';
import Markdown from 'react-native-markdown-display';


export default function PulpitViewPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadSermon = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const sermonData = await sermonService.getByDocumentId(id);
      
      // Convert Supabase data to app Sermon format
      const mappedSermon: Sermon = {
        id: sermonData.id,
        title: sermonData.title || 'Untitled Sermon',
        content: sermonData.content || '',
        outline: typeof sermonData.outline === 'string' ? sermonData.outline : JSON.stringify(sermonData.outline ?? ''),
        scripture: sermonData.scripture || '',
        tags: sermonData.tags || [],
        seriesId: sermonData.series?.id || '',
        series: sermonData.series?.title || '',
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading sermon...</Text>
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
          <Pressable onPress={loadSermon} style={styles.retryButton}>
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
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
          <Pressable onPress={handleBack} style={styles.retryButton}>
            <Text style={styles.retryText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    if (!id || Array.isArray(id)) {
      router.push('/');
    } else {
      router.back();
    }
  };

  const handleStartTimer = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
    } else {
      setIsTimerRunning(true);
      if (seconds === 0) {
        setSeconds(0);
      }
    }
  };

  const resetTimer = () => {
    setSeconds(0);
    setIsTimerRunning(false);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        
        <View style={styles.timerDisplay}>
          <Text style={styles.timerText}>{formatTime(seconds)}</Text>
        </View>

        <View style={styles.timerControls}>
          <Pressable 
            onPress={handleStartTimer} 
            style={styles.timerButton}
          >
            <Ionicons 
              name={isTimerRunning ? "pause" : "play"} 
              size={20} 
              color={isTimerRunning ? theme.colors.error : theme.colors.primary} 
            />
          </Pressable>
          {seconds > 0 && (
            <Pressable onPress={resetTimer} style={styles.resetButton}>
              <Ionicons name="refresh" size={18} color={theme.colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Markdown style={pulpitMarkdownStyles}>{sermon.content}</Markdown>
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    elevation: 3,
  },
  backButton: {
    padding: theme.spacing.xs,
    flex: 1,
    alignItems: 'flex-start',
  },
  timerDisplay: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  timerControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.xs,
  },
  timerButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.gray100,
  },
  resetButton: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  sermonText: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    lineHeight: 32,
    fontSize: 18,
    fontWeight: '400',
  },
  bottomPadding: {
    height: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
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
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  retryText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
});

const pulpitMarkdownStyles = {
  body: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    lineHeight: 32,
    fontSize: 18,
    fontWeight: '400',
  },
  heading1: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    fontWeight: '700',
  },
  heading2: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
    fontWeight: '600',
  },
  heading3: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
    fontWeight: '600',
  },
  paragraph: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    lineHeight: 32,
    fontSize: 18,
    marginBottom: theme.spacing.lg,
    fontWeight: '400',
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
    lineHeight: 28,
    fontSize: 18,
    marginBottom: theme.spacing.sm,
  },
  blockquote: {
    backgroundColor: theme.colors.gray100,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    paddingLeft: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginVertical: theme.spacing.lg,
    fontStyle: 'italic',
  },
};