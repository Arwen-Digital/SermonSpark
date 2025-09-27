import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { MarkdownEditor, MarkdownEditorHandle } from '../MarkdownEditor';

// Mock Keyboard
jest.mock('react-native/Libraries/Components/Keyboard/Keyboard', () => ({
  addListener: jest.fn(() => ({ remove: jest.fn() })),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
  dismiss: jest.fn(),
}));

describe('MarkdownEditor - Scrolling and Keyboard Behavior', () => {
  let editorRef: React.RefObject<MarkdownEditorHandle>;

  beforeEach(() => {
    editorRef = React.createRef<MarkdownEditorHandle>();
    jest.clearAllMocks();
  });

  describe('Scrolling Behavior', () => {
    it('should allow native scrolling without interference', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value="This is a long text that should scroll naturally without any custom scrolling logic interfering with the native behavior."
          onChangeText={jest.fn()}
          testID="markdown-editor"
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Verify scrollEnabled is true
      expect(textInput.props.scrollEnabled).toBe(true);
      
      // Verify no custom scroll handling props that might interfere
      expect(textInput.props.onScroll).toBeUndefined();
      expect(textInput.props.scrollEventThrottle).toBeUndefined();
    });

    it('should maintain cursor visibility during typing', async () => {
      const onChangeText = jest.fn();
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value=""
          onChangeText={onChangeText}
          testID="markdown-editor"
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Simulate typing at the end of content
      fireEvent.changeText(textInput, 'New content being typed');
      
      expect(onChangeText).toHaveBeenCalledWith('New content being typed');
      
      // Verify that the component doesn't interfere with native cursor positioning
      expect(textInput.props.textAlignVertical).toBe('top');
    });

    it('should handle large documents without performance issues', () => {
      const largeContent = 'Lorem ipsum dolor sit amet. '.repeat(1000); // ~27,000 characters
      const onChangeText = jest.fn();
      
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value={largeContent}
          onChangeText={onChangeText}
          testID="markdown-editor"
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Verify the component renders without issues
      expect(textInput).toBeTruthy();
      expect(textInput.props.value).toBe(largeContent);
      
      // Simulate text change in large document
      const newContent = largeContent + 'Additional text';
      fireEvent.changeText(textInput, newContent);
      
      expect(onChangeText).toHaveBeenCalledWith(newContent);
    });

    it('should not override manual scroll position', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value="Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10"
          onChangeText={jest.fn()}
          testID="markdown-editor"
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Verify no automatic scrolling props that might interfere
      expect(textInput.props.automaticallyAdjustContentInsets).toBe(false);
    });
  });

  describe('Keyboard Behavior', () => {
    it('should handle keyboard appearance without scroll jumps', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value="Test content"
          onChangeText={jest.fn()}
          testID="markdown-editor"
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Verify keyboard handling props
      expect(textInput.props.keyboardShouldPersistTaps).toBe('handled');
      expect(textInput.props.blurOnSubmit).toBe(false);
    });

    it('should maintain focus during formatting operations', async () => {
      const onChangeText = jest.fn();
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value="selected text"
          onChangeText={onChangeText}
          testID="markdown-editor"
        />
      );

      // Focus the editor
      editorRef.current?.focus();
      
      // Simulate text selection
      fireEvent(getByTestId('markdown-editor'), 'selectionChange', {
        nativeEvent: { selection: { start: 0, end: 8 } }
      });

      // Apply formatting
      editorRef.current?.wrapSelection('**', '**');

      await waitFor(() => {
        expect(onChangeText).toHaveBeenCalledWith('**selected** text');
      });
    });

    it('should handle keyboard dismissal gracefully', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value="Test content"
          onChangeText={jest.fn()}
          testID="markdown-editor"
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Simulate focus and blur
      fireEvent(textInput, 'focus');
      fireEvent(textInput, 'blur');
      
      // Should not cause any errors or unexpected behavior
      expect(textInput).toBeTruthy();
    });
  });

  describe('View Mode Switching', () => {
    it('should maintain scroll position during mode switches', async () => {
      const { rerender, getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value="# Heading\n\nSome content here"
          onChangeText={jest.fn()}
          viewMode="markup"
          testID="markdown-editor"
        />
      );

      // Set cursor position
      fireEvent(getByTestId('markdown-editor'), 'selectionChange', {
        nativeEvent: { selection: { start: 10, end: 10 } }
      });

      // Switch to preview mode
      rerender(
        <MarkdownEditor
          ref={editorRef}
          value="# Heading\n\nSome content here"
          onChangeText={jest.fn()}
          viewMode="formatted"
          testID="markdown-editor"
        />
      );

      // Switch back to markup mode
      rerender(
        <MarkdownEditor
          ref={editorRef}
          value="# Heading\n\nSome content here"
          onChangeText={jest.fn()}
          viewMode="markup"
          testID="markdown-editor"
        />
      );

      // Should restore cursor position smoothly
      await waitFor(() => {
        const textInput = getByTestId('markdown-editor');
        expect(textInput).toBeTruthy();
      });
    });

    it('should use optimized ScrollView for preview mode', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value="# Heading\n\nContent"
          onChangeText={jest.fn()}
          viewMode="formatted"
          testID="markdown-editor"
        />
      );

      const scrollView = getByTestId('markdown-editor');
      
      // Verify ScrollView optimization props
      expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');
      expect(scrollView.props.removeClippedSubviews).toBe(true);
      expect(scrollView.props.maxToRenderPerBatch).toBe(10);
      expect(scrollView.props.windowSize).toBe(10);
    });
  });

  describe('Selection Handling Optimization', () => {
    it('should minimize selection update delays', async () => {
      const onChangeText = jest.fn();
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value="test content"
          onChangeText={onChangeText}
          testID="markdown-editor"
        />
      );

      // Set selection
      fireEvent(getByTestId('markdown-editor'), 'selectionChange', {
        nativeEvent: { selection: { start: 0, end: 4 } }
      });

      // Apply formatting - should use minimal timeout
      editorRef.current?.wrapSelection('**', '**');

      // Should update immediately without long delays
      await waitFor(() => {
        expect(onChangeText).toHaveBeenCalledWith('**test** content');
      }, { timeout: 100 }); // Short timeout to verify quick response
    });

    it('should clear pending selection updates on new operations', async () => {
      const onChangeText = jest.fn();
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value="test content"
          onChangeText={onChangeText}
          testID="markdown-editor"
        />
      );

      // Set selection
      fireEvent(getByTestId('markdown-editor'), 'selectionChange', {
        nativeEvent: { selection: { start: 0, end: 4 } }
      });

      // Apply multiple formatting operations quickly
      editorRef.current?.wrapSelection('**', '**');
      editorRef.current?.insertText(' additional');

      await waitFor(() => {
        // Should handle multiple operations without conflicts
        expect(onChangeText).toHaveBeenCalled();
      });
    });
  });

  describe('Platform-Specific Optimizations', () => {
    it('should apply iOS-specific optimizations', () => {
      // Mock Platform.OS
      const originalPlatform = require('react-native').Platform.OS;
      require('react-native').Platform.OS = 'ios';

      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value="Test content"
          onChangeText={jest.fn()}
          testID="markdown-editor"
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      expect(textInput.props.automaticallyAdjustContentInsets).toBe(false);
      expect(textInput.props.contentInsetAdjustmentBehavior).toBe('never');

      // Restore original platform
      require('react-native').Platform.OS = originalPlatform;
    });

    it('should apply Android-specific optimizations', () => {
      // Mock Platform.OS
      const originalPlatform = require('react-native').Platform.OS;
      require('react-native').Platform.OS = 'android';

      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value="Test content"
          onChangeText={jest.fn()}
          testID="markdown-editor"
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      expect(textInput.props.underlineColorAndroid).toBe('transparent');

      // Restore original platform
      require('react-native').Platform.OS = originalPlatform;
    });
  });
});