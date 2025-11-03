import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { RichHtml } from '@/components/common/RichHtml';
import { theme } from '@/constants/Theme';
import {
  modalContainer,
  resultOverlay,
  backdrop,
  resultModalContent,
  resultModalHeader,
  resultModalTitle,
  modalCloseButton,
  modalCloseButtonDisabled,
  thinkingContainer,
  thinkingText,
  errorContainer,
  errorText,
  resultScroll,
  resultScrollContent,
  resultButtonRow,
  resultButton,
} from '@/components/common/ResultModalStyles';
import { api } from '@/convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { useAction } from 'convex/react';
import type { FunctionReference } from 'convex/server';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';

type GenerateTopicExplorationArgs = {
  sermon_topic?: string;
  bible_verse?: string;
};

type GenerateTopicExplorationResult = {
  exploration: string;
  html: string;
  raw?: unknown;
};

type TopicExplorationContent = {
  html: string;
  text: string;
};

export default function TopicExplorerPage() {
  const [sermonTopic, setSermonTopic] = useState('');
  const [bibleVerse, setBibleVerse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [explorationResult, setExplorationResult] = useState<TopicExplorationContent | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [thinkingDots, setThinkingDots] = useState(0);
  const [lastRequest, setLastRequest] = useState<GenerateTopicExplorationArgs | null>(null);

  const { width, height } = useWindowDimensions();
  const isLargeScreen = Math.max(width, height) >= 768;
  const presentationStyle =
    isLargeScreen && Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen';

  // Convex action reference
  const topicExplorationActionReference = (
    api as unknown as Record<string, any>
  )['functions/generateTopicExploration'].generateTopicExploration as FunctionReference<
    'action',
    'public',
    GenerateTopicExplorationArgs,
    GenerateTopicExplorationResult
  >;

  const generateTopicExplorationAction = useAction(topicExplorationActionReference);

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

  const runTopicExploration = async (args: GenerateTopicExplorationArgs) => {
    setIsGenerating(true);
    setExplorationResult(null);
    setModalError(null);

    try {
      const response = await generateTopicExplorationAction(args);
      const html = response.html && response.html.trim().length > 0
        ? response.html
        : `<div>${response.exploration}</div>`;
      setExplorationResult({
        html,
        text: response.exploration,
      });
    } catch (error) {
      console.error('Failed to generate topic exploration', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to generate topic exploration. Please try again.';
      setModalError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExploreTopic = async () => {
    if (!sermonTopic.trim() && !bibleVerse.trim()) {
      Alert.alert('Missing Information', 'Please provide a sermon topic or Bible verse to explore.');
      return;
    }

    const args: GenerateTopicExplorationArgs = {
      sermon_topic: sermonTopic.trim() || undefined,
      bible_verse: bibleVerse.trim() || undefined,
    };

    setLastRequest(args);
    setIsResultModalVisible(true);
    await runTopicExploration(args);
  };

  const handleRegenerateExploration = async () => {
    if (!lastRequest) {
      return;
    }
    await runTopicExploration(lastRequest);
  };

  const handleCopyExploration = async () => {
    if (!explorationResult) {
      return;
    }

    try {
      await Clipboard.setStringAsync(explorationResult.text);
      Alert.alert('Copied to Clipboard', 'The topic exploration has been copied to your clipboard.');
    } catch (error) {
      console.error('Failed to copy exploration to clipboard', error);
      Alert.alert('Copy Failed', 'Unable to copy the exploration. Please try again.');
    }
  };

  const animatedDots = '.'.repeat(thinkingDots);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Topic Explorer</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tool Description */}
        <Card style={styles.descriptionCard}>
          <View style={styles.toolHeader}>
            <View style={styles.toolIcon}>
              <Ionicons name="compass" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>Topic Explorer</Text>
              <Text style={styles.toolDescription}>
                Systematic theology topics and cross-references
              </Text>
            </View>
          </View>
        </Card>

        {/* Form Fields */}
        {/* Sermon Topic */}
        <Card style={styles.inputCard}>
          <Text style={styles.inputLabel}>Sermon Topic</Text>
          <Text style={styles.inputSubtext}>Enter the primary topic(s) of your sermon</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Finding Hope in Times of Uncertainty"
            placeholderTextColor={theme.colors.gray500}
            value={sermonTopic}
            onChangeText={setSermonTopic}
            multiline={false}
          />
        </Card>

        <View style={styles.separator}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>AND/OR</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Bible Verse */}
        <Card style={styles.inputCard}>
          <Text style={styles.inputLabel}>Bible Verse</Text>
          <Text style={styles.inputSubtext}>Enter the central Bible verse of your sermon</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Psalm 23:4"
            placeholderTextColor={theme.colors.gray500}
            value={bibleVerse}
            onChangeText={setBibleVerse}
            multiline={false}
          />
        </Card>

        {/* Explore Topic Button */}
        <Card style={styles.generateCard}>
          <Button
            title={isGenerating ? 'Exploring Topic...' : 'Explore Topic'}
            onPress={handleExploreTopic}
            variant="primary"
            disabled={isGenerating || (!sermonTopic && !bibleVerse)}
            icon={
              isGenerating ? (
                <LoadingIndicator size="small" color={theme.colors.white} />
              ) : (
                <Ionicons name="compass-outline" size={16} color={theme.colors.white} />
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
            <Text style={styles.tipItem}>• Enter a sermon topic or Bible verse</Text>
            <Text style={styles.tipItem}>• Explore comprehensive theological insights</Text>
            <Text style={styles.tipItem}>• Discover cross-references and related topics</Text>
            <Text style={styles.tipItem}>• Get systematic theology perspectives</Text>
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
          <SafeAreaView style={modalContainer}>
            <View style={resultModalHeader}>
              <Text style={resultModalTitle}>Topic Exploration</Text>
              <Pressable
                style={[modalCloseButton, isGenerating && modalCloseButtonDisabled]}
                onPress={closeResultModal}
                disabled={isGenerating}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            {isGenerating && !explorationResult && !modalError ? (
              <View style={thinkingContainer}>
                <LoadingIndicator size="large" color={theme.colors.primary} />
                <Text style={thinkingText}>{`Exploring Topic${animatedDots}`}</Text>
              </View>
            ) : null}

            {modalError ? (
              <View style={errorContainer}>
                <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                <Text style={errorText}>{modalError}</Text>
              </View>
            ) : null}

            {explorationResult ? (
              <ScrollView
                style={resultScroll}
                contentContainerStyle={resultScrollContent}
                showsVerticalScrollIndicator={true}
              >
                <RichHtml html={explorationResult.html} />
              </ScrollView>
            ) : null}

            <View style={resultButtonRow}>
              <Button
                title="Copy to Clipboard"
                onPress={handleCopyExploration}
                variant="secondary"
                disabled={!explorationResult || isGenerating}
                style={resultButton}
              />
              <Button
                title={isGenerating ? 'Regenerating...' : 'Regenerate'}
                onPress={handleRegenerateExploration}
                variant="primary"
                disabled={!lastRequest || isGenerating}
                style={resultButton}
              />
            </View>
          </SafeAreaView>
        ) : (
          <View style={resultOverlay}>
            <Pressable
              style={backdrop}
              onPress={closeResultModal}
              disabled={isGenerating}
            />
            <View style={resultModalContent}>
              <View style={resultModalHeader}>
                <Text style={resultModalTitle}>Topic Exploration</Text>
                <Pressable
                  style={[modalCloseButton, isGenerating && modalCloseButtonDisabled]}
                  onPress={closeResultModal}
                  disabled={isGenerating}
                >
                  <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                </Pressable>
              </View>

              {isGenerating && !explorationResult && !modalError ? (
                <View style={thinkingContainer}>
                  <LoadingIndicator size="large" color={theme.colors.primary} />
                  <Text style={thinkingText}>{`Exploring Topic${animatedDots}`}</Text>
                </View>
              ) : null}

              {modalError ? (
                <View style={errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                  <Text style={errorText}>{modalError}</Text>
                </View>
              ) : null}

              {explorationResult ? (
                <ScrollView
                  style={resultScroll}
                  contentContainerStyle={resultScrollContent}
                  showsVerticalScrollIndicator={true}
                >
                  <RichHtml html={explorationResult.html} />
                </ScrollView>
              ) : null}

              <View style={resultButtonRow}>
                <Button
                  title="Copy to Clipboard"
                  onPress={handleCopyExploration}
                  variant="secondary"
                  disabled={!explorationResult || isGenerating}
                  style={resultButton}
                />
                <Button
                  title={isGenerating ? 'Regenerating...' : 'Regenerate'}
                  onPress={handleRegenerateExploration}
                  variant="primary"
                  disabled={!lastRequest || isGenerating}
                  style={resultButton}
                />
              </View>
            </View>
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
    marginBottom: theme.spacing.xs,
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
    minHeight: 48,
  },

  // Separator
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.gray300,
  },
  separatorText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
    marginHorizontal: theme.spacing.sm,
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

  // Modal styles have been moved to components/common/ResultModalStyles.ts
});





