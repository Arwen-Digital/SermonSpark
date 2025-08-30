import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { theme } from '@/constants/Theme';
import { Sermon } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// Mock sermon data - in real app this would come from global state
const mockSermons: Sermon[] = [
  {
    id: '1',
    title: 'The Good Shepherd',
    content: 'Jesus said, "I am the good shepherd. The good shepherd lays down his life for the sheep." In this passage from John 10:11, we see a beautiful picture of Christ\'s sacrificial love...',
    outline: '1. The Shepherd\'s Heart\n2. The Shepherd\'s Sacrifice\n3. The Shepherd\'s Call',
    scripture: 'John 10:11-16',
    tags: ['Jesus', 'Love', 'Sacrifice', 'Shepherd'],
    series: 'I Am Statements',
    date: new Date('2024-01-15'),
    lastModified: new Date('2024-01-20'),
    wordCount: 2800,
    readingTime: 18,
    isArchived: false,
    isFavorite: true,
    notes: 'Focus on the personal nature of Christ\'s care for each believer.',
  },
  {
    id: '2',
    title: 'Walking in Faith',
    content: 'Faith is not just a feeling, but a way of living. In Hebrews 11, we see examples of men and women who lived by faith...',
    scripture: 'Hebrews 11:1-6',
    tags: ['Faith', 'Trust', 'Obedience'],
    series: 'Living by Faith',
    date: new Date('2024-01-08'),
    lastModified: new Date('2024-01-10'),
    wordCount: 2200,
    readingTime: 14,
    isArchived: false,
    isFavorite: false,
    notes: 'Include personal testimonies about faith.',
  },
  {
    id: '3',
    title: 'The Power of Prayer',
    content: 'Prayer is our direct line of communication with God. Through prayer, we can experience His presence and power...',
    scripture: 'Matthew 6:5-15',
    tags: ['Prayer', 'Communication', 'God'],
    series: 'Spiritual Disciplines',
    date: new Date('2024-01-01'),
    lastModified: new Date('2024-01-05'),
    wordCount: 1900,
    readingTime: 12,
    isArchived: false,
    isFavorite: true,
    notes: 'Emphasize the importance of consistent prayer life.',
  },
];

// Mock title suggestions based on sermon content
const generateTitleSuggestions = (sermon: Sermon): string[] => {
  const suggestions = [];
  
  // Base suggestions on content themes
  if (sermon.content.toLowerCase().includes('shepherd')) {
    suggestions.push(
      'Our Great Shepherd: Finding Comfort in Christ\'s Care',
      'The Shepherd\'s Voice: Learning to Follow Jesus',
      'Safe in the Shepherd\'s Arms',
      'When the Shepherd Leads: Trusting God\'s Direction'
    );
  } else if (sermon.content.toLowerCase().includes('faith')) {
    suggestions.push(
      'Faith That Moves Mountains: Living with Unwavering Trust',
      'Walking by Faith, Not by Sight',
      'The Faith Journey: Steps of Trust and Obedience',
      'Faith in Action: Living Out Our Beliefs'
    );
  } else if (sermon.content.toLowerCase().includes('prayer')) {
    suggestions.push(
      'The Prayer Life That Changes Everything',
      'Unlocking Heaven\'s Power Through Prayer',
      'Prayer: Your Direct Line to the Divine',
      'The Secret Place: Discovering Intimate Prayer'
    );
  } else {
    // Generic suggestions based on scripture or tags
    suggestions.push(
      `Discovering Truth in ${sermon.scripture}`,
      `Life Lessons from ${sermon.scripture}`,
      `God\'s Message Through ${sermon.scripture}`,
      `Biblical Wisdom from ${sermon.scripture}`
    );
  }

  // Add creative variations
  const creativeSuggestions = [
    `${sermon.tags[0]}: A Biblical Perspective`,
    `Finding Hope Through ${sermon.tags[0]}`,
    `The Heart of ${sermon.tags[0]}: God\'s Design`,
    `Living in ${sermon.tags[0]}: Practical Applications`
  ];

  suggestions.push(...creativeSuggestions);

  // Return 8 unique suggestions
  return [...new Set(suggestions)].slice(0, 8);
};

export default function SermonTitleGeneratorPage() {
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleSermonSelect = (sermon: Sermon) => {
    setSelectedSermon(sermon);
    setShowDropdown(false);
    setShowSuggestions(false);
    setTitleSuggestions([]);
  };

  const handleGenerateTitles = () => {
    if (!selectedSermon) {
      Alert.alert('No Sermon Selected', 'Please select a sermon first to generate title suggestions.');
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI processing time
    setTimeout(() => {
      const suggestions = generateTitleSuggestions(selectedSermon);
      setTitleSuggestions(suggestions);
      setIsGenerating(false);
      setShowSuggestions(true);
    }, 2000);
  };

  const handleUseTitleSuggestion = (title: string) => {
    Alert.alert(
      'Use This Title?',
      `Apply "${title}" as the title for "${selectedSermon?.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply', 
          onPress: () => {
            // In real app, this would update the sermon title
            Alert.alert('Title Applied!', 'The new title has been applied to your sermon.');
            router.back();
          }
        }
      ]
    );
  };

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
                    {selectedSermon.scripture} • {selectedSermon.series}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color={theme.colors.gray600} />
            </View>
          </Pressable>
        </Card>

        {/* Generate Button */}
        <Card style={styles.generateCard}>
          <Button
            title={isGenerating ? "Generating Suggestions..." : "Generate Sermon Title Suggestions"}
            onPress={handleGenerateTitles}
            variant="primary"
            disabled={!selectedSermon || isGenerating}
            icon={
              isGenerating ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Ionicons name="sparkles" size={16} color={theme.colors.white} />
              )
            }
          />
          {!selectedSermon && (
            <Text style={styles.generateHint}>
              Select a sermon above to generate title suggestions
            </Text>
          )}
        </Card>

        {/* Title Suggestions */}
        {showSuggestions && titleSuggestions.length > 0 && (
          <Card style={styles.suggestionsCard}>
            <View style={styles.suggestionsHeader}>
              <Text style={styles.sectionTitle}>Generated Suggestions</Text>
              <Text style={styles.sectionDescription}>
                Tap any title to apply it to your sermon
              </Text>
            </View>
            
            <View style={styles.suggestionsList}>
              {titleSuggestions.map((title, index) => (
                <Pressable
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleUseTitleSuggestion(title)}
                >
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionTitle}>{title}</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.gray600} />
                  </View>
                </Pressable>
              ))}
            </View>
            
            <View style={styles.suggestionsFooter}>
              <Button
                title="Generate More Suggestions"
                onPress={handleGenerateTitles}
                variant="outline"
                size="sm"
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
              {mockSermons.map((sermon) => (
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
                      {sermon.scripture} • {sermon.series}
                    </Text>
                    <View style={styles.sermonItemTags}>
                      {sermon.tags.slice(0, 3).map((tag, index) => (
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
    justifyContent: 'space-between',
    padding: theme.spacing.md,
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