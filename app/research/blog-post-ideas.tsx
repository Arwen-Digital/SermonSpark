import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { RichHtml } from '@/components/common/RichHtml';
import { theme } from '@/constants/Theme';
import { api } from '@/convex/_generated/api';
import { sermonRepository } from '@/services/repositories/sermonRepository.native';
import type { SermonDTO } from '@/services/repositories/types';
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

type GenerateBlogPostIdeasArgs = {
  input_type: 'sermon' | 'topic_verse';
  content: string;
  sermon_title?: string;
  scripture_reference?: string;
  sermon_content?: string;
  topic?: string;
  bible_verse?: string;
};

type GenerateBlogPostIdeasResult = {
  ideas: string;
  html?: string;
  raw?: unknown;
};

type BlogPostIdeasContent = {
  html: string;
  text: string;
};

export default function BlogPostIdeasPage() {
  const [inputMethod, setInputMethod] = useState<'topic-verse' | 'transcription'>('topic-verse');
  const [sermonTopic, setSermonTopic] = useState('');
  const [bibleVerse, setBibleVerse] = useState('');
  const [availableSermons, setAvailableSermons] = useState<SermonDTO[]>([]);
  const [selectedSermon, setSelectedSermon] = useState<SermonDTO | null>(null);
  const [showSermonDropdown, setShowSermonDropdown] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSermons, setIsLoadingSermons] = useState(false);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [ideasResult, setIdeasResult] = useState<BlogPostIdeasContent | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [thinkingDots, setThinkingDots] = useState(0);
  const [lastRequest, setLastRequest] = useState<GenerateBlogPostIdeasArgs | null>(null);

  const { width, height } = useWindowDimensions();
  const isLargeScreen = Math.max(width, height) >= 768;
  const presentationStyle =
    isLargeScreen && Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen';

  // Convex action reference
  const ideasActionReference = (
    api as unknown as Record<string, any>
  )['functions/generateBlogPostIdeas'].generateBlogPostIdeas as FunctionReference<
    'action',
    'public',
    GenerateBlogPostIdeasArgs,
    GenerateBlogPostIdeasResult
  >;

  const generateIdeasAction = useAction(ideasActionReference);

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

  const runIdeasGeneration = async (args: GenerateBlogPostIdeasArgs) => {
    setIsGenerating(true);
    setIdeasResult(null);
    setModalError(null);

    try {
      const response = await generateIdeasAction(args);
      const html = response.html && response.html.trim().length > 0
        ? response.html
        : `<div>${response.ideas}</div>`;
      setIdeasResult({
        html,
        text: response.ideas,
      });
    } catch (error) {
      console.error('Failed to generate blog post ideas', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to generate blog post ideas right now. Please try again.';
      setModalError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateBlogPostIdeas = () => {
    if (inputMethod === 'topic-verse' && !sermonTopic.trim() && !bibleVerse.trim()) {
      Alert.alert('Missing Information', 'Please provide a sermon topic or Bible verse to generate blog post ideas.');
      return;
    }
    
    if (inputMethod === 'transcription' && !selectedSermon) {
      Alert.alert('Missing Information', 'Please select a sermon to generate blog post ideas.');
      return;
    }

    let args: GenerateBlogPostIdeasArgs;

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
    void runIdeasGeneration(args);
  };

  const handleRegenerateIdeas = () => {
    if (!lastRequest) {
      return;
    }

    void runIdeasGeneration(lastRequest);
  };

  const handleCopyIdeas = async () => {
    if (!ideasResult) {
      return;
    }

    try {
      await Clipboard.setStringAsync(ideasResult.text);
      Alert.alert('Copied to Clipboard', 'The blog post ideas have been copied to your clipboard.');
    } catch (error) {
      console.error('Failed to copy ideas to clipboard', error);
      Alert.alert('Copy Failed', 'Unable to copy the ideas. Please try again.');
    }
  };

  const animatedDots = '.'.repeat(thinkingDots);
  const disableGenerate = isGenerating || 
    (inputMethod === 'topic-verse' && !sermonTopic.trim() && !bibleVerse.trim()) || 
    (inputMethod === 'transcription' && !selectedSermon);

  const renderResultBody = (scrollStyle?: StyleProp<ViewStyle>) => (
    <>
      <View style={styles.resultModalHeader}>
        <Text style={styles.resultModalTitle}>Blog Post Ideas</Text>
        <Pressable
          style={[styles.modalCloseButton, isGenerating && styles.modalCloseButtonDisabled]}
          onPress={closeResultModal}
          disabled={isGenerating}
        >
          <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      {isGenerating && !ideasResult && !modalError ? (
        <View style={styles.thinkingContainer}>
          <LoadingIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.thinkingText}>{`Creating Blog Ideas${animatedDots}`}</Text>
        </View>
      ) : null}

      {modalError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
          <Text style={styles.errorText}>{modalError}</Text>
        </View>
      ) : null}

      {ideasResult ? (
        <ScrollView
          style={[styles.resultScroll, scrollStyle]}
          contentContainerStyle={styles.resultScrollContent}
          showsVerticalScrollIndicator={true}
        >
          <RichHtml html={ideasResult.html} />
        </ScrollView>
      ) : null}

      <View style={styles.resultButtonRow}>
        <Button
          title="Copy to Clipboard"
          onPress={handleCopyIdeas}
          variant="secondary"
          disabled={!ideasResult || isGenerating}
          style={styles.resultButton}
        />
        <Button
          title={isGenerating ? 'Regenerating...' : 'Regenerate Ideas'}
          onPress={handleRegenerateIdeas}
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
        <Text style={styles.headerTitle}>Blog Post Ideas</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tool Description */}
        <Card style={styles.descriptionCard}>
          <View style={styles.toolHeader}>
            <View style={styles.toolIcon}>
              <Ionicons name="document-text" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>Blog Posts Research</Text>
              <Text style={styles.toolDescription}>
                Generate compelling blog post content from your sermons
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
            <Text style={styles.inputSubtext}>Choose a sermon to generate blog post ideas from</Text>
            
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
            title={isGenerating ? 'Generating Blog Ideas...' : 'Generate Blog Post Ideas'}
            onPress={handleGenerateBlogPostIdeas}
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
            <Text style={styles.tipItem}>• Our AI will generate compelling blog post ideas</Text>
            <Text style={styles.tipItem}>• Blog posts optimized for engagement and SEO</Text>
            <Text style={styles.tipItem}>• Use for your church website, personal blog, and more</Text>
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
