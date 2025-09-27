import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { MarkdownEditor, MarkdownEditorHandle } from '../MarkdownEditor';

// Mock useWindowDimensions
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    useWindowDimensions: jest.fn(),
  };
});

const mockUseWindowDimensions = useWindowDimensions as jest.MockedFunction<typeof useWindowDimensions>;

describe('MarkdownEditor Keyboard Shortcuts', () => {
  const defaultProps = {
    value: 'Test content with some selected text',
    onChangeText: jest.fn(),
    testID: 'markdown-editor',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWindowDimensions.mockReturnValue({ width: 1024, height: 768 });
    
    // Mock Platform.OS for web
    Object.defineProperty(Platform, 'OS', {
      get: () => 'web',
      configurable: true,
    });
  });

  describe('Web Keyboard Shortcuts', () => {
    it('should handle Ctrl+B for bold formatting', () => {
      const mockOnChangeText = jest.fn();
      const editorRef = React.createRef<MarkdownEditorHandle>();
      
      const { getByTestId } = render(
        <MarkdownEditor
          {...defaultProps}
          onChangeText={mockOnChangeText}
          ref={editorRef}
          enableKeyboardShortcuts={true}
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Set selection to simulate selected text
      editorRef.current?.setSelection(5, 12); // "content"
      
      // Simulate Ctrl+B keypress
      fireEvent(textInput, 'keyDown', {
        nativeEvent: {
          key: 'b',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
        },
      });

      // Should apply bold formatting
      expect(mockOnChangeText).toHaveBeenCalledWith(
        'Test **content** with some selected text'
      );
    });

    it('should handle Cmd+B for bold formatting on Mac', () => {
      const mockOnChangeText = jest.fn();
      const editorRef = React.createRef<MarkdownEditorHandle>();
      
      const { getByTestId } = render(
        <MarkdownEditor
          {...defaultProps}
          onChangeText={mockOnChangeText}
          ref={editorRef}
          enableKeyboardShortcuts={true}
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Set selection to simulate selected text
      editorRef.current?.setSelection(5, 12); // "content"
      
      // Simulate Cmd+B keypress (Mac)
      fireEvent(textInput, 'keyDown', {
        nativeEvent: {
          key: 'b',
          ctrlKey: false,
          metaKey: true,
          shiftKey: false,
        },
      });

      // Should apply bold formatting
      expect(mockOnChangeText).toHaveBeenCalledWith(
        'Test **content** with some selected text'
      );
    });

    it('should handle Ctrl+I for italic formatting', () => {
      const mockOnChangeText = jest.fn();
      const editorRef = React.createRef<MarkdownEditorHandle>();
      
      const { getByTestId } = render(
        <MarkdownEditor
          {...defaultProps}
          onChangeText={mockOnChangeText}
          ref={editorRef}
          enableKeyboardShortcuts={true}
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Set selection to simulate selected text
      editorRef.current?.setSelection(5, 12); // "content"
      
      // Simulate Ctrl+I keypress
      fireEvent(textInput, 'keyDown', {
        nativeEvent: {
          key: 'i',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
        },
      });

      // Should apply italic formatting
      expect(mockOnChangeText).toHaveBeenCalledWith(
        'Test *content* with some selected text'
      );
    });

    it('should handle Ctrl+Shift+2 for H2 heading', () => {
      const mockOnChangeText = jest.fn();
      const editorRef = React.createRef<MarkdownEditorHandle>();
      
      const { getByTestId } = render(
        <MarkdownEditor
          {...defaultProps}
          value="Test content"
          onChangeText={mockOnChangeText}
          ref={editorRef}
          enableKeyboardShortcuts={true}
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Set cursor position at beginning of line
      editorRef.current?.setSelection(0, 0);
      
      // Simulate Ctrl+Shift+2 keypress
      fireEvent(textInput, 'keyDown', {
        nativeEvent: {
          key: '2',
          ctrlKey: true,
          metaKey: false,
          shiftKey: true,
        },
      });

      // Should apply H2 formatting
      expect(mockOnChangeText).toHaveBeenCalledWith('## Test content');
    });

    it('should handle Ctrl+Shift+3 for H3 heading', () => {
      const mockOnChangeText = jest.fn();
      const editorRef = React.createRef<MarkdownEditorHandle>();
      
      const { getByTestId } = render(
        <MarkdownEditor
          {...defaultProps}
          value="Test content"
          onChangeText={mockOnChangeText}
          ref={editorRef}
          enableKeyboardShortcuts={true}
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Set cursor position at beginning of line
      editorRef.current?.setSelection(0, 0);
      
      // Simulate Ctrl+Shift+3 keypress
      fireEvent(textInput, 'keyDown', {
        nativeEvent: {
          key: '3',
          ctrlKey: true,
          metaKey: false,
          shiftKey: true,
        },
      });

      // Should apply H3 formatting
      expect(mockOnChangeText).toHaveBeenCalledWith('### Test content');
    });

    it('should handle Ctrl+L for list formatting', () => {
      const mockOnChangeText = jest.fn();
      const editorRef = React.createRef<MarkdownEditorHandle>();
      
      const { getByTestId } = render(
        <MarkdownEditor
          {...defaultProps}
          value="Test content"
          onChangeText={mockOnChangeText}
          ref={editorRef}
          enableKeyboardShortcuts={true}
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Set cursor position at beginning of line
      editorRef.current?.setSelection(0, 0);
      
      // Simulate Ctrl+L keypress
      fireEvent(textInput, 'keyDown', {
        nativeEvent: {
          key: 'l',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
        },
      });

      // Should apply list formatting
      expect(mockOnChangeText).toHaveBeenCalledWith('- Test content');
    });

    it('should handle Ctrl+Q for quote formatting', () => {
      const mockOnChangeText = jest.fn();
      const editorRef = React.createRef<MarkdownEditorHandle>();
      
      const { getByTestId } = render(
        <MarkdownEditor
          {...defaultProps}
          value="Test content"
          onChangeText={mockOnChangeText}
          ref={editorRef}
          enableKeyboardShortcuts={true}
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Set cursor position at beginning of line
      editorRef.current?.setSelection(0, 0);
      
      // Simulate Ctrl+Q keypress
      fireEvent(textInput, 'keyDown', {
        nativeEvent: {
          key: 'q',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
        },
      });

      // Should apply quote formatting
      expect(mockOnChangeText).toHaveBeenCalledWith('> Test content');
    });

    it('should handle Ctrl+H for highlight formatting', () => {
      const mockOnChangeText = jest.fn();
      const editorRef = React.createRef<MarkdownEditorHandle>();
      
      const { getByTestId } = render(
        <MarkdownEditor
          {...defaultProps}
          onChangeText={mockOnChangeText}
          ref={editorRef}
          enableKeyboardShortcuts={true}
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Set selection to simulate selected text
      editorRef.current?.setSelection(5, 12); // "content"
      
      // Simulate Ctrl+H keypress
      fireEvent(textInput, 'keyDown', {
        nativeEvent: {
          key: 'h',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
        },
      });

      // Should apply highlight formatting
      expect(mockOnChangeText).toHaveBeenCalledWith(
        'Test ==content== with some selected text'
      );
    });

    it('should not handle shortcuts when disabled', () => {
      const mockOnChangeText = jest.fn();
      const editorRef = React.createRef<MarkdownEditorHandle>();
      
      const { getByTestId } = render(
        <MarkdownEditor
          {...defaultProps}
          onChangeText={mockOnChangeText}
          ref={editorRef}
          enableKeyboardShortcuts={false}
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Set selection to simulate selected text
      editorRef.current?.setSelection(5, 12); // "content"
      
      // Simulate Ctrl+B keypress
      fireEvent(textInput, 'keyDown', {
        nativeEvent: {
          key: 'b',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
        },
      });

      // Should not apply formatting
      expect(mockOnChangeText).not.toHaveBeenCalled();
    });

    it('should not handle shortcuts on non-web platforms', () => {
      // Mock Platform.OS for iOS
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
        configurable: true,
      });

      const mockOnChangeText = jest.fn();
      const editorRef = React.createRef<MarkdownEditorHandle>();
      
      const { getByTestId } = render(
        <MarkdownEditor
          {...defaultProps}
          onChangeText={mockOnChangeText}
          ref={editorRef}
          enableKeyboardShortcuts={true}
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // onKeyDown should not be set on non-web platforms
      expect(textInput.props.onKeyDown).toBeUndefined();
    });

    it('should prevent default behavior for handled shortcuts', () => {
      const mockOnChangeText = jest.fn();
      const mockPreventDefault = jest.fn();
      const editorRef = React.createRef<MarkdownEditorHandle>();
      
      const { getByTestId } = render(
        <MarkdownEditor
          {...defaultProps}
          onChangeText={mockOnChangeText}
          ref={editorRef}
          enableKeyboardShortcuts={true}
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Set selection to simulate selected text
      editorRef.current?.setSelection(5, 12); // "content"
      
      // Simulate Ctrl+B keypress with preventDefault mock
      const event = {
        nativeEvent: {
          key: 'b',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
        },
        preventDefault: mockPreventDefault,
      };
      
      fireEvent(textInput, 'keyDown', event);

      // Should prevent default behavior
      expect(mockPreventDefault).toHaveBeenCalled();
    });

    it('should not prevent default for unhandled keys', () => {
      const mockOnChangeText = jest.fn();
      const mockPreventDefault = jest.fn();
      const editorRef = React.createRef<MarkdownEditorHandle>();
      
      const { getByTestId } = render(
        <MarkdownEditor
          {...defaultProps}
          onChangeText={mockOnChangeText}
          ref={editorRef}
          enableKeyboardShortcuts={true}
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Simulate Ctrl+Z keypress (not handled)
      const event = {
        nativeEvent: {
          key: 'z',
          ctrlKey: true,
          metaKey: false,
          shiftKey: false,
        },
        preventDefault: mockPreventDefault,
      };
      
      fireEvent(textInput, 'keyDown', event);

      // Should not prevent default behavior
      expect(mockPreventDefault).not.toHaveBeenCalled();
    });
  });
});