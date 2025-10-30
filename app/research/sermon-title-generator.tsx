import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { theme } from '@/constants/Theme';
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
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { sermonRepository } from '@/services/repositories/sermonRepository.native';
import type { SermonDTO } from '@/services/repositories/types';

type GenerateSermonTitlesArgs = {
  sermon_content: string;
  scripture_reference: string;
  current_title: string;
  tags: string[];
};

type GenerateSermonTitlesResult = {
  titles: string[];
  raw?: unknown;
};

export default function SermonTitleGeneratorPage() {
  const [availableSermons, setAvailableSermons] = useState<SermonDTO[]>([]);
  const [selectedSermon, setSelectedSermon] = useState<SermonDTO | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSermons, setIsLoadingSermons] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<GenerateSermonTitlesArgs | null>(null);

  // Convex action reference
  const generateTitlesAction = (
    api as unknown as Record<string, any>
  )['functions/generateSermonTitles'].generateSermonTitles as FunctionReference<
    'action',
    'public',
    GenerateSermonTitlesArgs,
    GenerateSermonTitlesResult
  >;

  const generateTitles = useAction(generateTitlesAction);

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

  const handleBack = () => {
    router.back();
  };

  const handleSermonSelect = (sermon: SermonDTO) => {
    setSelectedSermon(sermon);
    setShowDropdown(false);
    setShowSuggestions(false);
    setTitleSuggestions([]);
    setModalError(null);
  };

  const runTitleGeneration = async (args: GenerateSermonTitlesArgs) => {
    setIsGenerating(true);
    setTitleSuggestions([]);
    setModalError(null);

    try {
      const response = await generateTitles(args);
      const titles = response.titles || [];
      
      if (titles.length === 0) {
        throw new Error('No titles generated');
      }

      setTitleSuggestions(titles);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Failed to generate titles:', error);
      const message = error instanceof Error 
        ? error.message 
        : 'Unable to generate titles right now. Please try again.';
      setModalError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateTitles = () => {
    if (!selectedSermon) {
      Alert.alert('No Sermon Selected', 'Please select a sermon first to generate title suggestions.');
      return;
    }

    const args: GenerateSermonTitlesArgs = {
      sermon_content: selectedSermon.content || '',
      scripture_reference: selectedSermon.scripture || '',
      current_title: selectedSermon.title,
      tags: selectedSermon.tags || [],
    };

    setLastRequest(args);
    void runTitleGeneration(args);
  };

  const handleRegenerateTitles = () => {
    if (!lastRequest) {
      return;
    }

    void runTitleGeneration(lastRequest);
  };

  const handleCopyTitle = async (title: string) => {
    try {
      await Clipboard.setStringAsync(title);
      
      // Show success feedback
      Alert.alert(
        'Title Copied!',
        `&quot;${title}&quot; has been copied to your clipboard.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to copy title:', error);
      Alert.alert('Copy Failed', 'Unable to copy the title. Please try again.');
    }
  };

  const disableGenerate = isGenerating || !selectedSermon;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Sermon Title Generator</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tool Description */}
        <Card style={styles.descriptionCard}>
          <View style={styles.toolHeader}>
            <View style={styles.toolIcon}>
              <Ionicons name="bulb" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.toolInfo}>
              <Text style={styles.toolTitle}>AI-Powered Title Generator</Text>
              <Text style={styles.toolDescription}>
                Generate compelling sermon titles based on your existing content and themes
              </Text>
            </View>
          </View>
        </Card>

        {/* Sermon Selection */}
        <Card style={styles.selectionCard}>
          <Text style={styles.sectionTitle}>Select a Sermon</Text>
          <Text style={styles.sectionDescription}>
            Choose one of your existing sermons to generate new title suggestions
          </Text>
          
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
                Create your first sermon to get started with title generation
              </Text>
            </View>
          ) : (
            <Pressable
              style={styles.dropdownButton}
              onPress={() => setShowDropdown(true)}
            >
              <View style={styles.dropdownContent}>
                <View style={styles.dropdownInfo}>
                  <Text style={styles.dropdownText}>
                    {selectedSermon ? selectedSermon.title : 'Choose a sermon...'}
                  </Text>
                  {selectedSermon && (
                    <Text style={styles.dropdownSubtext}>
                      {selectedSermon.scripture} • {selectedSermon.seriesTitle}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-down" size={20} color={theme.colors.gray600} />
              </View>
            </Pressable>
          )}
        </Card>

        {/* Generate Button */}
        <Card style={styles.generateCard}>
          <Button
            title={isGenerating ? "Generating Suggestions..." : "Generate Sermon Title Suggestions"}
            onPress={handleGenerateTitles}
            variant="primary"
            disabled={disableGenerate}
            icon={
              isGenerating ? (
                <LoadingIndicator size="small" color={theme.colors.white} />
              ) : (
                <Ionicons name="sparkles" size={16} color={theme.colors.white} />
              )
            }
          />
          {!selectedSermon && !isLoadingSermons && (
            <Text style={styles.generateHint}>
              Select a sermon above to generate title suggestions
            </Text>
          )}
        </Card>

        {/* Error Display */}
        {modalError && (
          <Card style={styles.errorCard}>
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
              <Text style={styles.errorText}>{modalError}</Text>
            </View>
          </Card>
        )}

        {/* Title Suggestions */}
        {showSuggestions && titleSuggestions.length > 0 && (
          <Card style={styles.suggestionsCard}>
            <View style={styles.suggestionsHeader}>
              <Text style={styles.sectionTitle}>Generated Suggestions ({titleSuggestions.length})</Text>
              <Text style={styles.sectionDescription}>
                Tap any title to copy it to your clipboard
              </Text>
            </View>
            
            <View style={styles.suggestionsList}>
              {titleSuggestions.map((title, index) => (
                <Pressable
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleCopyTitle(title)}
                >
                  <View style={styles.suggestionContent}>
                    <View style={styles.suggestionNumber}>
                      <Text style={styles.suggestionNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.suggestionTitle}>{title}</Text>
                    <Ionicons name="copy-outline" size={16} color={theme.colors.gray600} />
                  </View>
                </Pressable>
              ))}
            </View>
            
            <View style={styles.suggestionsFooter}>
              <Button
                title={isGenerating ? 'Generating More...' : 'Generate More Suggestions'}
                onPress={handleRegenerateTitles}
                variant="outline"
                size="sm"
                disabled={!lastRequest || isGenerating}
                icon={<Ionicons name="refresh" size={16} color={theme.colors.primary} />}
              />
            </View>
          </Card>
        )}

        {/* Tips Card */}
        <Card style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="lightbulb" size={20} color={theme.colors.primary} />
            <Text style={styles.tipsTitle}>Title Writing Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>• Keep titles clear and compelling</Text>
            <Text style={styles.tipItem}>• Include emotional or action words</Text>
            <Text style={styles.tipItem}>• Reference the main scripture or theme</Text>
            <Text style={styles.tipItem}>• Make it memorable and easy to share</Text>
            <Text style={styles.tipItem}>• Consider your audience's needs</Text>
          </View>
        </Card>
      </ScrollView>

      {/* Sermon Selection Modal */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Sermon</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowDropdown(false)}
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

  // Selection card
  selectionCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  sectionDescription: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
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
  dropdownButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  dropdownInfo: {
    flex: 1,
  },
  dropdownText: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  dropdownSubtext: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // Generate card
  generateCard: {
    marginBottom: theme.spacing.md,
  },
  generateHint: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },

  // Error card
  errorCard: {
    marginBottom: theme.spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  errorText: {
    ...theme.typography.body2,
    color: theme.colors.error,
    flex: 1,
  },

  // Suggestions card
  suggestionsCard: {
    marginBottom: theme.spacing.md,
  },
  suggestionsHeader: {
    marginBottom: theme.spacing.md,
  },
  suggestionsList: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  suggestionItem: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  suggestionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionNumberText: {
    ...theme.typography.caption,
    color: theme.colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
  suggestionTitle: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: theme.spacing.sm,
    lineHeight: 22,
  },
  suggestionsFooter: {
    alignItems: 'center',
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
  modalCloseButton: {
    padding: theme.spacing.xs,
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
