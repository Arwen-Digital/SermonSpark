import { theme } from '@/constants/Theme';
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MarkdownEditor, MarkdownEditorHandle } from './MarkdownEditor';

/**
 * Demo component to test view mode switching functionality
 * This component demonstrates the implementation of task 5:
 * - Add viewMode prop to MarkdownEditor component ✓
 * - Implement preview rendering using react-native-markdown-display ✓
 * - Add smooth transition between markup and preview modes ✓
 * - Maintain cursor position during mode switches ✓
 */
export const ViewModeSwitchDemo: React.FC = () => {
  const [content, setContent] = useState(`# Sample Sermon Content

## Introduction
This is a **bold** statement and this is *italic* text.

> "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." - John 3:16

## Main Points
1. First point with **emphasis**
2. Second point with *style*
3. Third point with ==highlight==

### Subpoint
- Bullet point one
- Bullet point two
- Bullet point three

## Conclusion
This demonstrates the view mode switching functionality.`);

  const [viewMode, setViewMode] = useState<'markup' | 'formatted'>('markup');
  const [cursorInfo, setCursorInfo] = useState('Cursor: 0-0');
  const editorRef = useRef<MarkdownEditorHandle>(null);

  const toggleViewMode = () => {
    const newMode = viewMode === 'markup' ? 'formatted' : 'markup';
    console.log(`Switching from ${viewMode} to ${newMode}`);
    setViewMode(newMode);
  };

  const handleSelectionChange = (selection: { start: number; end: number }) => {
    setCursorInfo(`Cursor: ${selection.start}-${selection.end}`);
  };

  const insertSampleText = () => {
    editorRef.current?.insertText('\n\n**New content inserted!**');
  };

  const wrapWithBold = () => {
    editorRef.current?.wrapSelection('**', '**');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>View Mode Switch Demo</Text>
        <Text style={styles.subtitle}>Testing Task 5 Implementation</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, viewMode === 'markup' && styles.activeButton]} 
          onPress={() => setViewMode('markup')}
        >
          <Text style={[styles.buttonText, viewMode === 'markup' && styles.activeButtonText]}>
            Markup
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, viewMode === 'formatted' && styles.activeButton]} 
          onPress={() => setViewMode('formatted')}
        >
          <Text style={[styles.buttonText, viewMode === 'formatted' && styles.activeButtonText]}>
            Preview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toggleButton} onPress={toggleViewMode}>
          <Text style={styles.buttonText}>Toggle Mode</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoText}>Current Mode: {viewMode}</Text>
        <Text style={styles.infoText}>{cursorInfo}</Text>
      </View>

      {viewMode === 'markup' && (
        <View style={styles.editControls}>
          <TouchableOpacity style={styles.smallButton} onPress={insertSampleText}>
            <Text style={styles.smallButtonText}>Insert Text</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallButton} onPress={wrapWithBold}>
            <Text style={styles.smallButtonText}>Bold Selection</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.editorContainer}>
        <MarkdownEditor
          ref={editorRef}
          value={content}
          onChangeText={setContent}
          onSelectionChange={handleSelectionChange}
          viewMode={viewMode}
          placeholder="Start typing your sermon..."
          style={styles.editor}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ✓ View mode switching implemented
        </Text>
        <Text style={styles.footerText}>
          ✓ Cursor position maintained during switches
        </Text>
        <Text style={styles.footerText}>
          ✓ Smooth transitions between modes
        </Text>
        <Text style={styles.footerText}>
          ✓ Preview rendering with react-native-markdown-display
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  button: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.gray400,
  },
  activeButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  buttonText: {
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  activeButtonText: {
    color: theme.colors.background,
  },
  toggleButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.secondary,
    borderRadius: 8,
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  editControls: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  smallButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.gray400,
  },
  smallButtonText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
  },
  editorContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.gray400,
    borderRadius: 8,
    overflow: 'hidden',
  },
  editor: {
    flex: 1,
  },
  footer: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.success || theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
});