import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';
import { MarkdownEditor } from '../MarkdownEditor';

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'web',
  select: jest.fn(),
}));

describe('Keyboard Shortcuts Integration', () => {
  const mockOnChangeText = jest.fn();
  const mockOnSelectionChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'web';
  });

  const createKeyboardEvent = (key: string, modifiers: any = {}) => ({
    nativeEvent: {
      key,
      ctrlKey: modifiers.ctrlKey || false,
      metaKey: modifiers.metaKey || false,
      shiftKey: modifiers.shiftKey || false,
      altKey: modifiers.altKey || false,
    },
    preventDefault: jest.fn(),
  });

  describe('Basic Formatting Shortcuts', () => {
    it('handles Ctrl+B for bold formatting', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          value="test text"
          onChangeText={mockOnChangeText}
          onSelectionChange={mockOnSelectionChange}
          testID="markdown-editor"
          enableKeyboardShortcuts={true}
        />
      );

      const editor = getByTestId('markdown-editor');
      const keyEvent = createKeyboardEvent('b', { ctrlKey: true });
      
      fireEvent(editor, 'onKeyPress', keyEvent);
      
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('handles Cmd+I for italic formatting on Mac', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          value="test text"
          onChangeText={mockOnChangeText}
          onSelectionChange={mockOnSelectionChange}
          testID="markdown-editor"
          enableKeyboardShortcuts={true}
        />
      );

      const editor = getByTestId('markdown-editor');
      const keyEvent = createKeyboardEvent('i', { metaKey: true });
      
      fireEvent(editor, 'onKeyPress', keyEvent);
      
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('handles Ctrl+U for highlight formatting', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          value="test text"
          onChangeText={mockOnChangeText}
          onSelectionChange={mockOnSelectionChange}
          testID="markdown-editor"
          enableKeyboardShortcuts={true}
        />
      );

      const editor = getByTestId('markdown-editor');
      const keyEvent = createKeyboardEvent('u', { ctrlKey: true });
      
      fireEvent(editor, 'onKeyPress', keyEvent);
      
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('handles Ctrl+L for list formatting', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          value="test text"
          onChangeText={mockOnChangeText}
          onSelectionChange={mockOnSelectionChange}
          testID="markdown-editor"
          enableKeyboardShortcuts={true}
        />
      );

      const editor = getByTestId('markdown-editor');
      const keyEvent = createKeyboardEvent('l', { ctrlKey: true });
      
      fireEvent(editor, 'onKeyPress', keyEvent);
      
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('handles Ctrl+Q for quote formatting', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          value="test text"
          onChangeText={mockOnChangeText}
          onSelectionChange={mockOnSelectionChange}
          testID="markdown-editor"
          enableKeyboardShortcuts={true}
        />
      );

      const editor = getByTestId('markdown-editor');
      const keyEvent = createKeyboardEvent('q', { ctrlKey: true });
      
      fireEvent(editor, 'onKeyPress', keyEvent);
      
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('handles Ctrl+E for code formatting', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          value="test text"
          onChangeText={mockOnChangeText}
          onSelectionChange={mockOnSelectionChange}
          testID="markdown-editor"
          enableKeyboardShortcuts={true}
        />
      );

      const editor = getByTestId('markdown-editor');
      const keyEvent = createKeyboardEvent('e', { ctrlKey: true });
      
      fireEvent(editor, 'onKeyPress', keyEvent);
      
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('handles Ctrl+K for link formatting', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          value="test text"
          onChangeText={mockOnChangeText}
          onSelectionChange={mockOnSelectionChange}
          testID="markdown-editor"
          enableKeyboardShortcuts={true}
        />
      );

      const editor = getByTestId('markdown-editor');
      const keyEvent = createKeyboardEvent('k', { ctrlKey: true });
      
      fireEvent(editor, 'onKeyPress', keyEvent);
      
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Heading Shortcuts', () => {
    it('handles Ctrl+Shift+2 for heading 2', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          value="test text"
          onChangeText={mockOnChangeText}
          onSelectionChange={mockOnSelectionChange}
          testID="markdown-editor"
          enableKeyboardShortcuts={true}
        />
      );

      const editor = getByTestId('markdown-editor');
      const keyEvent = createKeyboardEvent('2', { ctrlKey: true, shiftKey: true });
      
      fireEvent(editor, 'onKeyPress', keyEvent);
      
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('handles Ctrl+Shift+3 for heading 3', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          value="test text"
          onChangeText={mockOnChangeText}
          onSelectionChange={mockOnSelectionChange}
          testID="markdown-editor"
          enableKeyboardShortcuts={true}
        />
      );

      const editor = getByTestId('markdown-editor');
      const keyEvent = createKeyboardEvent('3', { ctrlKey: true, shiftKey: true });
      
      fireEvent(editor, 'onKeyPress', keyEvent);
      
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Advanced Shortcuts', () => {
    it('handles Ctrl+Shift+L for numbered list', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          value="test text"
          onChangeText={mockOnChangeText}
          onSelectionChange={mockOnSelectionChange}
          testID="markdown-editor"
          enableKeyboardShortcuts={true}
        />
      );

      const editor = getByTestId('markdown-editor');
      const keyEvent = createKeyboardEvent('l', { ctrlKey: true, shiftKey: true });
      
      fireEvent(editor, 'onKeyPress', keyEvent);
      
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('handles Ctrl+Shift+S for strikethrough', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          value="test text"
          onChangeText={mockOnChangeText}
          onSelectionChange={mockOnSelectionChange}
          testID="markdown-editor"
          enableKeyboardShortcuts={true}
        />
      );

      const editor = getByTestId('markdown-editor');
      const keyEvent = createKeyboardEvent('s', { ctrlKey: true, shiftKey: true });
      
      fireEvent(editor, 'onKeyPress', keyEvent);
      
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });

    it('handles Escape key to blur editor', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          value="test text"
          onChangeText={mockOnChangeText}
          onSelectionChange={mockOnSelectionChange}
          testID="markdown-editor"
          enableKeyboardShortcuts={true}
        />
      );

      const editor = getByTestId('markdown-editor');
      const keyEvent = createKeyboardEvent('Escape');
      
      fireEvent(editor, 'onKeyPress', keyEvent);
      
      // Should not prevent default for Escape (let it blur naturally)
      expect(keyEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts Disabled', () => {
    it('does not handle shortcuts when enableKeyboardShortcuts is false', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          value="test text"
          onChangeText={mockOnChangeText}
          onSelectionChange={mockOnSelectionChange}
          testID="markdown-editor"
          enableKeyboardShortcuts={false}
        />
      );

      const editor = getByTestId('markdown-editor');
      const keyEvent = createKeyboardEvent('b', { ctrlKey: true });
      
      fireEvent(editor, 'onKeyPress', keyEvent);
      
      expect(keyEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('does not handle shortcuts on non-web platforms', () => {
      Platform.OS = 'ios';
      
      const { getByTestId } = render(
        <MarkdownEditor
          value="test text"
          onChangeText={mockOnChangeText}
          onSelectionChange={mockOnSelectionChange}
          testID="markdown-editor"
          enableKeyboardShortcuts={true}
        />
      );

      const editor = getByTestId('markdown-editor');
      const keyEvent = createKeyboardEvent('b', { ctrlKey: true });
      
      fireEvent(editor, 'onKeyPress', keyEvent);
      
      expect(keyEvent.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Modifier Key Combinations', () => {
    it('ignores shortcuts with Alt key pressed', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          value="test text"
          onChangeText={mockOnChangeText}
          onSelectionChange={mockOnSelectionChange}
          testID="markdown-editor"
          enableKeyboardShortcuts={true}
        />
      );

      const editor = getByTestId('markdown-editor');
      const keyEvent = createKeyboardEvent('b', { ctrlKey: true, altKey: true });
      
      fireEvent(editor, 'onKeyPress', keyEvent);
      
      expect(keyEvent.preventDefault).not.toHaveBeenCalled();
    });

    it('handles both Ctrl and Cmd modifiers', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          value="test text"
          onChangeText={mockOnChangeText}
          onSelectionChange={mockOnSelectionChange}
          testID="markdown-editor"
          enableKeyboardShortcuts={true}
        />
      );

      const editor = getByTestId('markdown-editor');
      
      // Test Ctrl
      const ctrlEvent = createKeyboardEvent('b', { ctrlKey: true });
      fireEvent(editor, 'onKeyPress', ctrlEvent);
      expect(ctrlEvent.preventDefault).toHaveBeenCalled();

      // Test Cmd
      const cmdEvent = createKeyboardEvent('b', { metaKey: true });
      fireEvent(editor, 'onKeyPress', cmdEvent);
      expect(cmdEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Case Insensitive Shortcuts', () => {
    it('handles uppercase letters in shortcuts', () => {
      const { getByTestId } = render(
        <MarkdownEditor
          value="test text"
          onChangeText={mockOnChangeText}
          onSelectionChange={mockOnSelectionChange}
          testID="markdown-editor"
          enableKeyboardShortcuts={true}
        />
      );

      const editor = getByTestId('markdown-editor');
      const keyEvent = createKeyboardEvent('B', { ctrlKey: true });
      
      fireEvent(editor, 'onKeyPress', keyEvent);
      
      expect(keyEvent.preventDefault).toHaveBeenCalled();
    });
  });
});