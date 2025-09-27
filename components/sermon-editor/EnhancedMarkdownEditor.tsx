import { theme } from '@/constants/Theme';
import React, { useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { FormattingToolbar, FormatType } from './FormattingToolbar';
import { MarkdownEditor, MarkdownEditorHandle } from './MarkdownEditor';
import { MobileFloatingToolbar } from './MobileFloatingToolbar';

interface EnhancedMarkdownEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectionChange?: (selection: { start: number; end: number }) => void;
  placeholder?: string;
  viewMode?: 'markup' | 'formatted';
  onViewModeToggle?: () => void;
  onBibleVersePress?: () => void;
  style?: any;
  // Platform-specific props
  enableKeyboardShortcuts?: boolean;
  optimizeForLargeDocuments?: boolean;
  touchOptimizations?: boolean;
}

/**
 * Enhanced Markdown Editor with integrated formatting toolbar
 * 
 * This component combines the MarkdownEditor with FormattingToolbar and MobileFloatingToolbar
 * to provide a complete markdown editing experience with formatting capabilities.
 * 
 * Features:
 * - Desktop toolbar with all formatting options
 * - Mobile floating toolbar for selected text
 * - Responsive design based on screen size
 * - Integration with MarkdownEditor's formatting methods
 */
export const EnhancedMarkdownEditor: React.FC<EnhancedMarkdownEditorProps> = ({
  value,
  onChangeText,
  onSelectionChange,
  placeholder,
  viewMode = 'markup',
  onViewModeToggle,
  onBibleVersePress,
  style,
  enableKeyboardShortcuts = true,
  optimizeForLargeDocuments = true,
  touchOptimizations = true,
}) => {
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const { width } = useWindowDimensions();
  
  const isLargeScreen = width >= 768;
  const hasSelection = selection.start !== selection.end;

  const handleFormatPress = (format: FormatType) => {
    editorRef.current?.applyFormat(format);
  };

  const handleSelectionChange = (newSelection: { start: number; end: number }) => {
    setSelection(newSelection);
    onSelectionChange?.(newSelection);
  };

  const handleViewModeToggle = () => {
    onViewModeToggle?.();
  };

  const handleBibleVersePress = () => {
    onBibleVersePress?.();
  };

  return (
    <View style={[styles.container, style]}>
      {/* Mobile floating toolbar - shows when text is selected on small screens */}
      {!isLargeScreen && (
        <MobileFloatingToolbar
          onFormatPress={handleFormatPress}
          visible={hasSelection}
        />
      )}
      
      {/* Main formatting toolbar */}
      <FormattingToolbar
        onFormatPress={handleFormatPress}
        hasSelection={hasSelection}
        viewMode={viewMode}
        onViewModeToggle={handleViewModeToggle}
        onBibleVersePress={handleBibleVersePress}
        isLargeScreen={isLargeScreen}
      />
      
      {/* Markdown editor */}
      <MarkdownEditor
        ref={editorRef}
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={handleSelectionChange}
        viewMode={viewMode}
        placeholder={placeholder}
        style={styles.editor}
        enableKeyboardShortcuts={enableKeyboardShortcuts}
        optimizeForLargeDocuments={optimizeForLargeDocuments}
        touchOptimizations={touchOptimizations}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  editor: {
    flex: 1,
  },
});