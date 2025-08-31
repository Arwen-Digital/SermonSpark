import { theme } from '@/constants/Theme';
import { mockSermonSeries } from '@/data/mockData';
import { Sermon } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../common/Button';
import { WysiwygEditor } from './WysiwygEditor';

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
  const [seriesId, setSeriesId] = useState(sermon?.seriesId || '');
  const [notes, setNotes] = useState(sermon?.notes || '');
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [currentTab, setCurrentTab] = useState<'content' | 'outline' | 'notes' | 'details'>('content');
  const [newTag, setNewTag] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [textSelection, setTextSelection] = useState({ start: 0, end: 0 });

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
  }, [title, content, outline, scripture, tags, seriesId, notes]);

  const handleAutoSave = () => {
    const sermonData = {
      id: sermon?.id,
      title: title || 'Untitled Sermon',
      content,
      outline,
      scripture,
      tags,
      seriesId,
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
      seriesId,
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

  const insertFormatting = (before: string, after: string) => {
    const { start, end } = textSelection;
    const selectedText = content.substring(start, end);
    
    let newContent;
    if (selectedText) {
      // Wrap selected text
      newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
    } else {
      // Insert at cursor position or append
      const insertPosition = start > 0 ? start : content.length;
      newContent = content.substring(0, insertPosition) + before + after + content.substring(insertPosition);
    }
    
    setContent(newContent);
  };

  const handleSelectionChange = (event: any) => {
    const { start, end } = event.nativeEvent.selection;
    setTextSelection({ start, end });
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
          size={14}
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
          size={14}
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
          size={14}
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
      
      <Pressable
        style={[styles.tab, currentTab === 'details' && styles.tabActive]}
        onPress={() => setCurrentTab('details')}
      >
        <Ionicons
          name="information-circle"
          size={14}
          color={currentTab === 'details' ? theme.colors.primary : theme.colors.gray600}
        />
        <Text
          style={[
            styles.tabText,
            currentTab === 'details' && styles.tabTextActive,
          ]}
        >
          Details
        </Text>
      </Pressable>
    </View>
  );

  const renderContent = () => {
    switch (currentTab) {
      case 'content':
        return (
          <View style={styles.contentEditorContainer}>
            <View style={styles.formattingToolbar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.toolbarButtons}>
                  <Pressable style={styles.toolbarButton} onPress={() => insertFormatting('**', '**')}>
                    <Text style={styles.boldButtonText}>B</Text>
                  </Pressable>
                  <Pressable style={styles.toolbarButton} onPress={() => insertFormatting('*', '*')}>
                    <Text style={styles.italicButtonText}>I</Text>
                  </Pressable>
                  <Pressable style={styles.toolbarButton} onPress={() => insertFormatting('## ', '')}>
                    <Text style={styles.headingButtonText}>H2</Text>
                  </Pressable>
                  <Pressable style={styles.toolbarButton} onPress={() => insertFormatting('### ', '')}>
                    <Text style={styles.headingButtonText}>H3</Text>
                  </Pressable>
                  <View style={styles.toolbarSeparator} />
                  <Pressable style={styles.toolbarButton} onPress={() => insertFormatting('- ', '')}>
                    <Ionicons name="list" size={16} color={theme.colors.textPrimary} />
                  </Pressable>
                  <Pressable style={styles.toolbarButton} onPress={() => insertFormatting('1. ', '')}>
                    <Ionicons name="list-outline" size={16} color={theme.colors.textPrimary} />
                  </Pressable>
                  <Pressable style={styles.toolbarButton} onPress={() => insertFormatting('> ', '')}>
                    <Ionicons name="chatbox-outline" size={16} color={theme.colors.textPrimary} />
                  </Pressable>
                  <View style={styles.toolbarSeparator} />
                  <Pressable style={styles.toolbarButton} onPress={() => insertFormatting('==', '==')}>
                    <Ionicons name="color-fill" size={16} color={theme.colors.warning} />
                  </Pressable>
                </View>
              </ScrollView>
            </View>
            <WysiwygEditor
              style={styles.contentTextInput}
              value={content}
              onChangeText={setContent}
              onSelectionChange={handleSelectionChange}
              placeholder="Start writing your sermon content...

Use the formatting buttons above or type directly:
• **bold text** for bold
• *italic text* for italics  
• ## Heading for large headings
• ### Subheading for smaller headings
• - List item for bullet points
• 1. List item for numbered lists
• > Quote for blockquotes
• ==highlight== for highlighting"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>
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
      
      case 'details':
        return (
          <ScrollView style={styles.detailsContainer}>
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
              <Pressable
                style={styles.seriesSelector}
                onPress={() => {
                  setShowSeriesModal(true);
                }}
              >
                <View style={styles.seriesSelectorContent}>
                  <View style={styles.seriesSelectorText}>
                    {seriesId ? (
                      <>
                        <View 
                          style={[
                            styles.seriesColorIndicator, 
                            { backgroundColor: mockSermonSeries.find(s => s.id === seriesId)?.color || theme.colors.primary }
                          ]} 
                        />
                        <Text style={styles.selectedSeriesTitle}>
                          {mockSermonSeries.find(s => s.id === seriesId)?.title || 'Unknown Series'}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.seriesPlaceholder}>Select a series...</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.gray500} />
                </View>
              </Pressable>
              {seriesId && (
                <Pressable
                  style={styles.clearSeriesButton}
                  onPress={() => setSeriesId('')}
                >
                  <Ionicons name="close-circle" size={16} color={theme.colors.gray500} />
                  <Text style={styles.clearSeriesText}>Clear selection</Text>
                </Pressable>
              )}
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
        );
      
      default:
        return null;
    }
  };


  const renderSeriesModal = () => {
    if (!showSeriesModal) return null;
    
    return (
      <Modal
        visible={true}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowSeriesModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Series</Text>
          <Pressable
            onPress={() => setShowSeriesModal(false)}
            style={styles.modalCloseButton}
          >
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </Pressable>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.seriesOption}>
            <Pressable
              style={styles.seriesOptionButton}
              onPress={() => {
                setSeriesId('');
                setShowSeriesModal(false);
              }}
            >
              <View style={styles.seriesOptionContent}>
                <Ionicons name="remove-circle-outline" size={24} color={theme.colors.gray500} />
                <Text style={styles.seriesOptionText}>No Series</Text>
              </View>
              {!seriesId && (
                <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
              )}
            </Pressable>
          </View>
          
          {mockSermonSeries.map((series) => (
            <View key={series.id} style={styles.seriesOption}>
              <Pressable
                style={styles.seriesOptionButton}
                onPress={() => {
                  setSeriesId(series.id);
                  setShowSeriesModal(false);
                }}
              >
                <View style={styles.seriesOptionContent}>
                  <View style={[styles.seriesColorIndicator, { backgroundColor: series.color }]} />
                  <View style={styles.seriesOptionInfo}>
                    <Text style={styles.seriesOptionTitle}>{series.title}</Text>
                    <Text style={styles.seriesOptionDescription} numberOfLines={2}>
                      {series.description}
                    </Text>
                    <View style={styles.seriesOptionMeta}>
                      <Text style={styles.seriesOptionMetaText}>
                        {series.sermonCount} sermon{series.sermonCount !== 1 ? 's' : ''}
                      </Text>
                      {series.isActive && (
                        <View style={styles.seriesActiveBadge}>
                          <Text style={styles.seriesActiveBadgeText}>Active</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                {seriesId === series.id && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </Pressable>
            </View>
          ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTitleInput()}
      {renderTabs()}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
      {renderSeriesModal()}
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
    paddingHorizontal: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    gap: 2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    ...theme.typography.caption,
    color: theme.colors.gray600,
    fontWeight: '500',
    fontSize: 11,
    textAlign: 'center',
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
  detailsContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  
  // Content editor styles
  contentEditorContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  formattingToolbar: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
    paddingVertical: theme.spacing.sm,
  },
  toolbarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  toolbarButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minWidth: 36,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray300,
  },
  toolbarSeparator: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.gray300,
    marginHorizontal: theme.spacing.xs,
  },
  boldButtonText: {
    ...theme.typography.body1,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  italicButtonText: {
    ...theme.typography.body1,
    fontStyle: 'italic',
    fontWeight: '600',
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  headingButtonText: {
    ...theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    fontSize: 11,
  },
  contentTextInput: {
    flex: 1,
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    padding: theme.spacing.md,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
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
  
  // Series selector styles
  seriesSelector: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
  },
  seriesSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  seriesSelectorText: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  seriesColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.sm,
  },
  selectedSeriesTitle: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
  },
  seriesPlaceholder: {
    ...theme.typography.body1,
    color: theme.colors.textTertiary,
  },
  clearSeriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  clearSeriesText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  
  // Series modal styles
  seriesOption: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  seriesOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  seriesOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  seriesOptionText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  seriesOptionInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  seriesOptionTitle: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  seriesOptionDescription: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 16,
  },
  seriesOptionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  seriesOptionMetaText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  seriesActiveBadge: {
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 1,
    borderRadius: theme.borderRadius.sm,
  },
  seriesActiveBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.success,
    fontSize: 10,
    fontWeight: '600',
  },
});