import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { RichTextEditor } from './RichTextEditor';
import { theme } from '@/constants/Theme';
import { Sermon } from '@/types';

interface SermonEditorProps {
  sermon?: Sermon;
  onSave: (sermon: Partial<Sermon>) => void;
  onCancel: () => void;
}

export const SermonEditor: React.FC<SermonEditorProps> = ({
  sermon,
  onSave,
  onCancel,
}) => {
  const [title, setTitle] = useState(sermon?.title || '');
  const [content, setContent] = useState(sermon?.content || '');
  const [outline, setOutline] = useState(sermon?.outline || '');
  const [scripture, setScripture] = useState(sermon?.scripture || '');
  const [tags, setTags] = useState<string[]>(sermon?.tags || []);
  const [series, setSeries] = useState(sermon?.series || '');
  const [notes, setNotes] = useState(sermon?.notes || '');
  const [currentTab, setCurrentTab] = useState<'content' | 'outline' | 'notes'>('content');
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save timer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasUnsavedChanges && (title || content)) {
        handleAutoSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(timer);
  }, [title, content, outline, hasUnsavedChanges]);

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [title, content, outline, scripture, tags, series, notes]);

  const handleAutoSave = () => {
    const sermonData = {
      id: sermon?.id,
      title: title || 'Untitled Sermon',
      content,
      outline,
      scripture,
      tags,
      series,
      notes,
      lastModified: new Date(),
      wordCount: content.trim().split(/\s+/).filter(word => word.length > 0).length,
      readingTime: Math.ceil(content.trim().split(/\s+/).filter(word => word.length > 0).length / 150),
    };
    
    // In a real app, this would save to local storage or sync with backend
    console.log('Auto-saving sermon:', sermonData);
    setHasUnsavedChanges(false);
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your sermon');
      return;
    }

    const sermonData = {
      id: sermon?.id,
      title: title.trim(),
      content,
      outline,
      scripture,
      tags,
      series,
      notes,
      date: sermon?.date || new Date(),
      lastModified: new Date(),
      wordCount: content.trim().split(/\s+/).filter(word => word.length > 0).length,
      readingTime: Math.ceil(content.trim().split(/\s+/).filter(word => word.length > 0).length / 150),
      isArchived: sermon?.isArchived || false,
      isFavorite: sermon?.isFavorite || false,
    };

    onSave(sermonData);
    setHasUnsavedChanges(false);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to cancel?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard Changes', style: 'destructive', onPress: onCancel },
        ]
      );
    } else {
      onCancel();
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable onPress={handleCancel} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {sermon ? 'Edit Sermon' : 'New Sermon'}
        </Text>
      </View>
      
      <View style={styles.headerRight}>
        <Pressable
          onPress={() => setShowMetaModal(true)}
          style={styles.headerButton}
        >
          <Ionicons name="information-circle-outline" size={24} color={theme.colors.textSecondary} />
        </Pressable>
        
        <Button
          title="Save"
          onPress={handleSave}
          variant="primary"
          size="sm"
        />
      </View>
    </View>
  );

  const renderTitleInput = () => (
    <View style={styles.titleContainer}>
      <TextInput
        style={styles.titleInput}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter sermon title..."
        placeholderTextColor={theme.colors.textTertiary}
        multiline
        textAlignVertical="top"
      />
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <Pressable
        style={[styles.tab, currentTab === 'content' && styles.tabActive]}
        onPress={() => setCurrentTab('content')}
      >
        <Ionicons
          name="document-text"
          size={16}
          color={currentTab === 'content' ? theme.colors.primary : theme.colors.gray600}
        />
        <Text
          style={[
            styles.tabText,
            currentTab === 'content' && styles.tabTextActive,
          ]}
        >
          Content
        </Text>
      </Pressable>
      
      <Pressable
        style={[styles.tab, currentTab === 'outline' && styles.tabActive]}
        onPress={() => setCurrentTab('outline')}
      >
        <Ionicons
          name="list"
          size={16}
          color={currentTab === 'outline' ? theme.colors.primary : theme.colors.gray600}
        />
        <Text
          style={[
            styles.tabText,
            currentTab === 'outline' && styles.tabTextActive,
          ]}
        >
          Outline
        </Text>
      </Pressable>
      
      <Pressable
        style={[styles.tab, currentTab === 'notes' && styles.tabActive]}
        onPress={() => setCurrentTab('notes')}
      >
        <Ionicons
          name="create"
          size={16}
          color={currentTab === 'notes' ? theme.colors.primary : theme.colors.gray600}
        />
        <Text
          style={[
            styles.tabText,
            currentTab === 'notes' && styles.tabTextActive,
          ]}
        >
          Notes
        </Text>
      </Pressable>
    </View>
  );

  const renderContent = () => {
    switch (currentTab) {
      case 'content':
        return (
          <RichTextEditor
            content={content}
            onContentChange={setContent}
            placeholder="Start writing your sermon content..."
          />
        );
      
      case 'outline':
        return (
          <View style={styles.simpleEditorContainer}>
            <TextInput
              style={styles.simpleEditor}
              value={outline}
              onChangeText={setOutline}
              placeholder={`Create your sermon outline...

Example:
I. Introduction
   A. Opening illustration
   B. Hook and context

II. Main Point 1
   A. Scripture reference
   B. Explanation
   C. Application

III. Main Point 2
   A. Supporting verse
   B. Modern example
   C. Personal challenge

IV. Conclusion
   A. Summary
   B. Call to action`}
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              textAlignVertical="top"
            />
          </View>
        );
      
      case 'notes':
        return (
          <View style={styles.simpleEditorContainer}>
            <TextInput
              style={styles.simpleEditor}
              value={notes}
              onChangeText={setNotes}
              placeholder={`Add your sermon notes and reminders...

• Timing notes
• Delivery reminders  
• Personal stories to include
• Prayer requests to mention
• Technical setup notes
• Follow-up actions`}
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              textAlignVertical="top"
            />
          </View>
        );
      
      default:
        return null;
    }
  };

  const renderMetaModal = () => (
    <Modal
      visible={showMetaModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Sermon Details</Text>
          <Pressable
            onPress={() => setShowMetaModal(false)}
            style={styles.modalCloseButton}
          >
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </Pressable>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Scripture Reference</Text>
            <TextInput
              style={styles.formInput}
              value={scripture}
              onChangeText={setScripture}
              placeholder="e.g., John 3:16-21"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Series</Text>
            <TextInput
              style={styles.formInput}
              value={series}
              onChangeText={setSeries}
              placeholder="e.g., Gospel of John"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Tags</Text>
            <View style={styles.tagsInputContainer}>
              <TextInput
                style={styles.tagInput}
                value={newTag}
                onChangeText={setNewTag}
                placeholder="Add a tag..."
                placeholderTextColor={theme.colors.textTertiary}
                onSubmitEditing={addTag}
                returnKeyType="done"
              />
              <Button
                title="Add"
                onPress={addTag}
                variant="outline"
                size="sm"
              />
            </View>
            
            <View style={styles.tagsContainer}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <Pressable
                    onPress={() => removeTag(tag)}
                    style={styles.tagRemove}
                  >
                    <Ionicons name="close" size={14} color={theme.colors.textSecondary} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.modalFooter}>
          <Button
            title="Done"
            onPress={() => setShowMetaModal(false)}
            variant="primary"
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTitleInput()}
      {renderTabs()}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
      {renderMetaModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
    backgroundColor: theme.colors.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
  },
  titleContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  titleInput: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: theme.spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    ...theme.typography.body2,
    color: theme.colors.gray600,
    fontWeight: '500',
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  contentContainer: {
    flex: 1,
  },
  simpleEditorContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  simpleEditor: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    lineHeight: 24,
    textAlignVertical: 'top',
    flex: 1,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  modalTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  modalFooter: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray200,
  },
  formSection: {
    marginBottom: theme.spacing.lg,
  },
  formLabel: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  formInput: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
  },
  tagsInputContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  tagInput: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  tagText: {
    ...theme.typography.body2,
    color: theme.colors.primary,
  },
  tagRemove: {
    padding: 2,
  },
});