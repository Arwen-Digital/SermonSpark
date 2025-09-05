import { theme } from '@/constants/Theme';
import { Sermon } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button } from '../common/Button';
import { WysiwygEditor, WysiwygEditorHandle } from './WysiwygEditor';
import seriesService from '@/services/supabaseSeriesService';

// Mock Bible verse data
const mockBibleVerses: Record<string, Record<string, string>> = {
  'john 3:16': {
    CSB: 'For God loved the world in this way: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.',
    NIV: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
    NLT: 'For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.',
    ESV: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.',
    KJV: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'
  },
  'jn 3:16': {
    CSB: 'For God loved the world in this way: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.',
    NIV: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
    NLT: 'For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.',
    ESV: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.',
    KJV: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'
  },
  'romans 8:28': {
    CSB: 'We know that all things work together for the good of those who love God, who are called according to his purpose.',
    NIV: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
    NLT: 'And we know that God causes everything to work together for the good of those who love God and are called according to his purpose for them.',
    ESV: 'And we know that for those who love God all things work together for good, for those who are called according to his purpose.',
    KJV: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.'
  },
  'philippians 4:13': {
    CSB: 'I am able to do all things through him who strengthens me.',
    NIV: 'I can do all this through him who gives me strength.',
    NLT: 'For I can do everything through Christ, who gives me strength.',
    ESV: 'I can do all things through him who strengthens me.',
    KJV: 'I can do all things through Christ which strengtheneth me.'
  }
};

interface SermonEditorProps {
  sermon?: Sermon;
  onSave: (sermon: Partial<Sermon>) => void;
  onCancel: () => void;
}

interface LocalSeriesOption {
  id: string; // series documentId/UUID
  title: string;
  description?: string;
  color: string;
  sermonCount: number;
  isActive: boolean;
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
  const [showBibleVerseModal, setShowBibleVerseModal] = useState(false);
  const [bibleVerse, setBibleVerse] = useState('');
  const [bibleTranslation, setBibleTranslation] = useState('CSB');
  const [fetchedVerseText, setFetchedVerseText] = useState('');
  const [fetchedVerseReference, setFetchedVerseReference] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [currentTab, setCurrentTab] = useState<'content' | 'outline' | 'notes' | 'details'>('content');
  const [viewMode, setViewMode] = useState<'markup' | 'formatted'>('formatted');
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768; // Tablet and desktop breakpoint

  // Remote series options for current user
  const [seriesOptions, setSeriesOptions] = useState<LocalSeriesOption[]>([]);
  const [seriesLoading, setSeriesLoading] = useState(false);

  useEffect(() => {
    const loadSeries = async () => {
      try {
        setSeriesLoading(true);
        const list = await seriesService.getAllSeries();
        const options: LocalSeriesOption[] = list.map((s: any) => ({
          id: s.documentId || String(s.id),
          title: s.title,
          description: s.description,
          color: s.status === 'active' ? theme.colors.success : theme.colors.primary,
          sermonCount: Array.isArray(s.sermons) ? s.sermons.length : 0,
          isActive: s.status === 'active',
        }));
        setSeriesOptions(options);
      } catch (e) {
        console.warn('Failed to load user series', e);
        setSeriesOptions([]);
      } finally {
        setSeriesLoading(false);
      }
    };
    loadSeries();
  }, []);

  // Toast notification function
  const showToastNotification = (message: string) => {
    console.log('showToastNotification called with:', message);
    setToastMessage(message);
    setShowToast(true);
    console.log('Toast state set to true');
    setTimeout(() => {
      console.log('Hiding toast after 3 seconds');
      setShowToast(false);
    }, 3000); // Hide after 3 seconds
  };
  const [newTag, setNewTag] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [textSelection, setTextSelection] = useState({ start: 0, end: 0 });
  const wysiwygEditorRef = useRef<WysiwygEditorHandle>(null);

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [title, content, outline, scripture, tags, seriesId, notes]);

  const handleAutoSave = useCallback(() => {
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
  }, [sermon?.id, title, content, outline, scripture, tags, seriesId, notes]);

  // Auto-save timer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasUnsavedChanges && (title || content)) {
        handleAutoSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(timer);
  }, [title, content, outline, hasUnsavedChanges, handleAutoSave]);

  const handleSave = () => {
    console.log('handleSave called');
    if (!title.trim()) {
      console.log('No title provided');
      if (Platform.OS === 'web') {
        alert('Please enter a title for your sermon');
      } else {
        Alert.alert('Title Required', 'Please enter a title for your sermon');
      }
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

    console.log('About to call onSave with:', sermonData);
    try {
      onSave(sermonData);
      console.log('onSave called successfully');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error in handleSave:', error);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      // On web, use browser confirm dialog since Alert.alert doesn't work well
      if (Platform.OS === 'web') {
        const shouldDiscard = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
        if (shouldDiscard) {
          onCancel();
        }
      } else {
        // Use Alert.alert on mobile platforms
        Alert.alert(
          'Unsaved Changes',
          'You have unsaved changes. Are you sure you want to cancel?',
          [
            { text: 'Keep Editing', style: 'cancel' },
            { text: 'Discard Changes', style: 'destructive', onPress: onCancel },
          ]
        );
      }
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
    let newCursorPosition;
    
    if (selectedText) {
      // Wrap selected text
      newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
      newCursorPosition = start + before.length + selectedText.length + after.length;
    } else {
      // Insert at cursor position or append
      const insertPosition = start > 0 ? start : content.length;
      newContent = content.substring(0, insertPosition) + before + after + content.substring(insertPosition);
      newCursorPosition = insertPosition + before.length;
    }
    
    // Mobile-specific: Dismiss floating toolbar by clearing selection temporarily
    if (Platform.OS !== 'web' && selectedText) {
      setTextSelection({ start: 0, end: 0 });
      setTimeout(() => {
        setTextSelection({ start: newCursorPosition, end: newCursorPosition });
      }, 50);
    }
    
    // Use direct manipulation to set content and selection atomically
    if (wysiwygEditorRef.current?.setContentAndSelection) {
      // Update parent state first to prevent conflicts
      setContent(newContent);
      setTextSelection({ start: newCursorPosition, end: newCursorPosition });
      
      // Then use the direct manipulation method
      wysiwygEditorRef.current.setContentAndSelection(newContent, newCursorPosition, newCursorPosition);
    } else {
      // Fallback to previous approach if direct manipulation isn't available
      setContent(newContent);
      setTextSelection({ start: newCursorPosition, end: newCursorPosition });
      
      if (wysiwygEditorRef.current?.focus) {
        wysiwygEditorRef.current.focus();
      }
      
      setTimeout(() => {
        if (wysiwygEditorRef.current?.setSelection) {
          wysiwygEditorRef.current.setSelection(newCursorPosition, newCursorPosition);
        }
      }, Platform.OS !== 'web' ? 200 : 100);
    }
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
        const hasSelectedText = textSelection.start !== textSelection.end;
        return (
          <View style={styles.contentEditorContainer}>
            {/* Mobile Floating Toolbar - appears when text is selected */}
            {!isLargeScreen && hasSelectedText && (
              <View style={styles.mobileFloatingToolbar}>
                <Text style={styles.floatingToolbarTitle}>Format Selection</Text>
                <ScrollView 
                  horizontal 
                  style={styles.floatingToolbarScroll}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.floatingToolbarContent}
                >
                  <Pressable style={styles.floatingToolbarButton} onPress={() => insertFormatting('**', '**')}>
                    <Text style={styles.boldButtonText}>B</Text>
                  </Pressable>
                  <Pressable style={styles.floatingToolbarButton} onPress={() => insertFormatting('*', '*')}>
                    <Text style={styles.italicButtonText}>I</Text>
                  </Pressable>
                  <Pressable style={styles.floatingToolbarButton} onPress={() => insertFormatting('==', '==')}>
                    <Ionicons name="color-fill" size={16} color={theme.colors.warning} />
                  </Pressable>
                  <Pressable style={styles.floatingToolbarButton} onPress={() => insertFormatting('## ', '')}>
                    <Text style={styles.headingButtonText}>H2</Text>
                  </Pressable>
                  <Pressable style={styles.floatingToolbarButton} onPress={() => insertFormatting('### ', '')}>
                    <Text style={styles.headingButtonText}>H3</Text>
                  </Pressable>
                </ScrollView>
              </View>
            )}

            <View style={styles.formattingToolbar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {hasSelectedText && isLargeScreen && (
                  <View style={styles.selectionIndicator}>
                    <Text style={styles.selectionIndicatorText}>Text selected</Text>
                  </View>
                )}
                <View style={styles.toolbarButtons}>
                  {/* View Mode Toggle */}
                  <Pressable 
                    style={[
                      styles.viewModeToggle,
                      viewMode === 'markup' && styles.viewModeToggleActive
                    ]} 
                    onPress={() => setViewMode(viewMode === 'markup' ? 'formatted' : 'markup')}
                  >
                    <Ionicons 
                      name={viewMode === 'markup' ? 'code-outline' : 'eye-outline'} 
                      size={16} 
                      color={viewMode === 'markup' ? theme.colors.primary : theme.colors.textPrimary} 
                    />
                    <Text style={[
                      styles.viewModeToggleText,
                      viewMode === 'markup' && styles.viewModeToggleTextActive
                    ]}>
                      {viewMode === 'markup' ? 'Markup' : 'Preview'}
                    </Text>
                  </Pressable>
                  
                  <View style={styles.toolbarSeparator} />
                  
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
                  {isLargeScreen && (
                    <>
                      <View style={styles.toolbarSeparator} />
                      <Pressable style={styles.toolbarBibleVerseButton} onPress={() => setShowBibleVerseModal(true)}>
                        <Ionicons name="book" size={16} color={theme.colors.primary} />
                        <Text style={styles.toolbarBibleVerseButtonText}>Bible Verse Finder</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </ScrollView>
            </View>
            {!isLargeScreen && (
              <View style={styles.bibleVerseButtonContainer}>
                <Pressable style={styles.bibleVerseButton} onPress={() => setShowBibleVerseModal(true)}>
                  <Ionicons name="book" size={18} color={theme.colors.primary} />
                  <Text style={styles.bibleVerseButtonText}>Bible Verse Finder</Text>
                </Pressable>
              </View>
            )}
            <WysiwygEditor
              ref={wysiwygEditorRef}
              style={styles.contentTextInput}
              value={content}
              onChangeText={setContent}
              onSelectionChange={handleSelectionChange}
              viewMode={viewMode}
              placeholder="Start writing your sermon content...

Use the formatting buttons above or type directly:
**bold text** for bold
*italic text* for italics  
## Heading for large headings
### Subheading for smaller headings
- List item for bullet points
1. List item for numbered lists
> Quote for blockquotes
==highlight== for highlighting"
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
                            { backgroundColor: (seriesOptions.find(s => s.id === seriesId)?.color) || theme.colors.primary }
                          ]} 
                        />
                        <Text style={styles.selectedSeriesTitle}>
                          {seriesOptions.find(s => s.id === seriesId)?.title || 'Unknown Series'}
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
          
          {seriesOptions.map((series) => (
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

  const renderBibleVerseModal = () => {
    if (!showBibleVerseModal) return null;
    
    return (
      <Modal
        visible={true}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowBibleVerseModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Find A Bible Verse</Text>
            <Pressable
              onPress={() => setShowBibleVerseModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
            </Pressable>
          </View>
          
          <View style={styles.bibleVerseModalContent}>
            <View style={styles.bibleVerseInputContainer}>
              <Text style={styles.formLabel}>Bible Reference</Text>
              <TextInput
                style={styles.bibleVerseInput}
                value={bibleVerse}
                onChangeText={(text) => {
                  setBibleVerse(text);
                  // Clear previous verse when user starts typing new reference
                  if (fetchedVerseText) {
                    setFetchedVerseText('');
                    setFetchedVerseReference('');
                  }
                }}
                placeholder="Jn 3:16"
                placeholderTextColor={theme.colors.textTertiary}
                autoFocus={true}
              />
            </View>
            
            <View style={styles.bibleTranslationContainer}>
              <Text style={styles.formLabel}>Translation</Text>
              <View style={styles.translationButtons}>
                {['CSB', 'NIV', 'NLT', 'ESV', 'KJV'].map((translation) => (
                  <Pressable
                    key={translation}
                    style={[
                      styles.translationButton,
                      bibleTranslation === translation && styles.translationButtonActive
                    ]}
                    onPress={() => setBibleTranslation(translation)}
                  >
                    <Text
                      style={[
                        styles.translationButtonText,
                        bibleTranslation === translation && styles.translationButtonTextActive
                      ]}
                    >
                      {translation}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            
            {fetchedVerseText && (
              <View style={styles.verseDisplayContainer}>
                <Text style={styles.verseDisplayLabel}>Verse Text:</Text>
                <Pressable 
                  style={styles.verseDisplayArea}
                  onPress={async () => {
                    console.log('Copy button pressed, Platform:', Platform.OS);
                    try {
                      const textToCopy = fetchedVerseReference ? 
                        `"${fetchedVerseText}" - ${fetchedVerseReference}` : 
                        fetchedVerseText;
                      
                      console.log('Text to copy:', textToCopy);
                      
                      if (Platform.OS === 'web') {
                        // Try using the native browser clipboard API first
                        if (navigator.clipboard) {
                          await navigator.clipboard.writeText(textToCopy);
                          console.log('Successfully copied with navigator.clipboard');
                        } else {
                          // Fallback to expo-clipboard
                          await Clipboard.setStringAsync(textToCopy);
                          console.log('Successfully copied with expo-clipboard');
                        }
                        console.log('About to show toast...');
                        showToastNotification('Bible verse copied to clipboard!');
                      } else {
                        await Clipboard.setStringAsync(textToCopy);
                        Alert.alert('Copied!', 'Bible verse copied to clipboard');
                      }
                    } catch (error) {
                      console.error('Copy failed:', error);
                      if (Platform.OS === 'web') {
                        showToastNotification('Failed to copy to clipboard');
                      } else {
                        Alert.alert('Error', 'Failed to copy to clipboard');
                      }
                    }
                  }}
                >
                  <Text style={styles.verseText}>{fetchedVerseText}</Text>
                  {fetchedVerseReference && (
                    <Text style={styles.verseReference}>{fetchedVerseReference}</Text>
                  )}
                  <View style={styles.copyHint}>
                    <Ionicons name="copy-outline" size={16} color={theme.colors.textTertiary} />
                    <Text style={styles.copyHintText}>Tap to copy to clipboard</Text>
                  </View>
                </Pressable>
              </View>
            )}
            
            <View style={styles.bibleVerseModalFooter}>
              <Button
                title="Cancel"
                onPress={() => setShowBibleVerseModal(false)}
                variant="outline"
                size="md"
              />
              <Button
                title="Find Verse"
                onPress={() => {
                  const normalizedReference = bibleVerse.toLowerCase().trim();
                  const verseData = mockBibleVerses[normalizedReference];
                  
                  if (verseData && verseData[bibleTranslation]) {
                    setFetchedVerseText(verseData[bibleTranslation]);
                    setFetchedVerseReference(`${bibleVerse} (${bibleTranslation})`);
                  } else {
                    setFetchedVerseText('Verse not found. Try "John 3:16", "Romans 8:28", or "Philippians 4:13"');
                    setFetchedVerseReference('');
                  }
                }}
                variant="primary"
                size="md"
              />
            </View>
          </View>
          
          {/* Toast inside modal */}
          {showToast && Platform.OS === 'web' && (
            <View style={styles.modalToastContainer}>
              <View style={styles.toast}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.white} />
                <Text style={styles.toastText}>{toastMessage}</Text>
              </View>
            </View>
          )}
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
      {renderBibleVerseModal()}
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
  selectionIndicator: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
    alignSelf: 'center',
  },
  selectionIndicatorText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 10,
  },
  
  // View mode toggle styles
  viewModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    gap: theme.spacing.xs,
  },
  viewModeToggleActive: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  viewModeToggleText: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 11,
  },
  viewModeToggleTextActive: {
    color: theme.colors.primary,
  },
  
  // Mobile floating toolbar styles
  mobileFloatingToolbar: {
    position: 'absolute',
    top: -80,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
  },
  floatingToolbarTitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  floatingToolbarScroll: {
    flexGrow: 0,
  },
  floatingToolbarContent: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  floatingToolbarButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.xs,
    minWidth: 44,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray200,
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
  
  // Bible Verse Finder styles
  bibleVerseButtonContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
    alignItems: 'center',
  },
  bibleVerseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bibleVerseButtonText: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  toolbarBibleVerseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  toolbarBibleVerseButtonText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  bibleVerseModalContent: {
    flex: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  bibleVerseInputContainer: {
    gap: theme.spacing.sm,
  },
  bibleVerseInput: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    fontSize: 16,
  },
  bibleTranslationContainer: {
    gap: theme.spacing.sm,
  },
  translationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  translationButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    minWidth: 60,
    alignItems: 'center',
  },
  translationButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  translationButtonText: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  translationButtonTextActive: {
    color: theme.colors.white,
  },
  bibleVerseModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    marginTop: 'auto',
    paddingTop: theme.spacing.lg,
  },
  verseDisplayContainer: {
    gap: theme.spacing.sm,
  },
  verseDisplayLabel: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  verseDisplayArea: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    gap: theme.spacing.sm,
  },
  verseText: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  verseReference: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textAlign: 'right',
  },
  copyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray200,
    marginTop: theme.spacing.xs,
  },
  copyHintText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
  
  // Toast notification styles
  modalToastContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: 320,
  },
  toastText: {
    ...theme.typography.body2,
    color: theme.colors.white,
    fontWeight: '600',
  },
});
