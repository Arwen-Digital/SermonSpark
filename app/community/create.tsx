import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { theme } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';


const SUGGESTED_TAGS = [
  'Preaching', 'Teaching', 'Illustration', 'Youth Ministry', 'Worship', 'Leadership',
  'Prayer', 'Bible Study', 'Evangelism', 'Discipleship', 'Church Growth', 'Pastoral Care',
  'Theology', 'Scripture', 'Community', 'Outreach', 'Small Groups', 'Children Ministry'
];

export default function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    if (title.trim() || content.trim()) {
      Alert.alert(
        'Discard Post?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleAddTag = (tag: string) => {
    if (!tags.includes(tag) && tags.length < 5) {
      setTags(prev => [...prev, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim()) && tags.length < 5) {
      setTags(prev => [...prev, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleCreatePost = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your post.');
      return;
    }
    
    if (!content.trim()) {
      Alert.alert('Missing Content', 'Please enter some content for your post.');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const newPost = {
        id: Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        tags,
        visibility: 'community', // Default to community visibility
        author: 'Current User', // This would come from auth context
        createdAt: new Date(),
      };
      
      console.log('Creating new post:', newPost);
      
      setLoading(false);
      
      Alert.alert(
        'Post Created!',
        'Your post has been successfully created and shared with the community.',
        [
          { text: 'OK', onPress: () => router.back() }
        ]
      );
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>New Post</Text>
          <Pressable
            style={[
              styles.createButton,
              (!title.trim() || !content.trim()) && styles.createButtonDisabled
            ]}
            onPress={handleCreatePost}
            disabled={!title.trim() || !content.trim() || loading}
          >
            <Text style={[
              styles.createButtonText,
              (!title.trim() || !content.trim()) && styles.createButtonTextDisabled
            ]}>
              {loading ? 'Creating...' : 'Post'}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Author Info */}
          <Card style={styles.authorCard}>
            <View style={styles.authorInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={theme.colors.gray600} />
              </View>
              <View>
                <Text style={styles.authorName}>Posting as Pastor Arnold</Text>
                <Text style={styles.authorMeta}>Lead Pastor at Grace Church</Text>
              </View>
            </View>
          </Card>

          {/* Title Input */}
          <Card style={styles.inputCard}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="What would you like to discuss?"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              multiline
            />
            <Text style={styles.characterCount}>{title.length}/100</Text>
          </Card>

          {/* Content Input */}
          <Card style={styles.inputCard}>
            <Text style={styles.inputLabel}>Content</Text>
            <TextInput
              style={styles.contentInput}
              placeholder="Share your thoughts, ask questions, or start a discussion..."
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>{content.length} characters</Text>
          </Card>

          {/* Tags Section */}
          <Card style={styles.inputCard}>
            <Text style={styles.inputLabel}>Tags</Text>
            <Text style={styles.inputDescription}>
              Add up to 5 tags to help others find your post
            </Text>
            
            {/* Selected Tags */}
            {tags.length > 0 && (
              <View style={styles.selectedTags}>
                {tags.map((tag, index) => (
                  <View key={index} style={styles.selectedTag}>
                    <Text style={styles.selectedTagText}>#{tag}</Text>
                    <Pressable
                      onPress={() => handleRemoveTag(tag)}
                      style={styles.removeTagButton}
                    >
                      <Ionicons name="close" size={14} color={theme.colors.gray600} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Custom Tag Input */}
            {tags.length < 5 && (
              <View style={styles.customTagContainer}>
                <TextInput
                  style={styles.customTagInput}
                  placeholder="Add custom tag..."
                  value={customTag}
                  onChangeText={setCustomTag}
                  onSubmitEditing={handleAddCustomTag}
                  maxLength={20}
                />
                <Pressable
                  style={[
                    styles.addTagButton,
                    !customTag.trim() && styles.addTagButtonDisabled
                  ]}
                  onPress={handleAddCustomTag}
                  disabled={!customTag.trim()}
                >
                  <Ionicons name="add" size={16} color={theme.colors.white} />
                </Pressable>
              </View>
            )}

            {/* Suggested Tags */}
            {tags.length < 5 && (
              <View style={styles.suggestedTagsSection}>
                <Text style={styles.suggestedTagsTitle}>Suggested Tags</Text>
                <View style={styles.suggestedTags}>
                  {SUGGESTED_TAGS.filter(tag => !tags.includes(tag)).slice(0, 8).map((tag, index) => (
                    <Pressable
                      key={index}
                      style={styles.suggestedTag}
                      onPress={() => handleAddTag(tag)}
                    >
                      <Text style={styles.suggestedTagText}>#{tag}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </Card>


          {/* Guidelines */}
          <Card style={styles.guidelinesCard}>
            <View style={styles.guidelinesHeader}>
              <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
              <Text style={styles.guidelinesTitle}>Community Guidelines</Text>
            </View>
            <View style={styles.guidelinesList}>
              <Text style={styles.guidelineItem}>• Be respectful and constructive</Text>
              <Text style={styles.guidelineItem}>• Stay on topic and relevant to ministry</Text>
              <Text style={styles.guidelineItem}>• Share wisdom and encourage others</Text>
              <Text style={styles.guidelineItem}>• Avoid controversial or divisive content</Text>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
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
  createButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  createButtonDisabled: {
    backgroundColor: theme.colors.gray400,
  },
  createButtonText: {
    ...theme.typography.body1,
    color: theme.colors.white,
    fontWeight: '600',
  },
  createButtonTextDisabled: {
    color: theme.colors.gray600,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  
  // Author card
  authorCard: {
    marginBottom: theme.spacing.md,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  authorMeta: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },

  // Input cards
  inputCard: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  inputDescription: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  titleInput: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  contentInput: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.xs,
  },
  characterCount: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textAlign: 'right',
  },

  // Tags
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.xs,
    paddingLeft: theme.spacing.sm,
    paddingRight: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  selectedTagText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  removeTagButton: {
    padding: 2,
  },
  customTagContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  customTagInput: {
    flex: 1,
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  addTagButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagButtonDisabled: {
    backgroundColor: theme.colors.gray400,
  },
  suggestedTagsSection: {
    marginTop: theme.spacing.sm,
  },
  suggestedTagsTitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },
  suggestedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  suggestedTag: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  suggestedTagText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },


  // Guidelines
  guidelinesCard: {
    marginBottom: theme.spacing.xxl,
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  guidelinesTitle: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  guidelinesList: {
    gap: theme.spacing.xs,
  },
  guidelineItem: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});