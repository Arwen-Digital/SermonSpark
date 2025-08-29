import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/Theme';

interface RichTextEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

interface TextFormat {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  highlight: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onContentChange,
  placeholder = 'Start writing your sermon...',
  autoFocus = false,
}) => {
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [currentFormat, setCurrentFormat] = useState<TextFormat>({
    bold: false,
    italic: false,
    underline: false,
    highlight: false,
  });
  const [showFormatBar, setShowFormatBar] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSelectionChange = (event: any) => {
    const { start, end } = event.nativeEvent.selection;
    setSelection({ start, end });
    setShowFormatBar(start !== end);
  };

  const formatText = (formatType: keyof TextFormat) => {
    if (selection.start === selection.end) {
      Alert.alert('Selection Required', 'Please select text to format');
      return;
    }

    // This is a simplified implementation - in a real app you'd need a proper rich text editor
    const selectedText = content.substring(selection.start, selection.end);
    let formattedText = selectedText;

    switch (formatType) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'highlight':
        formattedText = `==${selectedText}==`;
        break;
    }

    const newContent = 
      content.substring(0, selection.start) + 
      formattedText + 
      content.substring(selection.end);
    
    onContentChange(newContent);
    setCurrentFormat(prev => ({
      ...prev,
      [formatType]: !prev[formatType]
    }));
  };

  const insertHeading = (level: number) => {
    const headingPrefix = '#'.repeat(level) + ' ';
    const newContent = content + '\n' + headingPrefix;
    onContentChange(newContent);
    
    // Focus and move cursor to end
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const insertBulletPoint = () => {
    const bulletPoint = '\n• ';
    const newContent = content + bulletPoint;
    onContentChange(newContent);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const insertNumberedList = () => {
    const numberedItem = '\n1. ';
    const newContent = content + numberedItem;
    onContentChange(newContent);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const renderFormatToolbar = () => (
    <View style={styles.toolbar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.toolbarContent}>
          {/* Text Formatting */}
          <View style={styles.toolbarSection}>
            <Pressable
              style={[styles.toolbarButton, currentFormat.bold && styles.toolbarButtonActive]}
              onPress={() => formatText('bold')}
            >
              <Ionicons name="text" size={18} color={theme.colors.textPrimary} style={{ fontWeight: 'bold' }} />
            </Pressable>
            
            <Pressable
              style={[styles.toolbarButton, currentFormat.italic && styles.toolbarButtonActive]}
              onPress={() => formatText('italic')}
            >
              <Text style={[styles.toolbarIcon, { fontStyle: 'italic' }]}>I</Text>
            </Pressable>
            
            <Pressable
              style={[styles.toolbarButton, currentFormat.underline && styles.toolbarButtonActive]}
              onPress={() => formatText('underline')}
            >
              <Text style={[styles.toolbarIcon, { textDecorationLine: 'underline' }]}>U</Text>
            </Pressable>
            
            <Pressable
              style={[styles.toolbarButton, currentFormat.highlight && styles.toolbarButtonActive]}
              onPress={() => formatText('highlight')}
            >
              <Ionicons name="color-fill" size={18} color={theme.colors.warning} />
            </Pressable>
          </View>

          <View style={styles.separator} />

          {/* Headings */}
          <View style={styles.toolbarSection}>
            <Pressable
              style={styles.toolbarButton}
              onPress={() => insertHeading(1)}
            >
              <Text style={styles.headingButton}>H1</Text>
            </Pressable>
            
            <Pressable
              style={styles.toolbarButton}
              onPress={() => insertHeading(2)}
            >
              <Text style={styles.headingButton}>H2</Text>
            </Pressable>
            
            <Pressable
              style={styles.toolbarButton}
              onPress={() => insertHeading(3)}
            >
              <Text style={styles.headingButton}>H3</Text>
            </Pressable>
          </View>

          <View style={styles.separator} />

          {/* Lists */}
          <View style={styles.toolbarSection}>
            <Pressable
              style={styles.toolbarButton}
              onPress={insertBulletPoint}
            >
              <Ionicons name="list" size={18} color={theme.colors.textPrimary} />
            </Pressable>
            
            <Pressable
              style={styles.toolbarButton}
              onPress={insertNumberedList}
            >
              <Ionicons name="list-outline" size={18} color={theme.colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.separator} />

          {/* Additional Tools */}
          <View style={styles.toolbarSection}>
            <Pressable
              style={styles.toolbarButton}
              onPress={() => console.log('Insert scripture reference')}
            >
              <Ionicons name="book" size={18} color={theme.colors.primary} />
            </Pressable>
            
            <Pressable
              style={styles.toolbarButton}
              onPress={() => console.log('Insert illustration')}
            >
              <Ionicons name="images" size={18} color={theme.colors.secondary} />
            </Pressable>
            
            <Pressable
              style={styles.toolbarButton}
              onPress={() => console.log('Insert note')}
            >
              <Ionicons name="document-text" size={18} color={theme.colors.accent} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const getWordCount = () => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getReadingTime = () => {
    const wordCount = getWordCount();
    const readingTime = Math.ceil(wordCount / 150); // Average 150 words per minute
    return readingTime;
  };

  const renderStatusBar = () => (
    <View style={styles.statusBar}>
      <View style={styles.statusSection}>
        <Ionicons name="document-text-outline" size={14} color={theme.colors.textTertiary} />
        <Text style={styles.statusText}>{getWordCount()} words</Text>
      </View>
      
      <View style={styles.statusSection}>
        <Ionicons name="time-outline" size={14} color={theme.colors.textTertiary} />
        <Text style={styles.statusText}>{getReadingTime()} min read</Text>
      </View>
      
      <View style={styles.statusSection}>
        <Ionicons name="checkmark-circle-outline" size={14} color={theme.colors.success} />
        <Text style={styles.statusText}>Auto-saved</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderFormatToolbar()}
      
      <ScrollView style={styles.editorContainer} showsVerticalScrollIndicator={false}>
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={content}
          onChangeText={onContentChange}
          onSelectionChange={handleSelectionChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          autoFocus={autoFocus}
          textAlignVertical="top"
          scrollEnabled={false}
        />
      </ScrollView>
      
      {showFormatBar && (
        <View style={styles.floatingFormatBar}>
          <Pressable
            style={styles.formatButton}
            onPress={() => formatText('bold')}
          >
            <Ionicons name="text" size={16} color={theme.colors.white} />
          </Pressable>
          
          <Pressable
            style={styles.formatButton}
            onPress={() => formatText('italic')}
          >
            <Text style={[styles.formatButtonText, { fontStyle: 'italic' }]}>I</Text>
          </Pressable>
          
          <Pressable
            style={styles.formatButton}
            onPress={() => formatText('highlight')}
          >
            <Ionicons name="color-fill" size={16} color={theme.colors.warning} />
          </Pressable>
        </View>
      )}
      
      {renderStatusBar()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  toolbar: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
    paddingVertical: theme.spacing.sm,
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  toolbarSection: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  toolbarButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.backgroundSecondary,
    minWidth: 36,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  toolbarIcon: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  headingButton: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.gray300,
    marginHorizontal: theme.spacing.xs,
  },
  editorContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  textInput: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    lineHeight: 24,
    minHeight: 400,
    textAlignVertical: 'top',
  },
  floatingFormatBar: {
    position: 'absolute',
    bottom: 80,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.black + 'E6',
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  formatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formatButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray200,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statusText: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
});