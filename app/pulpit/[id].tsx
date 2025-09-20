import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import type { TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { theme } from '@/constants/Theme';
import { Sermon } from '@/types';
import { sermonRepository } from '@/services/repositories';
import Markdown from 'react-native-markdown-display';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const FONT_SCALE_STEP = 0.1;
const MIN_FONT_SCALE = 0.8;
const MAX_FONT_SCALE = 1.5;

export default function PulpitViewPage() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLargeScreen = Math.min(width, height) >= 768;
  const { id } = useLocalSearchParams<{ id: string }>();
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontScale, setFontScale] = useState(1);

  const markdownStyles = useMemo(() => createPulpitMarkdownStyles(fontScale), [fontScale]);
  const baseTextStyle = useMemo(() => createBaseTextStyle(fontScale), [fontScale]);
  const highlightRules = useMemo(
    () => createHighlightRules(baseTextStyle, markdownStyles.highlight),
    [baseTextStyle, markdownStyles.highlight]
  );
  
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

  const handleDecreaseFont = () => {
    setFontScale(prev => {
      const next = Math.max(MIN_FONT_SCALE, Number((prev - FONT_SCALE_STEP).toFixed(2)));
      return next;
    });
  };

  const handleIncreaseFont = () => {
    setFontScale(prev => {
      const next = Math.min(MAX_FONT_SCALE, Number((prev + FONT_SCALE_STEP).toFixed(2)));
      return next;
    });
  };

  const canDecreaseFont = fontScale > MIN_FONT_SCALE + 0.01;
  const canIncreaseFont = fontScale < MAX_FONT_SCALE - 0.01;

  // Custom markdown rules to highlight ==text== only (preserve parent formatting via inheritedStyles)
  const stickyTopPad = Math.max((insets.top || 0) + (isLargeScreen ? 12 : 6), isLargeScreen ? 24 : 10);

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={[styles.stickyHeader, { paddingTop: stickyTopPad }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>

        <View style={styles.timerDisplay}>
          <Text style={styles.timerText}>{formatTime(seconds)}</Text>
        </View>

        <View style={styles.rightControls}>
          <View style={styles.fontSizeControls}>
            <Pressable
              onPress={handleDecreaseFont}
              disabled={!canDecreaseFont}
              style={[styles.fontIconButton, !canDecreaseFont && styles.fontIconButtonDisabled]}
            >
              <Ionicons
                name="remove-outline"
                size={18}
                color={theme.colors.textSecondary}
              />
            </Pressable>
            <Text
              style={[
                styles.fontIconLabel,
                { fontSize: Number((16 * fontScale).toFixed(0)) },
              ]}
            >
              A
            </Text>
            <Pressable
              onPress={handleIncreaseFont}
              disabled={!canIncreaseFont}
              style={[styles.fontIconButton, !canIncreaseFont && styles.fontIconButtonDisabled]}
            >
              <Ionicons name="add-outline" size={18} color={theme.colors.textSecondary} />
            </Pressable>
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
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Markdown style={markdownStyles} rules={highlightRules}>
          {sermon.content || ''}
        </Markdown>
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
  rightControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.gray100,
    gap: theme.spacing.xs,
  },
  fontIconButton: {
    padding: theme.spacing.xs,
  },
  fontIconButtonDisabled: {
    opacity: 0.4,
  },
  fontIconLabel: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    fontWeight: '600',
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

const baseMarkdownStyles = {
  // Match sermon/[id] typography for consistency
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
    ...theme.typography.body1,
    backgroundColor: theme.colors.gray100,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    paddingLeft: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginVertical: theme.spacing.md,
    fontStyle: 'italic',
  },
  // Only used for inline ==highlight== segments; does not change font size/weight
  highlight: {
    backgroundColor: '#FFF59D',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
} as const;

const createBaseTextStyle = (scale: number): TextStyle => ({
  fontSize: Number((16 * scale).toFixed(1)),
  lineHeight: Number((28 * scale).toFixed(1)),
  color: theme.colors.textPrimary,
  fontWeight: '400',
});

const scaleTypography = (style: TextStyle, scale: number): TextStyle => {
  const scaled: TextStyle = { ...style };

  if (typeof scaled.fontSize === 'number') {
    scaled.fontSize = Number((scaled.fontSize * scale).toFixed(1));
  }

  if (typeof scaled.lineHeight === 'number') {
    scaled.lineHeight = Number((scaled.lineHeight * scale).toFixed(1));
  }

  return scaled;
};

const createPulpitMarkdownStyles = (scale: number) => ({
  body: scaleTypography(baseMarkdownStyles.body, scale),
  heading1: scaleTypography(baseMarkdownStyles.heading1, scale),
  heading2: scaleTypography(baseMarkdownStyles.heading2, scale),
  heading3: scaleTypography(baseMarkdownStyles.heading3, scale),
  paragraph: scaleTypography(baseMarkdownStyles.paragraph, scale),
  strong: { ...baseMarkdownStyles.strong },
  em: { ...baseMarkdownStyles.em },
  list_item: scaleTypography(baseMarkdownStyles.list_item, scale),
  blockquote: scaleTypography(baseMarkdownStyles.blockquote, scale),
  highlight: baseMarkdownStyles.highlight,
});

const createHighlightRules = (baseTextStyle: TextStyle, highlightStyle: TextStyle) => ({
  text: (
    node: any,
    _children: any,
    _parent: any,
    _styles: any,
    inheritedStyles: any = {}
  ) => {
    const content: string = node.content ?? '';
    if (!content) return null;

    const textStyles: TextStyle[] = [baseTextStyle];

    if (Array.isArray(inheritedStyles)) {
      textStyles.push(...inheritedStyles);
    } else if (inheritedStyles) {
      textStyles.push(inheritedStyles);
    }

    if (content.indexOf('==') === -1) {
      return (
        <Text key={node.key} style={textStyles}>
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
          style={[...textStyles, highlightStyle]}
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
      <Text key={`text-${node.key || Math.random()}`} style={textStyles}>
        {parts}
      </Text>
    );
  },
});
