/**
 * Manual test file for MarkdownEditor component
 * This file demonstrates the basic usage and verifies the component interface
 * Run this by importing and using the component in a React Native app
 */

import React, { useRef } from 'react';
import { Button, View } from 'react-native';
import { MarkdownEditor, MarkdownEditorHandle } from '../MarkdownEditor';

export const MarkdownEditorManualTest: React.FC = () => {
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const [content, setContent] = React.useState('# Hello World\n\nThis is a **test** of the markdown editor.');

  const testInsertText = () => {
    editorRef.current?.insertText('\n\nInserted text!');
  };

  const testWrapSelection = () => {
    editorRef.current?.wrapSelection('**', '**');
  };

  const testFocus = () => {
    editorRef.current?.focus();
  };

  const testGetSelection = () => {
    const selection = editorRef.current?.getSelection();
    console.log('Current selection:', selection);
  };

  const testSetSelection = () => {
    // Select the word "test" in the initial content
    editorRef.current?.setSelection(25, 29);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <MarkdownEditor
        ref={editorRef}
        value={content}
        onChangeText={setContent}
        placeholder="Enter your markdown here..."
        viewMode="markup"
        onSelectionChange={(selection) => {
          console.log('Selection changed:', selection);
        }}
      />
      
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        <Button title="Insert Text" onPress={testInsertText} />
        <Button title="Wrap Selection" onPress={testWrapSelection} />
        <Button title="Focus" onPress={testFocus} />
        <Button title="Get Selection" onPress={testGetSelection} />
        <Button title="Set Selection" onPress={testSetSelection} />
      </View>
    </View>
  );
};

// Test cases that should pass:
// 1. Component renders without crashing
// 2. Displays initial content
// 3. Responds to text changes
// 4. Exposes all required ref methods
// 5. Handles selection changes
// 6. Supports different view modes
// 7. Applies custom styles

// Selection Management Test Cases:
// 8. onSelectionChange callback is called when selection changes
// 9. getSelection returns current selection state
// 10. setSelection programmatically updates selection
// 11. Selection bounds are validated and corrected
// 12. insertText maintains proper cursor positioning
// 13. wrapSelection handles both selected text and cursor insertion
// 14. Selection state is properly managed internally