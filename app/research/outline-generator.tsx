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

const OUTLINE_TYPES = [
  { label: 'Expository Outline', value: 'Expository Outline' },
  { label: 'Topical Outline', value: 'Topical Outline' },
  { label: 'Narrative Outline', value: 'Narrative Outline' },
  { label: 'Thematic Outline', value: 'Thematic Outline' },
  { label: 'Problem-Solution Outline', value: 'Problem-Solution Outline' },
  { label: 'Verse-by-verse Outline', value: 'Verse-by-verse Outline' },
  { label: 'Compare and Contrast Outline', value: 'Compare and Contrast Outline' },
  { label: 'Me-We-God-You-We Otline', value: 'Me-We-God-You-We Otline' },

];

type GenerateOutlineArgs = {
  outline_type: string;
  sermon_topic: string;
  bible_verse: string;
  preacher: string;
};

type GenerateOutlineResult = {
  outline: string;
  html?: string;
  raw?: unknown;
};

type OutlineContent = {
  html: string;
  text: string;
};

export default function OutlineGeneratorPage() {
  const [outlineType, setOutlineType] = useState(OUTLINE_TYPES[0]?.value ?? '');
  const [inputMethod, setInputMethod] = useState<'topic-verse' | 'brainstorm'>('topic-verse');
  const [sermonTopic, setSermonTopic] = useState('');
  const [bibleVerse, setBibleVerse] = useState('');
  const [preacherInspiration, setPreacherInspiration] = useState('');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [outlineResult, setOutlineResult] = useState<OutlineContent | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [thinkingDots, setThinkingDots] = useState(0);
  const [lastRequest, setLastRequest] = useState<GenerateOutlineArgs | null>(null);

  const { width, height } = useWindowDimensions();
  const isLargeScreen = Math.max(width, height) >= 768;
  const presentationStyle =
    isLargeScreen && Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen';

  const outlineActionReference = (
    api as unknown as Record<string, any>
  )['functions/generateOutline'].generateOutline as FunctionReference<
    'action',
    'public',
    GenerateOutlineArgs,
    GenerateOutlineResult
  >;

  const generateOutlineAction = useAction(outlineActionReference);

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

  const runOutlineGeneration = async (args: GenerateOutlineArgs) => {
    setIsGenerating(true);
    setOutlineResult(null);
    setModalError(null);

    try {
      const response = await generateOutlineAction(args);
      const html = response.html && response.html.trim().length > 0
        ? response.html
        : markdownToHtml(response.outline);
      setOutlineResult({
        html,
        text: response.outline,
      });
    } catch (error) {
      console.error('Failed to generate outline', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to generate an outline right now. Please try again.';
      setModalError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateOutline = () => {
    if (!sermonTopic.trim() && !bibleVerse.trim()) {
      Alert.alert('Missing Information', 'Please provide a sermon topic or Bible verse to generate an outline.');
      return;
    }

    const args: GenerateOutlineArgs = {
      outline_type: outlineType,
      sermon_topic: sermonTopic.trim(),
      bible_verse: bibleVerse.trim(),
      preacher: preacherInspiration.trim(),
    };

    setLastRequest(args);
    setIsResultModalVisible(true);
    void runOutlineGeneration(args);
  };

  const handleRegenerateOutline = () => {
    if (!lastRequest) {
      return;
    }

    void runOutlineGeneration(lastRequest);
  };

  const handleCopyOutline = async () => {
    if (!outlineResult) {
      return;
    }

    try {
      await Clipboard.setStringAsync(outlineResult.text);
      Alert.alert('Copied to Clipboard', 'The generated outline has been copied to your clipboard.');
    } catch (error) {
      console.error('Failed to copy outline to clipboard', error);
      Alert.alert('Copy Failed', 'Unable to copy the outline. Please try again.');
    }
  };

  const selectedType = OUTLINE_TYPES.find(type => type.value === outlineType);
  const animatedDots = '.'.repeat(thinkingDots);
  const disableGenerate = isGenerating || (!sermonTopic.trim() && !bibleVerse.trim());

  const renderResultBody = (scrollStyle?: StyleProp<ViewStyle>) => (
    <>
      <View style={resultModalHeader}>
        <Text style={resultModalTitle}>Generated Outline</Text>
        <Pressable
          style={[modalCloseButton, isGenerating && modalCloseButtonDisabled]}
          onPress={closeResultModal}
          disabled={isGenerating}
        >
          <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      {isGenerating && !outlineResult && !modalError ? (
        <View style={thinkingContainer}>
          <LoadingIndicator size="large" color={theme.colors.primary} />
          <Text style={thinkingText}>{`Thinking${animatedDots}`}</Text>
        </View>
      ) : null}

      {modalError ? (
        <View style={errorContainer}>
          <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
          <Text style={errorText}>{modalError}</Text>
        </View>
      ) : null}

      {outlineResult ? (
        <ScrollView
          style={[resultScroll, scrollStyle]}
          contentContainerStyle={resultScrollContent}
          showsVerticalScrollIndicator={true}
        >
          <RichHtml html={outlineResult.html} />
        </ScrollView>
      ) : null}

      <View style={resultButtonRow}>
        <Button
          title="Copy to Clipboard"
          onPress={handleCopyOutline}
          variant="secondary"
          disabled={!outlineResult || isGenerating}
          style={resultButton}
        />
        <Button
          title={isGenerating ? 'Regenerating...' : 'Regenerate Result'}
          onPress={handleRegenerateOutline}
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
        <Text style={styles.headerTitle}>Outline Generator</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tool Description */}
        <Card style={styles.descriptionCard}>
          <View style={styles.toolHeader}>
            <View style={styles.toolIcon}>
              <Ionicons name="list" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>Outline Generator</Text>
              <Text style={styles.toolDescription}>
                Create structured sermon outlines with AI assistance
              </Text>
            </View>
          </View>
        </Card>

        {/* Outline Type Section */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Outline Type</Text>
              <Pressable style={styles.helpButton}>
                <Ionicons name="help-circle-outline" size={20} color={theme.colors.primary} />
              </Pressable>
            </View>
            <Text style={styles.sectionSubtitle}>Choose Your Outline Type</Text>
          </View>

          <Pressable
            style={styles.dropdown}
            onPress={() => setShowTypeDropdown(true)}
          >
            <Text style={styles.dropdownText}>
              {selectedType?.label || 'Expository Outline'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.colors.gray600} />
          </Pressable>
        </Card>

        {/* Input Method Selection */}
        <Card style={styles.sectionCard}>
          <Text style={styles.radioGroupTitle}>Input Method</Text>
          
          {/* Provide topic and/or Bible verse */}
          <Pressable
            style={styles.radioOption}
            onPress={() => setInputMethod('topic-verse')}
          >
            <View style={styles.radioCircle}>
              {inputMethod === 'topic-verse' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioText}>Provide a topic and/or Bible verse</Text>
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
        {inputMethod === 'topic-verse' && (
          <>
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

            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>AND OPTIONALLY</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Preacher Inspiration */}
            <Card style={styles.inputCard}>
              <Text style={styles.inputLabel}>Preacher Inspiration</Text>
              <Text style={styles.inputSubtext}>Include your favorite popular preacher for outline inspiration</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Pastor Billy Graham"
                placeholderTextColor={theme.colors.gray500}
                value={preacherInspiration}
                onChangeText={setPreacherInspiration}
                multiline={false}
              />
            </Card>
          </>
        )}

        {/* Generate Button */}
        <Card style={styles.generateCard}>
          <Button
            title={isGenerating ? 'Generating Outline...' : 'Generate Outline'}
            onPress={handleGenerateOutline}
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
            <Text style={styles.tipItem}>• Enter your sermon topic or key Bible verse</Text>
            <Text style={styles.tipItem}>• Choose an outline type that fits your preaching style</Text>
            <Text style={styles.tipItem}>• Our AI will generate a structured outline for you</Text>
            <Text style={styles.tipItem}>• Customize and refine the outline to your needs</Text>
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

      {/* Outline Type Modal */}
      <Modal
        visible={showTypeDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTypeDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Outline Type</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowTypeDropdown(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.optionsList}>
              {OUTLINE_TYPES.map((type) => (
                <Pressable
                  key={type.value}
                  style={[
                    styles.optionItem,
                    outlineType === type.value && styles.optionItemSelected
                  ]}
                  onPress={() => {
                    setOutlineType(type.value);
                    setShowTypeDropdown(false);
                  }}
                >
                  <Text style={styles.optionText}>{type.label}</Text>
                  {outlineType === type.value && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
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
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  dropdownText: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
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

  // Modal styles
  // All modal styles for result modal have been moved to components/common/ResultModalStyles.ts
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  modalTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
  optionsList: {
    padding: theme.spacing.sm,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xs,
  },
  optionItemSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  optionText: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    flex: 1,
  },
});

