import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingIndicator } from '@/components/common/LoadingIndicator';
import { theme } from '@/constants/Theme';
import { Sermon } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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

export default function DiscussionQuestionsPage() {
  const [inputMethod, setInputMethod] = useState<'topic-verse' | 'transcription'>('topic-verse');
  const [sermonTopic, setSermonTopic] = useState('Marriage Struggles');
  const [bibleVerse, setBibleVerse] = useState('Psalm 23:4');
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);
  const [showSermonDropdown, setShowSermonDropdown] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleSermonSelect = (sermon: Sermon) => {
    setSelectedSermon(sermon);
    setShowSermonDropdown(false);
  };

  const handleGenerateQuestions = async () => {
    if (inputMethod === 'topic-verse' && !sermonTopic && !bibleVerse) {
      Alert.alert('Missing Information', 'Please provide a sermon topic or Bible verse to generate discussion questions.');
      return;
    }
    
    if (inputMethod === 'transcription' && !selectedSermon) {
      Alert.alert('Missing Information', 'Please select a sermon to generate discussion questions.');
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI processing
    setTimeout(() => {
      setIsGenerating(false);
      Alert.alert(
        'Questions Generated!',
        'Your Bible study discussion questions are ready. This feature will be fully implemented soon.',
        [{ text: 'OK' }]
      );
    }, 2000);
  };

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
                placeholder="Marriage Struggles"
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
          </>
        )}

        {/* Sermon Selection */}
        {inputMethod === 'transcription' && (
          <Card style={styles.inputCard}>
            <Text style={styles.inputLabel}>Select Sermon</Text>
            <Text style={styles.inputSubtext}>Choose a sermon to generate discussion questions from</Text>
            
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
                      {selectedSermon.scripture} • {selectedSermon.series}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-down" size={20} color={theme.colors.gray600} />
              </View>
            </Pressable>
          </Card>
        )}

        {/* Generate Button */}
        <Card style={styles.generateCard}>
          <Button
            title={isGenerating ? 'Generating Questions...' : 'Generate Bible Study Discussion Questions'}
            onPress={handleGenerateQuestions}
            variant="primary"
            disabled={isGenerating || (inputMethod === 'topic-verse' && !sermonTopic && !bibleVerse) || (inputMethod === 'transcription' && !selectedSermon)}
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
            <Text style={styles.tipItem}>• Our AI will generate thoughtful discussion questions</Text>
            <Text style={styles.tipItem}>• Questions designed to encourage group engagement</Text>
            <Text style={styles.tipItem}>• Use for small groups, Bible studies, and discipleship</Text>
          </View>
        </Card>
      </ScrollView>

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

