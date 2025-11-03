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
import { sermonRepository } from '@/services/repositories/sermonRepository.native';
import type { SermonDTO } from '@/services/repositories/types';

type GenerateDiscussionQuestionsArgs = {
  input_type: 'sermon' | 'topic_verse';
  content: string;
  sermon_title?: string;
  scripture_reference?: string;
  sermon_content?: string;
  topic?: string;
  bible_verse?: string;
};

type GenerateDiscussionQuestionsResult = {
  questions: string;
  html?: string;
  raw?: unknown;
};

type DiscussionQuestionsContent = {
  html: string;
  text: string;
};

export default function DiscussionQuestionsPage() {
  const [inputMethod, setInputMethod] = useState<'topic-verse' | 'transcription'>('topic-verse');
  const [sermonTopic, setSermonTopic] = useState('');
  const [bibleVerse, setBibleVerse] = useState('');
  const [availableSermons, setAvailableSermons] = useState<SermonDTO[]>([]);
  const [selectedSermon, setSelectedSermon] = useState<SermonDTO | null>(null);
  const [showSermonDropdown, setShowSermonDropdown] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSermons, setIsLoadingSermons] = useState(false);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [questionsResult, setQuestionsResult] = useState<DiscussionQuestionsContent | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [thinkingDots, setThinkingDots] = useState(0);
  const [lastRequest, setLastRequest] = useState<GenerateDiscussionQuestionsArgs | null>(null);

  const { width, height } = useWindowDimensions();
  const isLargeScreen = Math.max(width, height) >= 768;
  const presentationStyle =
    isLargeScreen && Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen';

  // Convex action reference
  const questionsActionReference = (
    api as unknown as Record<string, any>
  )['functions/generateDiscussionQuestions'].generateDiscussionQuestions as FunctionReference<
    'action',
    'public',
    GenerateDiscussionQuestionsArgs,
    GenerateDiscussionQuestionsResult
  >;

  const generateQuestionsAction = useAction(questionsActionReference);

  // Load sermons on component mount
  useEffect(() => {
    const loadSermons = async () => {
      setIsLoadingSermons(true);
      try {
        const sermons = await sermonRepository.list();
        setAvailableSermons(sermons);
      } catch (error) {
        console.error('Failed to load sermons:', error);
        Alert.alert('Error', 'Failed to load your sermons. Please try again.');
      } finally {
        setIsLoadingSermons(false);
      }
    };
    
    loadSermons();
  }, []);

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

  const handleSermonSelect = (sermon: SermonDTO) => {
    setSelectedSermon(sermon);
    setShowSermonDropdown(false);
    setModalError(null);
  };

  const closeResultModal = () => {
    if (isGenerating) {
      return;
    }
    setIsResultModalVisible(false);
  };

  const runQuestionGeneration = async (args: GenerateDiscussionQuestionsArgs) => {
    setIsGenerating(true);
    setQuestionsResult(null);
    setModalError(null);

    try {
      const response = await generateQuestionsAction(args);
      const html = response.html && response.html.trim().length > 0
        ? response.html
        : `<div>${response.questions}</div>`;
      setQuestionsResult({
        html,
        text: response.questions,
      });
    } catch (error) {
      console.error('Failed to generate discussion questions', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to generate discussion questions right now. Please try again.';
      setModalError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateQuestions = () => {
    if (inputMethod === 'topic-verse' && !sermonTopic.trim() && !bibleVerse.trim()) {
      Alert.alert('Missing Information', 'Please provide a sermon topic or Bible verse to generate discussion questions.');
      return;
    }
    
    if (inputMethod === 'transcription' && !selectedSermon) {
      Alert.alert('Missing Information', 'Please select a sermon to generate discussion questions.');
      return;
    }

    let args: GenerateDiscussionQuestionsArgs;

    if (inputMethod === 'topic-verse') {
      args = {
        input_type: 'topic_verse',
        content: `Topic: ${sermonTopic.trim()}, Bible Verse: ${bibleVerse.trim()}`,
        topic: sermonTopic.trim(),
        bible_verse: bibleVerse.trim(),
      };
    } else {
      args = {
        input_type: 'sermon',
        content: `Sermon Title: ${selectedSermon!.title}`,
        sermon_title: selectedSermon!.title,
        scripture_reference: selectedSermon!.scripture || '',
        sermon_content: selectedSermon!.content || '',
      };
    }

    setLastRequest(args);
    setIsResultModalVisible(true);
    void runQuestionGeneration(args);
  };

  const handleRegenerateQuestions = () => {
    if (!lastRequest) {
      return;
    }

    void runQuestionGeneration(lastRequest);
  };

  const handleCopyQuestions = async () => {
    if (!questionsResult) {
      return;
    }

    try {
      await Clipboard.setStringAsync(questionsResult.text);
      Alert.alert('Copied to Clipboard', 'The discussion questions have been copied to your clipboard.');
    } catch (error) {
      console.error('Failed to copy questions to clipboard', error);
      Alert.alert('Copy Failed', 'Unable to copy the questions. Please try again.');
    }
  };

  const animatedDots = '.'.repeat(thinkingDots);
  const disableGenerate = isGenerating || 
    (inputMethod === 'topic-verse' && !sermonTopic.trim() && !bibleVerse.trim()) || 
    (inputMethod === 'transcription' && !selectedSermon);

  const renderResultBody = (scrollStyle?: StyleProp<ViewStyle>) => (
    <>
      <View style={resultModalHeader}>
        <Text style={resultModalTitle}>Discussion Questions</Text>
        <Pressable
          style={[modalCloseButton, isGenerating && modalCloseButtonDisabled]}
          onPress={closeResultModal}
          disabled={isGenerating}
        >
          <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      {isGenerating && !questionsResult && !modalError ? (
        <View style={thinkingContainer}>
          <LoadingIndicator size="large" color={theme.colors.primary} />
          <Text style={thinkingText}>{`Creating Questions${animatedDots}`}</Text>
        </View>
      ) : null}

      {modalError ? (
        <View style={errorContainer}>
          <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
          <Text style={errorText}>{modalError}</Text>
        </View>
      ) : null}

      {questionsResult ? (
        <ScrollView
          style={[resultScroll, scrollStyle]}
          contentContainerStyle={resultScrollContent}
          showsVerticalScrollIndicator={true}
        >
          <RichHtml html={questionsResult.html} />
        </ScrollView>
      ) : null}

      <View style={resultButtonRow}>
        <Button
          title="Copy to Clipboard"
          onPress={handleCopyQuestions}
          variant="secondary"
          disabled={!questionsResult || isGenerating}
          style={resultButton}
        />
        <Button
          title={isGenerating ? 'Regenerating...' : 'Regenerate Questions'}
          onPress={handleRegenerateQuestions}
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
        <Text style={styles.headerTitle}>Discussion Questions</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tool Description */}
        <Card style={styles.descriptionCard}>
          <View style={styles.toolHeader}>
            <View style={styles.toolIcon}>
              <Ionicons name="help-circle" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>AI-Powered Discussion Questions</Text>
              <Text style={styles.toolDescription}>
                Generate thought-provoking questions for small groups
              </Text>
            </View>
          </View>
        </Card>

        {/* Input Method Selection */}
        <Card style={styles.sectionCard}>
          <Text style={styles.radioGroupTitle}>Input Method</Text>
          
          {/* Provide a topic or Bible verse */}
          <Pressable
            style={styles.radioOption}
            onPress={() => {
              setInputMethod('topic-verse');
              setSelectedSermon(null);
              setModalError(null);
            }}
          >
            <View style={styles.radioCircle}>
              {inputMethod === 'topic-verse' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioText}>Provide a topic or Bible verse</Text>
          </Pressable>

          {/* Provide a transcription of your sermon */}
          <Pressable
            style={styles.radioOption}
            onPress={() => {
              setInputMethod('transcription');
              setSermonTopic('');
              setBibleVerse('');
              setModalError(null);
            }}
          >
            <View style={styles.radioCircle}>
              {inputMethod === 'transcription' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.radioText}>Provide a transcription of your sermon</Text>
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
                placeholder="Enter your sermon topic..."
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
                placeholder="Enter Bible verse (e.g., Psalm 23:4)"
                placeholderTextColor={theme.colors.gray500}
                value={bibleVerse}
                onChangeText={setBibleVerse}
                multiline={false}
              />
            </Card>
          </>
        )}

        {/* Sermon Selection */}
        {inputMethod === 'transcription' && (
          <Card style={styles.inputCard}>
            <Text style={styles.inputLabel}>Select Sermon</Text>
            <Text style={styles.inputSubtext}>Choose a sermon to generate discussion questions from</Text>
            
            {isLoadingSermons ? (
              <View style={styles.loadingContainer}>
                <LoadingIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading your sermons...</Text>
              </View>
            ) : availableSermons.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="document-text-outline" size={48} color={theme.colors.gray400} />
                <Text style={styles.emptyStateText}>No sermons found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create your first sermon to get started
                </Text>
              </View>
            ) : (
              <Pressable
                style={styles.sermonDropdown}
                onPress={() => setShowSermonDropdown(true)}
              >
                <View style={styles.sermonDropdownContent}>
                  <View style={styles.sermonDropdownInfo}>
                    <Text style={styles.sermonDropdownText}>
                      {selectedSermon ? selectedSermon.title : 'Choose a sermon...'}
                    </Text>
                    {selectedSermon && (
                      <Text style={styles.sermonDropdownSubtext}>
                        {selectedSermon.scripture} • {selectedSermon.seriesTitle || 'No Series'}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-down" size={20} color={theme.colors.gray600} />
                </View>
              </Pressable>
            )}
          </Card>
        )}

        {/* Generate Button */}
        <Card style={styles.generateCard}>
          <Button
            title={isGenerating ? 'Generating Questions...' : 'Generate Bible Study Discussion Questions'}
            onPress={handleGenerateQuestions}
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
            <Text style={styles.tipItem}>• Provide your sermon topic or Bible verse</Text>
            <Text style={styles.tipItem}>• Or select one of your existing sermons</Text>
            <Text style={styles.tipItem}>• Our AI will generate thoughtful discussion questions</Text>
            <Text style={styles.tipItem}>• Questions designed to encourage group engagement</Text>
            <Text style={styles.tipItem}>• Use for small groups, Bible studies, and discipleship</Text>
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

      {/* Sermon Selection Modal */}
      <Modal
        visible={showSermonDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSermonDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Sermon</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowSermonDropdown(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </Pressable>
            </View>
            
            <ScrollView style={styles.sermonsList}>
              {availableSermons.map((sermon) => (
                <Pressable
                  key={sermon.id}
                  style={[
                    styles.sermonItem,
                    selectedSermon?.id === sermon.id && styles.sermonItemSelected
                  ]}
                  onPress={() => handleSermonSelect(sermon)}
                >
                  <View style={styles.sermonItemContent}>
                    <Text style={styles.sermonItemTitle}>{sermon.title}</Text>
                    <Text style={styles.sermonItemMeta}>
                      {sermon.scripture} • {sermon.seriesTitle || 'No Series'}
                    </Text>
                    <View style={styles.sermonItemTags}>
                      {(sermon.tags || []).slice(0, 3).map((tag, index) => (
                        <View key={index} style={styles.sermonTag}>
                          <Text style={styles.sermonTagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  {selectedSermon?.id === sermon.id && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
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

  // Loading and empty states
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  loadingText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  emptyStateText: {
    ...theme.typography.h6,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    ...theme.typography.body2,
    color: theme.colors.textTertiary,
    textAlign: 'center',
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

  // Sermon dropdown
  sermonDropdown: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
  },
  sermonDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  sermonDropdownInfo: {
    flex: 1,
  },
  sermonDropdownText: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  sermonDropdownSubtext: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
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
    maxHeight: '80%',
    overflow: 'hidden',
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
  sermonsList: {
    maxHeight: 400,
  },
  sermonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  sermonItemSelected: {
    backgroundColor: theme.colors.primary + '10',
  },
  sermonItemContent: {
    flex: 1,
  },
  sermonItemTitle: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  sermonItemMeta: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  sermonItemTags: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  sermonTag: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  sermonTagText: {
    ...theme.typography.overline,
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
});
