import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/Theme';

interface RichTextEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

type HighlightColor = 'yellow' | 'green' | 'blue';

interface FormatRange {
  start: number;
  end: number;
  type: 'bold' | 'highlight' | 'subheader';
  color?: HighlightColor;
}

interface RichTextData {
  text: string;
  formats: FormatRange[];
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onContentChange,
  placeholder = 'Start writing your sermon...',
  autoFocus = false,
}) => {
  const [richData, setRichData] = useState<RichTextData>(() => 
    parseMarkdownToRichData(content)
  );
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Convert markdown content to rich text data structure
  function parseMarkdownToRichData(markdown: string): RichTextData {
    let plainText = markdown;
    const formats: FormatRange[] = [];
    let offset = 0;

    // Parse bold text **text**
    plainText = plainText.replace(/\*\*(.*?)\*\*/g, (match, text, index) => {
      formats.push({
        start: index - offset,
        end: index - offset + text.length,
        type: 'bold'
      });
      offset += 4; // Remove ** **
      return text;
    });

    // Parse highlights [highlight-color]text[/highlight-color]
    plainText = plainText.replace(/\[highlight-(yellow|green|blue)\](.*?)\[\/highlight-\1\]/g, (match, color, text, index) => {
      formats.push({
        start: index - offset,
        end: index - offset + text.length,
        type: 'highlight',
        color: color as HighlightColor
      });
      offset += match.length - text.length;
      return text;
    });

    // Parse subheaders ## text
    const lines = plainText.split('\n');
    let currentPos = 0;
    let newOffset = 0;
    
    const newLines = lines.map(line => {
      if (line.startsWith('## ')) {
        const headerText = line.substring(3);
        formats.push({
          start: currentPos - newOffset,
          end: currentPos - newOffset + headerText.length,
          type: 'subheader'
        });
        newOffset += 3;
        currentPos += line.length + 1;
        return headerText;
      }
      currentPos += line.length + 1;
      return line;
    });

    return {
      text: newLines.join('\n'),
      formats: formats.sort((a, b) => a.start - b.start)
    };
  }

  // Convert rich text data back to markdown
  function convertToMarkdown(data: RichTextData): string {
    let result = data.text;
    const sortedFormats = [...data.formats].sort((a, b) => b.start - a.start);

    for (const format of sortedFormats) {
      const before = result.substring(0, format.start);
      const text = result.substring(format.start, format.end);
      const after = result.substring(format.end);

      switch (format.type) {
        case 'bold':
          result = before + `**${text}**` + after;
          break;
        case 'highlight':
          result = before + `[highlight-${format.color}]${text}[/highlight-${format.color}]` + after;
          break;
        case 'subheader':
          result = before + `## ${text}` + after;
          break;
      }
    }

    return result;
  }

  const handleSelectionChange = (event: any) => {
    const { start, end } = event.nativeEvent.selection;
    setSelection({ start, end });
  };

  // Render rich text with proper text flow
  const renderRichText = () => {
    const text = richData.text;
    const formats = richData.formats;
    
    if (formats.length === 0) {
      return (
        <Text style={styles.normalText}>
          {text.split('\n').map((line, index) => (
            <Text key={index}>
              {line}
              {index < text.split('\n').length - 1 && '\n'}
            </Text>
          ))}
        </Text>
      );
    }

    // Create character-by-character styling map
    const characters = text.split('');
    const styleMap: {bold?: boolean, highlight?: HighlightColor, subheader?: boolean}[] = 
      new Array(characters.length).fill({});

    formats.forEach(format => {
      for (let i = format.start; i < format.end && i < characters.length; i++) {
        styleMap[i] = {
          ...styleMap[i],
          [format.type]: format.type === 'highlight' ? format.color : true
        };
      }
    });

    // Render text with inline styling
    const elements: JSX.Element[] = [];
    let currentLine: JSX.Element[] = [];
    let lineKey = 0;

    characters.forEach((char, index) => {
      if (char === '\n') {
        // End current line and start new one
        elements.push(
          <Text key={`line-${lineKey}`} style={styles.normalText}>
            {currentLine}
            {'\n'}
          </Text>
        );
        currentLine = [];
        lineKey++;
        return;
      }

      const style = styleMap[index];
      let textStyle = styles.normalText;
      let backgroundColor = 'transparent';

      if (style.bold) {
        textStyle = [textStyle, styles.boldText];
      }
      if (style.subheader) {
        textStyle = [textStyle, styles.subheaderText];
      }
      if (style.highlight) {
        switch (style.highlight) {
          case 'yellow': backgroundColor = '#FFD70080'; break;
          case 'green': backgroundColor = '#90EE9080'; break;
          case 'blue': backgroundColor = '#87CEEB80'; break;
        }
      }

      currentLine.push(
        <Text key={`char-${index}`} style={[textStyle, { backgroundColor }]}>
          {char}
        </Text>
      );
    });

    // Add final line if exists
    if (currentLine.length > 0) {
      elements.push(
        <Text key={`line-${lineKey}`} style={styles.normalText}>
          {currentLine}
        </Text>
      );
    }

    return <>{elements}</>;
  };

  const applyFormatting = (type: 'bold' | 'subheader' | HighlightColor) => {
    if (selection.start === selection.end) {
      Alert.alert('Selection Required', 'Please select text to format');
      return;
    }

    const newFormats = [...richData.formats];
    
    if (type === 'bold' || (type === 'yellow' || type === 'green' || type === 'blue')) {
      // Add new format range
      const formatType = type === 'bold' ? 'bold' : 'highlight';
      const newFormat: FormatRange = {
        start: selection.start,
        end: selection.end,
        type: formatType,
        ...(formatType === 'highlight' && { color: type as HighlightColor })
      };
      
      newFormats.push(newFormat);
    } else if (type === 'subheader') {
      // Find line boundaries
      const text = richData.text;
      const lineStart = text.lastIndexOf('\n', selection.start - 1) + 1;
      const lineEnd = text.indexOf('\n', selection.end) === -1 ? text.length : text.indexOf('\n', selection.end);
      
      newFormats.push({
        start: lineStart,
        end: lineEnd,
        type: 'subheader'
      });
    }

    const updatedRichData = {
      ...richData,
      formats: newFormats.sort((a, b) => a.start - b.start)
    };
    
    setRichData(updatedRichData);
    
    // Update content with markdown
    const markdownContent = convertToMarkdown(updatedRichData);
    onContentChange(markdownContent);
  };

  const handleTextChange = (newText: string) => {
    // Update rich data with plain text and preserve existing formats
    const updatedRichData = {
      ...richData,
      text: newText,
      // Filter out formats that are now outside the text bounds
      formats: richData.formats.filter(format => format.end <= newText.length)
    };
    
    setRichData(updatedRichData);
    
    // Convert to markdown and update parent
    const markdownContent = convertToMarkdown(updatedRichData);
    onContentChange(markdownContent);
  };

  const renderFormatToolbar = () => {
    const hasSelection = selection.start !== selection.end;
    
    return (
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.toolbarContent}>
            {/* Selection Status */}
            <Text style={styles.selectionStatus}>
              {hasSelection ? `${selection.end - selection.start} chars selected` : 'Select text to format'}
            </Text>
            
            {/* Bold */}
            <Pressable 
              style={[
                styles.toolbarButton, 
                !hasSelection && styles.toolbarButtonDisabled
              ]} 
              onPress={() => applyFormatting('bold')}
              disabled={!hasSelection}
            >
              <Text style={[
                styles.boldButton,
                !hasSelection && styles.disabledText
              ]}>B</Text>
            </Pressable>

            {/* Subheader */}
            <Pressable 
              style={[
                styles.toolbarButton,
                !hasSelection && styles.toolbarButtonDisabled
              ]} 
              onPress={() => applyFormatting('subheader')}
              disabled={!hasSelection}
            >
              <Text style={[
                styles.headingButton,
                !hasSelection && styles.disabledText
              ]}>H2</Text>
            </Pressable>

            <View style={styles.separator} />

            {/* Highlight Colors */}
            <Pressable 
              style={[
                styles.toolbarButton, 
                styles.highlightYellow,
                !hasSelection && styles.toolbarButtonDisabled
              ]} 
              onPress={() => applyFormatting('yellow')}
              disabled={!hasSelection}
            >
              <Text style={[
                styles.highlightButtonText,
                !hasSelection && styles.disabledText
              ]}>Y</Text>
            </Pressable>
            
            <Pressable 
              style={[
                styles.toolbarButton, 
                styles.highlightGreen,
                !hasSelection && styles.toolbarButtonDisabled
              ]} 
              onPress={() => applyFormatting('green')}
              disabled={!hasSelection}
            >
              <Text style={[
                styles.highlightButtonText,
                !hasSelection && styles.disabledText
              ]}>G</Text>
            </Pressable>
            
            <Pressable 
              style={[
                styles.toolbarButton, 
                styles.highlightBlue,
                !hasSelection && styles.toolbarButtonDisabled
              ]} 
              onPress={() => applyFormatting('blue')}
              disabled={!hasSelection}
            >
              <Text style={[
                styles.highlightButtonText,
                !hasSelection && styles.disabledText
              ]}>B</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderFormatToolbar()}
      
      <ScrollView style={styles.editorContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.editorContent}>
          {/* Rich Text Display */}
          <View style={styles.richTextDisplay}>
            {richData.text ? renderRichText() : (
              <Text style={styles.placeholderText}>{placeholder}</Text>
            )}
          </View>
          
          {/* Invisible TextInput for text editing and selection */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenTextInput}
            value={richData.text}
            onChangeText={handleTextChange}
            onSelectionChange={handleSelectionChange}
            placeholder=""
            multiline
            autoFocus={autoFocus}
            textAlignVertical="top"
            scrollEnabled={false}
            selectTextOnFocus={false}
            selectionColor={theme.colors.primary + '40'}
          />
        </View>
      </ScrollView>
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
    paddingVertical: theme.spacing.md,
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.md,
  },
  toolbarButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundSecondary,
    minWidth: 44,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray300,
  },
  toolbarButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  toolbarButtonDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.gray100,
  },
  selectionStatus: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginRight: theme.spacing.md,
    minWidth: 120,
  },
  disabledText: {
    color: theme.colors.gray400,
  },
  boldButton: {
    ...theme.typography.h6,
    color: theme.colors.textPrimary,
    fontWeight: '900',
  },
  headingButton: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  highlightYellow: {
    backgroundColor: '#FFD700',
    borderColor: '#DAA520',
  },
  highlightGreen: {
    backgroundColor: '#90EE90',
    borderColor: '#32CD32',
  },
  highlightBlue: {
    backgroundColor: '#87CEEB',
    borderColor: '#4682B4',
  },
  highlightButtonText: {
    ...theme.typography.body1,
    color: theme.colors.black,
    fontWeight: '700',
  },
  separator: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.gray300,
    marginHorizontal: theme.spacing.xs,
  },
  editorContainer: {
    flex: 1,
  },
  editorContent: {
    padding: theme.spacing.lg,
    position: 'relative',
    minHeight: 400,
  },
  richTextDisplay: {
    position: 'absolute',
    top: theme.spacing.lg,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    zIndex: 1,
    pointerEvents: 'none' as const,
  },
  hiddenTextInput: {
    ...theme.typography.body1,
    color: 'transparent',
    lineHeight: 28,
    fontSize: 16,
    minHeight: 400,
    textAlignVertical: 'top',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
  },
  textInput: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    lineHeight: 28,
    fontSize: 16,
    minHeight: 400,
    textAlignVertical: 'top',
  },
  formattedContainer: {
    minHeight: 400,
    paddingVertical: theme.spacing.sm,
  },
  formattedTextContainer: {
    flex: 1,
  },
  normalText: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    lineHeight: 28,
    fontSize: 16,
  },
  boldText: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    lineHeight: 28,
    fontSize: 16,
    fontWeight: 'bold',
  },
  subheaderText: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    lineHeight: 36,
    marginVertical: theme.spacing.sm,
    width: '100%',
  },
  placeholderText: {
    ...theme.typography.body1,
    color: theme.colors.textTertiary,
    lineHeight: 28,
    fontSize: 16,
    fontStyle: 'italic',
  },
});