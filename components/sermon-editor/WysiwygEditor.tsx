import { theme } from '@/constants/Theme';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface WysiwygEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectionChange?: (event: any) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  style?: any;
}

interface ParsedSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  highlight?: boolean;
  heading?: number;
  quote?: boolean;
  listItem?: boolean;
  numberedList?: boolean;
}

export const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  value,
  onChangeText,
  onSelectionChange,
  placeholder,
  placeholderTextColor,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const textInputRef = useRef<TextInput>(null);

  // Focus the hidden input when component receives focus
  useEffect(() => {
    if (isFocused && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [isFocused]);

  const parseMarkdown = (text: string): ParsedSegment[] => {
    if (!text) return [];

    const lines = text.split('\n');
    const segments: ParsedSegment[] = [];

    lines.forEach((line, lineIndex) => {
      if (lineIndex > 0) {
        // Add line break
        segments.push({ text: '\n' });
      }

      // Handle empty lines
      if (line.trim() === '') {
        segments.push({ text: '' });
        return;
      }

      // Check for headings (must be at start of line)
      if (line.startsWith('### ')) {
        const headingText = line.substring(4);
        if (headingText.trim()) {
          segments.push({ text: headingText, heading: 3 });
        }
        return;
      }
      if (line.startsWith('## ')) {
        const headingText = line.substring(3);
        if (headingText.trim()) {
          segments.push({ text: headingText, heading: 2 });
        }
        return;
      }

      // Check for quotes
      if (line.startsWith('> ')) {
        const quoteText = line.substring(2);
        if (quoteText.trim()) {
          segments.push({ text: quoteText, quote: true });
        } else {
          segments.push({ text: '', quote: true });
        }
        return;
      }

      // Check for numbered list items
      const numberedMatch = line.match(/^(\d+\. )(.*)/);
      if (numberedMatch) {
        segments.push({ text: numberedMatch[1], numberedList: true });
        if (numberedMatch[2]) {
          segments.push(...parseInlineMarkdown(numberedMatch[2]));
        }
        return;
      }

      // Check for bullet list items
      if (line.startsWith('- ')) {
        segments.push({ text: '• ', listItem: true });
        const remainingText = line.substring(2);
        if (remainingText) {
          segments.push(...parseInlineMarkdown(remainingText));
        }
        return;
      }

      // Parse inline markdown for regular lines
      segments.push(...parseInlineMarkdown(line));
    });

    return segments;
  };

  const parseInlineMarkdown = (text: string): ParsedSegment[] => {
    const segments: ParsedSegment[] = [];
    let processedText = text;
    
    // Process in order of priority to avoid conflicts
    // 1. First, handle bold (**text**)
    processedText = processedText.replace(/\*\*(.*?)\*\*/g, (match, content) => {
      return `__BOLD_START__${content}__BOLD_END__`;
    });
    
    // 2. Then handle highlights (==text==)
    processedText = processedText.replace(/==(.*?)==/g, (match, content) => {
      return `__HIGHLIGHT_START__${content}__HIGHLIGHT_END__`;
    });
    
    // 3. Finally handle italics (*text*) - won't conflict with bold now
    processedText = processedText.replace(/\*([^*]+?)\*/g, (match, content) => {
      return `__ITALIC_START__${content}__ITALIC_END__`;
    });

    // Now parse the processed text
    let currentIndex = 0;
    while (currentIndex < processedText.length) {
      let nearestMarker = null;
      let nearestIndex = processedText.length;

      // Find the nearest formatting marker
      const markers = [
        { start: '__BOLD_START__', end: '__BOLD_END__', type: 'bold' },
        { start: '__ITALIC_START__', end: '__ITALIC_END__', type: 'italic' },
        { start: '__HIGHLIGHT_START__', end: '__HIGHLIGHT_END__', type: 'highlight' },
      ];

      markers.forEach(marker => {
        const startIndex = processedText.indexOf(marker.start, currentIndex);
        if (startIndex !== -1 && startIndex < nearestIndex) {
          nearestIndex = startIndex;
          nearestMarker = marker;
        }
      });

      if (nearestMarker) {
        // Add text before the marker
        if (nearestIndex > currentIndex) {
          const plainText = processedText.substring(currentIndex, nearestIndex);
          if (plainText) {
            segments.push({ text: plainText });
          }
        }

        // Find the end marker
        const endMarkerIndex = processedText.indexOf(nearestMarker.end, nearestIndex + nearestMarker.start.length);
        if (endMarkerIndex !== -1) {
          const content = processedText.substring(
            nearestIndex + nearestMarker.start.length,
            endMarkerIndex
          );
          
          const formatProps: any = {};
          formatProps[nearestMarker.type] = true;
          segments.push({ text: content, ...formatProps });
          
          currentIndex = endMarkerIndex + nearestMarker.end.length;
        } else {
          // Malformed markup, treat as plain text
          segments.push({ text: processedText.substring(currentIndex) });
          break;
        }
      } else {
        // No more markers, add remaining text
        const remainingText = processedText.substring(currentIndex);
        if (remainingText) {
          segments.push({ text: remainingText });
        }
        break;
      }
    }

    return segments;
  };

  const getSegmentStyle = (segment: ParsedSegment) => {
    const styles = [wysiwygStyles.baseText];

    if (segment.bold) styles.push(wysiwygStyles.boldText);
    if (segment.italic) styles.push(wysiwygStyles.italicText);
    if (segment.highlight) styles.push(wysiwygStyles.highlightText);
    if (segment.heading === 2) styles.push(wysiwygStyles.heading2);
    if (segment.heading === 3) styles.push(wysiwygStyles.heading3);
    if (segment.quote) styles.push(wysiwygStyles.quoteText);
    if (segment.listItem || segment.numberedList) styles.push(wysiwygStyles.listText);

    return styles;
  };

  const handleSelectionChange = (event: any) => {
    const { start, end } = event.nativeEvent.selection;
    setSelection({ start, end });
    onSelectionChange?.(event);
  };

  const segments = parseMarkdown(value);

  return (
    <Pressable 
      style={[styles.container, style]}
      onPress={() => {
        setIsFocused(true);
        textInputRef.current?.focus();
      }}
    >
      {/* Hidden TextInput for actual text editing */}
      <TextInput
        ref={textInputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={handleSelectionChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        multiline
        placeholder=""
        textAlignVertical="top"
        selectionColor={theme.colors.primary}
        cursorColor={theme.colors.primary}
        autoFocus={false}
      />

      {/* WYSIWYG Display */}
      <View style={styles.content} pointerEvents="none">
        {!value && placeholder && !isFocused && (
          <Text style={[styles.placeholder, { color: placeholderTextColor }]}>
            {placeholder}
          </Text>
        )}
        
        {value && segments.length > 0 && (
          <Text style={styles.renderContainer}>
            {segments.map((segment, index) => (
              <Text
                key={index}
                style={getSegmentStyle(segment)}
              >
                {segment.text}
              </Text>
            ))}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
    minHeight: 200,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: 'rgba(0,0,0,0.01)', // Almost transparent but not fully
    backgroundColor: 'transparent',
    fontSize: 16,
    lineHeight: 24,
    padding: theme.spacing.md,
    textAlignVertical: 'top',
    zIndex: 2,
    borderWidth: 0,
    opacity: 1, // Keep opacity at 1 to show cursor
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing.md,
    zIndex: 1,
  },
  placeholder: {
    fontSize: 16,
    lineHeight: 24,
  },
  renderContainer: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
});

const wysiwygStyles = StyleSheet.create({
  baseText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.textPrimary,
  },
  boldText: {
    fontWeight: '700',
  },
  italicText: {
    fontStyle: 'italic',
  },
  highlightText: {
    backgroundColor: theme.colors.warning + '40',
    color: theme.colors.textPrimary,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: theme.colors.textPrimary,
    marginVertical: 4,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    color: theme.colors.textPrimary,
    marginVertical: 2,
  },
  quoteText: {
    fontStyle: 'italic',
    color: theme.colors.textSecondary,
    paddingLeft: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    backgroundColor: theme.colors.backgroundSecondary,
    paddingVertical: 4,
    paddingRight: 8,
  },
  listText: {
    color: theme.colors.textPrimary,
    paddingLeft: 8,
  },
});
