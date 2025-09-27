import { theme } from '@/constants/Theme';
import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View, ViewStyle } from 'react-native';
import { FORMAT_CONFIGS, FormatType } from './FormattingToolbar';
import { MarkdownEditorHandle } from './MarkdownEditor';

interface FallbackEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectionChange?: (selection: { start: number; end: number }) => void;
  placeholder?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Fallback editor component that provides basic markdown editing functionality
 * when the main MarkdownEditor fails or is incompatible.
 * 
 * This component uses a simple TextInput with basic markdown formatting support.
 */
export const FallbackEditor = forwardRef<MarkdownEditorHandle, FallbackEditorProps>(
  ({ value, onChangeText, onSelectionChange, placeholder, style, testID }, ref) => {
    const textInputRef = useRef<TextInput>(null);
    const [selection, setSelection] = useState({ start: 0, end: 0 });

    useImperativeHandle(ref, () => ({
      focus: () => {
        textInputRef.current?.focus();
      },
      blur: () => {
        textInputRef.current?.blur();
      },
      insertText: (text: string) => {
        const { start } = selection;
        const newContent = value.substring(0, start) + text + value.substring(start);
        const newCursorPosition = start + text.length;
        
        onChangeText(newContent);
        
        // Update cursor position
        setTimeout(() => {
          const newSelection = { start: newCursorPosition, end: newCursorPosition };
          setSelection(newSelection);
          textInputRef.current?.setSelection?.(newCursorPosition, newCursorPosition);
        }, 10);
      },
      wrapSelection: (before: string, after: string) => {
        const { start, end } = selection;
        const selectedText = value.substring(start, end);
        
        let newContent: string;
        let newCursorPosition: number;
        
        if (selectedText) {
          // Wrap selected text
          newContent = value.substring(0, start) + before + selectedText + after + value.substring(end);
          newCursorPosition = start + before.length + selectedText.length + after.length;
        } else {
          // Insert at cursor position
          newContent = value.substring(0, start) + before + after + value.substring(start);
          newCursorPosition = start + before.length;
        }
        
        onChangeText(newContent);
        
        // Update cursor position
        setTimeout(() => {
          const newSelection = { start: newCursorPosition, end: newCursorPosition };
          setSelection(newSelection);
          textInputRef.current?.setSelection?.(newCursorPosition, newCursorPosition);
        }, 10);
      },
      applyFormat: (format: FormatType) => {
        const config = FORMAT_CONFIGS[format];
        const { start, end } = selection;
        const selectedText = value.substring(start, end);
        
        let newContent: string;
        let newCursorPosition: number;
        
        // Handle line-based formats (headings, lists, quotes)
        if (['heading2', 'heading3', 'list', 'numberedList', 'quote'].includes(format)) {
          // Find the start of the current line
          const lineStart = value.lastIndexOf('\n', start - 1) + 1;
          const lineEnd = value.indexOf('\n', start);
          const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
          const currentLine = value.substring(lineStart, actualLineEnd);
          
          // For list items, handle numbering
          let formatPrefix = config.before;
          if (format === 'numberedList') {
            // Simple numbering - just use 1. for fallback
            formatPrefix = '1. ';
          }
          
          // Apply format to the line
          const formattedLine = formatPrefix + currentLine;
          newContent = value.substring(0, lineStart) + formattedLine + value.substring(actualLineEnd);
          newCursorPosition = lineStart + formatPrefix.length + (start - lineStart);
        } else {
          // Handle inline formats (bold, italic, highlight)
          if (selectedText) {
            // Wrap selected text
            newContent = value.substring(0, start) + config.before + selectedText + config.after + value.substring(end);
            newCursorPosition = start + config.before.length + selectedText.length + config.after.length;
          } else {
            // Insert placeholder text if no selection
            const placeholder = config.placeholder || '';
            newContent = value.substring(0, start) + config.before + placeholder + config.after + value.substring(start);
            newCursorPosition = start + config.before.length + placeholder.length;
          }
        }
        
        onChangeText(newContent);
        
        // Update cursor position
        setTimeout(() => {
          const newSelection = { start: newCursorPosition, end: newCursorPosition };
          setSelection(newSelection);
          textInputRef.current?.setSelection?.(newCursorPosition, newCursorPosition);
        }, 10);
      },
      getSelection: () => selection,
      setSelection: (start: number, end: number) => {
        // Ensure selection bounds are valid
        const textLength = value.length;
        const validStart = Math.max(0, Math.min(start, textLength));
        const validEnd = Math.max(validStart, Math.min(end, textLength));
        
        const newSelection = { start: validStart, end: validEnd };
        setSelection(newSelection);
        textInputRef.current?.setSelection?.(validStart, validEnd);
      },
    }), [value, selection, onChangeText]);

    const handleSelectionChange = useCallback((event: { nativeEvent: { selection: { start: number; end: number } } }) => {
      const { start, end } = event.nativeEvent.selection;
      
      // Ensure selection bounds are valid
      const textLength = value.length;
      const validStart = Math.max(0, Math.min(start, textLength));
      const validEnd = Math.max(validStart, Math.min(end, textLength));
      
      const newSelection = { start: validStart, end: validEnd };
      setSelection(newSelection);
      onSelectionChange?.(newSelection);
    }, [value.length, onSelectionChange]);

    return (
      <View style={[styles.container, style]}>
        <TextInput
          ref={textInputRef}
          value={value}
          onChangeText={onChangeText}
          onSelectionChange={handleSelectionChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          multiline
          textAlignVertical="top"
          selectionColor={theme.colors.primary}
          style={styles.textInput}
          scrollEnabled
          showsVerticalScrollIndicator
          testID={testID}
          // Basic accessibility
          accessible
          accessibilityRole="textbox"
          accessibilityLabel="Basic text editor"
          accessibilityHint="Simple text editor for sermon content"
          // Platform-specific optimizations
          {...Platform.select({
            web: {
              spellCheck: true,
              autoCorrect: false,
              autoComplete: 'off',
              autoCapitalize: 'sentences',
            },
            ios: {
              selectTextOnFocus: false,
              contextMenuHidden: false,
              keyboardDismissMode: 'interactive',
            },
            android: {
              selectTextOnFocus: false,
              contextMenuHidden: false,
              underlineColorAndroid: 'transparent',
            },
          })}
        />
      </View>
    );
  }
);

FallbackEditor.displayName = 'FallbackEditor';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
    textAlignVertical: 'top',
    // Platform-specific styles
    ...Platform.select({
      web: {
        outline: 'none',
        resize: 'none',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'Roboto',
        includeFontPadding: false,
      },
    }),
  },
});