import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { RichHtml } from '@/components/common/RichHtml';
import { theme } from '@/constants/Theme';
import {
  resultOverlay,
  backdrop,
  sheetContainer,
  resultModalContent,
  resultModalContentSheet,
  resultModalHeader,
  resultModalTitle,
  modalCloseButton,
  modalCloseButtonDisabled,
  thinkingContainer,
  thinkingText,
  errorContainer,
  errorText,
  resultScroll,
  resultScrollSheet,
  resultScrollContent,
  resultButtonRow,
  resultButton,
} from '@/components/common/ResultModalStyles';
import { api } from '@/convex/_generated/api';
import { markdownToHtml } from '@/utils/markdown';
import { Ionicons } from '@expo/vector-icons';
import { useAction } from 'convex/react';
import type { FunctionReference } from 'convex/server';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';

type GenerateLanguageStudyArgs = {
  bible_text: string;
};

type GenerateLanguageStudyResult = {
  study: string;
  html?: string;
  citations?: Citation[];
  raw?: unknown;
};

type Citation = {
  id: number;
  url: string;
  title?: string;
  snippet?: string;
};

type LanguageStudyContent = {
  html: string;
  text: string;
  citations: Citation[];
};

export default function OriginalLanguageStudyPage() {
  const [bibleVerse, setBibleVerse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [studyResult, setStudyResult] = useState<LanguageStudyContent | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [thinkingDots, setThinkingDots] = useState(0);
  const [lastRequest, setLastRequest] = useState<GenerateLanguageStudyArgs | null>(null);

  const { width, height } = useWindowDimensions();
  const isLargeScreen = Math.max(width, height) >= 768;
  const presentationStyle =
    isLargeScreen && Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen';

  const studyActionReference = (
    api as unknown as Record<string, any>
  )['functions/generateLanguageStudy'].generateLanguageStudy as FunctionReference<
    'action',
    'public',
    GenerateLanguageStudyArgs,
    GenerateLanguageStudyResult
  >;

  const generateStudyAction = useAction(studyActionReference);

  useEffect(() => {
    if (!isResultModalVisible || !isGenerating) {
      setThinkingDots(0);
      return;
    }

    const interval = setInterval(() => {
      setThinkingDots((prev) => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, [isResultModalVisible, isGenerating]);

  const handleBack = () => {
    router.back();
  };

  const closeResultModal = () => {
    if (isGenerating) {
      return;
    }
    setIsResultModalVisible(false);
  };

  const runStudyGeneration = async (args: GenerateLanguageStudyArgs) => {
    setIsGenerating(true);
    setStudyResult(null);
    setModalError(null);

    try {
      const response = await generateStudyAction(args);
      const html = response.html && response.html.trim().length > 0
        ? response.html
        : markdownToHtml(response.study);
      setStudyResult({
        html,
        text: response.study,
        citations: response.citations ?? [],
      });
    } catch (error) {
      console.error('Failed to generate language study', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to generate language study right now. Please try again.';
      setModalError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGetExplanation = () => {
    if (!bibleVerse.trim()) {
      Alert.alert('Missing Information', 'Please enter a Bible verse to get an original language explanation.');
      return;
    }

    const args: GenerateLanguageStudyArgs = {
      bible_text: bibleVerse.trim(),
    };

    setLastRequest(args);
    setIsResultModalVisible(true);
    void runStudyGeneration(args);
  };

  const handleRegenerateStudy = () => {
    if (!lastRequest) {
      return;
    }

    void runStudyGeneration(lastRequest);
  };

  const handleCopyStudy = async () => {
    if (!studyResult) {
      return;
    }

    try {
      await Clipboard.setStringAsync(studyResult.text);
      Alert.alert('Copied to Clipboard', 'The language study has been copied to your clipboard.');
    } catch (error) {
      console.error('Failed to copy study to clipboard', error);
      Alert.alert('Copy Failed', 'Unable to copy the study. Please try again.');
    }
  };

  const animatedDots = '.'.repeat(thinkingDots);
  const disableGenerate = isGenerating || !bibleVerse.trim();

  const renderResultBody = (scrollStyle?: StyleProp<ViewStyle>) => (
    <>
      <View style={resultModalHeader}>
        <Text style={resultModalTitle}>Original Language Study</Text>
        <Pressable
          style={[modalCloseButton, isGenerating && modalCloseButtonDisabled]}
          onPress={closeResultModal}
          disabled={isGenerating}
        >
          <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      {isGenerating && !studyResult && !modalError ? (
        <View style={thinkingContainer}>
          <LoadingIndicator size="large" color={theme.colors.primary} />
          <Text style={thinkingText}>{`Analyzing${animatedDots}`}</Text>
        </View>
      ) : null}

      {modalError ? (
        <View style={errorContainer}>
          <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
          <Text style={errorText}>{modalError}</Text>
        </View>
      ) : null}

      {studyResult ? (
        <ScrollView
          style={[resultScroll, scrollStyle]}
          contentContainerStyle={resultScrollContent}
          showsVerticalScrollIndicator={true}
        >
          <RichHtml html={studyResult.html} />
          {studyResult.citations.length ? (
            <View style={styles.citationSection}>
              <Text style={styles.citationHeading}>Sources</Text>
              {studyResult.citations.map((citation) => (
                <Pressable
                  key={citation.id}
                  style={styles.citationRow}
                  onPress={() => citation.url && Linking.openURL(citation.url)}
                >
                  <Text style={styles.citationIndex}>{`[${citation.id}]`}</Text>
                  <View style={styles.citationTextContainer}>
                    <Text style={styles.citationTitle}>
                      {citation.title || citation.url || `Source ${citation.id}`}
                    </Text>
                    {citation.snippet ? (
                      <Text style={styles.citationSnippet}>{citation.snippet}</Text>
                    ) : null}
                  </View>
                  {citation.url ? (
                    <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
      ) : null}

      <View style={resultButtonRow}>
        <Button
          title="Copy to Clipboard"
          onPress={handleCopyStudy}
          variant="secondary"
          disabled={!studyResult || isGenerating}
          style={resultButton}
        />
        <Button
          title={isGenerating ? 'Regenerating...' : 'Regenerate Result'}
          onPress={handleRegenerateStudy}
          variant="primary"
          disabled={!lastRequest || isGenerating}
          style={resultButton}
        />
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Original Language Study</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tool Description */}
        <Card style={styles.descriptionCard}>
          <View style={styles.toolHeader}>
            <View style={styles.toolIcon}>
              <Ionicons name="language" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>Original Language Study</Text>
              <Text style={styles.toolDescription}>
                Greek and Hebrew word studies with etymology
              </Text>
            </View>
          </View>
        </Card>

        {/* Bible Verse Input */}
        <Card style={styles.inputCard}>
          <Text style={styles.inputLabel}>Bible Verse or Passage</Text>
          <Text style={styles.inputSubtext}>
            Enter the Bible verse or passage for original language study
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter Bible verse or passage..."
            placeholderTextColor={theme.colors.gray500}
            value={bibleVerse}
            onChangeText={setBibleVerse}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Card>

        {/* Get Explanation Button */}
        <Card style={styles.generateCard}>
          <Button
            title={isGenerating ? 'Analyzing Languages...' : 'Get Language Study'}
            onPress={handleGetExplanation}
            variant="primary"
            disabled={disableGenerate}
            icon={
              isGenerating ? (
                <LoadingIndicator size="small" color={theme.colors.white} />
              ) : (
                <Ionicons name="school-outline" size={16} color={theme.colors.white} />
              )
            }
            style={styles.generateButton}
          />
        </Card>

        {/* Tips Card */}
        <Card style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.tipsTitle}>How It Works</Text>
          </View>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Enter a Bible verse or passage</Text>
            <Text style={styles.tipItem}>• Get Greek and Hebrew word studies</Text>
            <Text style={styles.tipItem}>• Explore etymology and root meanings</Text>
            <Text style={styles.tipItem}>• Understand original language nuances</Text>
          </View>
        </Card>
      </ScrollView>

      {/* Result Modal */}
      <Modal
        visible={isResultModalVisible}
        transparent={presentationStyle === 'overFullScreen'}
        animationType="slide"
        presentationStyle={presentationStyle}
        onRequestClose={closeResultModal}
      >
        {presentationStyle === 'pageSheet' ? (
          <SafeAreaView style={sheetContainer}>
            <View style={resultModalContentSheet}>{renderResultBody(resultScrollSheet)}</View>
          </SafeAreaView>
        ) : (
          <View style={resultOverlay}>
            <Pressable
              style={backdrop}
              onPress={closeResultModal}
              disabled={isGenerating}
            />
            <View style={resultModalContent}>{renderResultBody()}</View>
          </View>
        )}
      </Modal>
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
    paddingTop: Platform.OS === 'android' ? theme.spacing.lg : theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
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
    width: 40,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },

  // Description card
  descriptionCard: {
    marginBottom: theme.spacing.md,
  },
  toolHeader: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  toolIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  toolDescription: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },

  // Input fields
  inputCard: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  inputSubtext: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minHeight: 100,
  },

  // Generate button
  generateCard: {
    marginBottom: theme.spacing.md,
  },
  generateButton: {
    backgroundColor: theme.colors.primary,
  },

  // Tips card
  tipsCard: {
    marginBottom: theme.spacing.xxl,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  tipsTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  tipsList: {
    gap: theme.spacing.xs,
  },
  tipItem: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },

  // Modal styles
  // All modal styles have been moved to components/common/ResultModalStyles.ts
  citationSection: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray200,
    gap: theme.spacing.sm,
  },
  citationHeading: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  citationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  citationIndex: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
    minWidth: 28,
  },
  citationTextContainer: {
    flex: 1,
    gap: 2,
  },
  citationTitle: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  citationSnippet: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
});
