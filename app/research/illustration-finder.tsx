import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { RichHtml } from '@/components/common/RichHtml';
import { theme } from '@/constants/Theme';
import { api } from '@/convex/_generated/api';
import { markdownToHtml } from '@/utils/markdown';
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
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';

type GenerateIllustrationArgs = {
  biblical_concept: string;
};

type GenerateIllustrationResult = {
  illustration: string;
  html?: string;
  raw?: unknown;
};

type IllustrationContent = {
  html: string;
  text: string;
};

export default function IllustrationFinderPage() {
  const [inputMethod, setInputMethod] = useState<'concept' | 'brainstorm'>('concept');
  const [biblicalConcept, setBiblicalConcept] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [illustrationResult, setIllustrationResult] = useState<IllustrationContent | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [thinkingDots, setThinkingDots] = useState(0);
  const [lastRequest, setLastRequest] = useState<GenerateIllustrationArgs | null>(null);

  const { width, height } = useWindowDimensions();
  const isLargeScreen = Math.max(width, height) >= 768;
  const presentationStyle =
    isLargeScreen && Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen';

  const illustrationActionReference = (
    api as unknown as Record<string, any>
  )['functions/generateIllustration'].generateIllustration as FunctionReference<
    'action',
    'public',
    GenerateIllustrationArgs,
    GenerateIllustrationResult
  >;

  const generateIllustrationAction = useAction(illustrationActionReference);

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

  const runIllustrationGeneration = async (args: GenerateIllustrationArgs) => {
    setIsGenerating(true);
    setIllustrationResult(null);
    setModalError(null);

    try {
      const response = await generateIllustrationAction(args);
      const html = response.html && response.html.trim().length > 0
        ? response.html
        : markdownToHtml(response.illustration);
      setIllustrationResult({
        html,
        text: response.illustration,
      });
    } catch (error) {
      console.error('Failed to generate illustration', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to generate an illustration right now. Please try again.';
      setModalError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateIllustrations = () => {
    if (!biblicalConcept.trim()) {
      Alert.alert('Missing Information', 'Please provide a Biblical concept to generate illustrations.');
      return;
    }

    const args: GenerateIllustrationArgs = {
      biblical_concept: biblicalConcept.trim(),
    };

    setLastRequest(args);
    setIsResultModalVisible(true);
    void runIllustrationGeneration(args);
  };

  const handleRegenerateIllustration = () => {
    if (!lastRequest) {
      return;
    }

    void runIllustrationGeneration(lastRequest);
  };

  const handleCopyIllustration = async () => {
    if (!illustrationResult) {
      return;
    }

    try {
      await Clipboard.setStringAsync(illustrationResult.text);
      Alert.alert('Copied to Clipboard', 'The generated illustration has been copied to your clipboard.');
    } catch (error) {
      console.error('Failed to copy illustration to clipboard', error);
      Alert.alert('Copy Failed', 'Unable to copy the illustration. Please try again.');
    }
  };

  const animatedDots = '.'.repeat(thinkingDots);
  const disableGenerate = isGenerating || !biblicalConcept.trim();

  const renderResultBody = (scrollStyle?: StyleProp<ViewStyle>) => (
    <>
      <View style={styles.resultModalHeader}>
        <Text style={styles.resultModalTitle}>Generated Illustration</Text>
        <Pressable
          style={[styles.modalCloseButton, isGenerating && styles.modalCloseButtonDisabled]}
          onPress={closeResultModal}
          disabled={isGenerating}
        >
          <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      {isGenerating && !illustrationResult && !modalError ? (
        <View style={styles.thinkingContainer}>
          <LoadingIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.thinkingText}>{`Thinking${animatedDots}`}</Text>
        </View>
      ) : null}

      {modalError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
          <Text style={styles.errorText}>{modalError}</Text>
        </View>
      ) : null}

      {illustrationResult ? (
        <ScrollView
          style={[styles.resultScroll, scrollStyle]}
          contentContainerStyle={styles.resultScrollContent}
          showsVerticalScrollIndicator={true}
        >
          <RichHtml html={illustrationResult.html} />
        </ScrollView>
      ) : null}

      <View style={styles.resultButtonRow}>
        <Button
          title="Copy to Clipboard"
          onPress={handleCopyIllustration}
          variant="secondary"
          disabled={!illustrationResult || isGenerating}
          style={styles.resultButton}
        />
        <Button
          title={isGenerating ? 'Regenerating...' : 'Regenerate Result'}
          onPress={handleRegenerateIllustration}
          variant="primary"
          disabled={!lastRequest || isGenerating}
          style={styles.resultButton}
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
        <Text style={styles.headerTitle}>Illustration Finder</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tool Description */}
        <Card style={styles.descriptionCard}>
          <View style={styles.toolHeader}>
            <View style={styles.toolIcon}>
              <Ionicons name="images" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>Illustration Finder</Text>
              <Text style={styles.toolDescription}>
                Discover compelling stories and examples for your sermons
              </Text>
            </View>
          </View>
        </Card>

        {/* Input Method Selection */}
        <Card style={styles.sectionCard}>
          <Text style={styles.radioGroupTitle}>Input Method</Text>
          
          {/* Provide a concept */}
          <Pressable
            style={styles.radioOption}
            onPress={() => setInputMethod('concept')}
          >
            <View style={styles.radioCircle}>
              {inputMethod === 'concept' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioText}>Provide a concept</Text>
          </Pressable>

          {/* Provide a brainstorm */}
          <Pressable
            style={[styles.radioOption, styles.radioOptionLocked]}
            onPress={() => {
              Alert.alert('Premium Feature', 'This feature is available for premium users.');
            }}
          >
            <View style={styles.radioCircle}>
              {inputMethod === 'brainstorm' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.radioTextRow}>
              <Text style={styles.radioText}>Provide a brainstorm</Text>
              <Ionicons name="lock-closed" size={16} color={theme.colors.premium} />
            </View>
          </Pressable>
        </Card>

        {/* Form Fields */}
        {inputMethod === 'concept' && (
          <>
            {/* Biblical Concept Input */}
            <Card style={styles.inputCard}>
              <Text style={styles.inputLabel}>What Biblical concept are you trying to describe?</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your Biblical concept..."
                placeholderTextColor={theme.colors.gray500}
                value={biblicalConcept}
                onChangeText={setBiblicalConcept}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />
            </Card>
          </>
        )}

        {/* Generate Button */}
        <Card style={styles.generateCard}>
          <Button
            title={isGenerating ? 'Generating Illustrations...' : 'Generate Illustrations'}
            onPress={handleGenerateIllustrations}
            variant="primary"
            disabled={disableGenerate}
            icon={
              isGenerating ? (
                <LoadingIndicator size="small" color={theme.colors.white} />
              ) : (
                <Ionicons name="sparkles" size={16} color={theme.colors.white} />
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
            <Text style={styles.tipItem}>• Provide a Biblical concept or theme</Text>
            <Text style={styles.tipItem}>• Our AI will generate relevant illustrations</Text>
            <Text style={styles.tipItem}>• Use stories, examples, and analogies to make your point</Text>
            <Text style={styles.tipItem}>• Customize and save illustrations for your sermons</Text>
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
          <SafeAreaView style={styles.sheetContainer}>
            <View style={styles.resultModalContentSheet}>{renderResultBody(styles.resultScrollSheet)}</View>
          </SafeAreaView>
        ) : (
          <View style={styles.resultOverlay}>
            <Pressable
              style={styles.backdrop}
              onPress={closeResultModal}
              disabled={isGenerating}
            />
            <View style={styles.resultModalContent}>{renderResultBody()}</View>
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

  // Section cards
  sectionCard: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    marginBottom: theme.spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  helpButton: {
    padding: theme.spacing.xs,
  },
  sectionSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },

  // Radio buttons
  radioGroupTitle: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  radioOptionLocked: {
    opacity: 0.6,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.gray400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  radioTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  radioText: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
    flex: 1,
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
  resultOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingTop: 0,
  },
  resultModalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    width: '100%',
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    maxHeight: '85%',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  resultModalContentSheet: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 720,
    maxHeight: undefined,
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  resultModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  resultModalTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
  modalCloseButtonDisabled: {
    opacity: 0.4,
  },
  thinkingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  thinkingText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.error + '10',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.body2,
    color: theme.colors.error,
    flex: 1,
  },
  resultScroll: {
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.white,
    maxHeight: '55%',
    marginBottom: theme.spacing.md,
  },
  resultScrollSheet: {
    maxHeight: undefined,
    flex: 1,
  },
  resultScrollContent: {
    padding: theme.spacing.md,
  },
  resultButtonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  resultButton: {
    flex: 1,
  },
});
