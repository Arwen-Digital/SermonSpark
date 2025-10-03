import { theme } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CKEditorWrapper } from './CKEditorWrapper';
import { CKEditorSermonEditorProps, EditorState } from './types';

// Mock Bible verse data
const mockBibleVerses: Record<string, Record<string, string>> = {
  'john 3:16': {
    CSB: 'For God loved the world in this way: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.',
    NIV: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
    NLT: 'For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.',
    ESV: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.',
    KJV: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'
  },
};

interface LocalSeriesOption {
  id: string;
  title: string;
  isActive: boolean;
}

export const CKEditorSermonEditor: React.FC<CKEditorSermonEditorProps> = ({
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
  const [bibleTranslation] = useState('CSB');
  const [fetchedVerseText, setFetchedVerseText] = useState('');
  const [fetchedVerseReference, setFetchedVerseReference] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [currentTab, setCurrentTab] = useState<'content' | 'outline' | 'notes' | 'details'>('content');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newTag, setNewTag] = useState('');

  const insets = useSafeAreaInsets();
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Remote series options for current user
  const [seriesOptions, setSeriesOptions] = useState<LocalSeriesOption[]>([]);
  const [seriesLoading, setSeriesLoading] = useState(false);

  // Editor state
  const [editorState, setEditorState] = useState<EditorState>({
    content: '',
    wordCount: 0,
    readingTime: 0,
    hasUnsavedChanges: false,
    isFocused: false,
  });

  // Load series options
  useEffect(() => {
    const loadSeries = async () => {
      setSeriesLoading(true);
      try {
        // TODO: Implement series loading from repository
        setSeriesOptions([]);
      } catch (error) {
        console.error('Error loading series:', error);
      } finally {
        setSeriesLoading(false);
      }
    };
    loadSeries();
  }, []);

  // Cleanup toast timeout
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = null;
      }
    };
  }, []);

  const showToastNotification = useCallback((message: string, _context: 'global' | 'modal' = 'global') => {
    setToastMessage(message);
    setShowToast(true);

    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
      setToastMessage('');
      toastTimeoutRef.current = null;
    }, 3000);
  }, []);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    
    // Only update hasUnsavedChanges if content actually changed
    if (newContent !== content) {
      setHasUnsavedChanges(true);
    }
    
    // Calculate word count and reading time
    const wordCount = newContent.trim().split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.ceil(wordCount / 150);
    
    setEditorState(prev => ({
      ...prev,
      content: newContent,
      wordCount,
      readingTime,
      hasUnsavedChanges: true,
    }));
  }, [content]);

  const handleSave = async () => {
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
      wordCount: editorState.wordCount,
      readingTime: editorState.readingTime,
      isArchived: sermon?.isArchived || false,
      isFavorite: sermon?.isFavorite || false,
    };

    console.log('About to call onSave with:', sermonData);
    try {
      await onSave(sermonData);
      console.log('onSave called successfully');
      setHasUnsavedChanges(false);
      showToastNotification('Sermon saved successfully', 'global');
    } catch (error) {
      console.error('Error in handleSave:', error);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (Platform.OS === 'web') {
        const shouldDiscard = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
        if (shouldDiscard) {
          onCancel();
        }
      } else {
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
      setHasUnsavedChanges(true);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    setHasUnsavedChanges(true);
  };

  const fetchBibleVerse = () => {
    const key = bibleVerse.toLowerCase().trim();
    if (mockBibleVerses[key]) {
      setFetchedVerseText(mockBibleVerses[key][bibleTranslation] || mockBibleVerses[key]['CSB']);
      setFetchedVerseReference(bibleVerse);
    } else {
      showToastNotification('Verse not found', 'modal');
    }
  };

  const insertBibleVerse = () => {
    if (fetchedVerseText) {
      const verseMarkup = `<blockquote><p><strong>${fetchedVerseReference}</strong><br/>${fetchedVerseText}</p></blockquote>`;
      setContent(prev => prev + '\n\n' + verseMarkup);
      setHasUnsavedChanges(true);
      setShowBibleVerseModal(false);
      setBibleVerse('');
      setFetchedVerseText('');
      setFetchedVerseReference('');
      showToastNotification('Verse inserted successfully', 'global');
    }
  };

  const contentEditor = useMemo(() => (
    <CKEditorWrapper
      value={content}
      onChange={handleContentChange}
      placeholder="Start writing your sermon content..."
      onFocus={() => setEditorState(prev => ({ ...prev, isFocused: true }))}
      onBlur={() => setEditorState(prev => ({ ...prev, isFocused: false }))}
      style={styles.editor}
    />
  ), [content, handleContentChange]);

  const renderTabContent = () => {
    switch (currentTab) {
      case 'content':
        return (
          <View style={styles.tabContent}>
            {contentEditor}
          </View>
        );
      
      case 'outline':
        return (
          <View style={styles.tabContent}>
            <CKEditorWrapper
              value={outline}
              onChange={setOutline}
              placeholder="Create your sermon outline..."
              style={styles.editor}
            />
          </View>
        );
      
      case 'notes':
        return (
          <View style={styles.tabContent}>
            <CKEditorWrapper
              value={notes}
              onChange={setNotes}
              placeholder="Add your personal notes..."
              style={styles.editor}
            />
          </View>
        );
      
      case 'details':
        return (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* Scripture Reference */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Scripture Reference</Text>
              <TextInput
                style={styles.detailInput}
                value={scripture}
                onChangeText={setScripture}
                placeholder="e.g., John 3:16"
                multiline
              />
            </View>

            {/* Tags */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Tags</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder="Add a tag"
                  onSubmitEditing={addTag}
                  returnKeyType="done"
                />
                <Pressable style={styles.addTagButton} onPress={addTag}>
                  <Ionicons name="add" size={20} color={theme.colors.primary} />
                </Pressable>
              </View>
              {tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {tags.map((tag, index) => (
                    <Pressable
                      key={index}
                      style={styles.tag}
                      onPress={() => removeTag(tag)}
                    >
                      <Text style={styles.tagText}>{tag}</Text>
                      <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Series */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Series</Text>
              <Pressable
                style={styles.seriesButton}
                onPress={() => setShowSeriesModal(true)}
              >
                <Text style={styles.seriesButtonText}>
                  {seriesId ? seriesOptions.find(s => s.id === seriesId)?.title || 'Select Series' : 'Select Series'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            {/* Stats */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Statistics</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{editorState.wordCount}</Text>
                  <Text style={styles.statLabel}>Words</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{editorState.readingTime}</Text>
                  <Text style={styles.statLabel}>Min Read</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.headerButton} onPress={handleCancel}>
              <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>Sermon Editor</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.headerButton} onPress={() => setShowBibleVerseModal(true)}>
              <Ionicons name="book" size={24} color={theme.colors.primary} />
            </Pressable>
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>

        {/* Title Input */}
        <View style={styles.titleContainer}>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Sermon Title"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['content', 'outline', 'notes', 'details'] as const).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, currentTab === tab && styles.activeTab]}
              onPress={() => setCurrentTab(tab)}
            >
              <Text style={[styles.tabText, currentTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {renderTabContent()}
        </View>

        {/* Toast Notification */}
        {showToast && (
          <View style={[styles.toast, { bottom: insets.bottom + 20 }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Series Selection Modal */}
      <Modal
        visible={showSeriesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSeriesModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Series</Text>
            <Pressable onPress={() => setShowSeriesModal(false)}>
              <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody}>
            {seriesLoading ? (
              <Text style={styles.loadingText}>Loading series...</Text>
            ) : seriesOptions.length === 0 ? (
              <Text style={styles.emptyText}>No series available</Text>
            ) : (
              seriesOptions.map((series) => (
                <Pressable
                  key={series.id}
                  style={styles.seriesOption}
                  onPress={() => {
                    setSeriesId(series.id);
                    setShowSeriesModal(false);
                    setHasUnsavedChanges(true);
                  }}
                >
                  <Text style={styles.seriesOptionText}>{series.title}</Text>
                  {seriesId === series.id && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Bible Verse Modal */}
      <Modal
        visible={showBibleVerseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBibleVerseModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Insert Bible Verse</Text>
            <Pressable onPress={() => setShowBibleVerseModal(false)}>
              <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
            </Pressable>
          </View>
          <View style={styles.modalBody}>
            <View style={styles.verseInputContainer}>
              <TextInput
                style={styles.verseInput}
                value={bibleVerse}
                onChangeText={setBibleVerse}
                placeholder="e.g., John 3:16"
                autoCapitalize="none"
              />
              <Pressable style={styles.fetchButton} onPress={fetchBibleVerse}>
                <Text style={styles.fetchButtonText}>Fetch</Text>
              </Pressable>
            </View>
            
            {fetchedVerseText && (
              <View style={styles.versePreview}>
                <Text style={styles.verseReference}>{fetchedVerseReference}</Text>
                <Text style={styles.verseText}>{fetchedVerseText}</Text>
                <Pressable style={styles.insertButton} onPress={insertBibleVerse}>
                  <Text style={styles.insertButtonText}>Insert Verse</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  saveButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
  titleContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  titleInput: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  editor: {
    flex: 1,
  },
  detailSection: {
    marginBottom: theme.spacing.lg,
  },
  detailLabel: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  detailInput: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    minHeight: 40,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  addTagButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.gray100,
    borderRadius: theme.borderRadius.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray100,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  tagText: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
    marginRight: theme.spacing.xs,
  },
  seriesButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
  },
  seriesButtonText: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  toast: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.success,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  toastText: {
    ...theme.typography.body1,
    color: theme.colors.white,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  modalBody: {
    padding: theme.spacing.md,
  },
  loadingText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptyText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  seriesOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  seriesOptionText: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
  },
  verseInputContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  verseInput: {
    flex: 1,
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  fetchButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  fetchButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
  versePreview: {
    backgroundColor: theme.colors.gray100,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  verseReference: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  verseText: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.md,
  },
  insertButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  insertButtonText: {
    ...theme.typography.button,
    color: theme.colors.white,
  },
});
