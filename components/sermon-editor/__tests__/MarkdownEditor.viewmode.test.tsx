import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { MarkdownEditor, MarkdownEditorHandle } from '../MarkdownEditor';

// Mock react-native-markdown-display
jest.mock('react-native-markdown-display', () => {
  const { Text, View } = require('react-native');
  return ({ children, style }: any) => (
    <View testID="markdown-preview" style={style?.body}>
      <Text>{children}</Text>
    </View>
  );
});

describe('MarkdownEditor View Mode Switching', () => {
  const defaultProps = {
    value: '# Test Heading\n\nThis is **bold** text and *italic* text.\n\n> This is a quote',
    onChangeText: jest.fn(),
    onSelectionChange: jest.fn(),
    placeholder: 'Enter your text...',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Markup Mode', () => {
    it('should render TextInput in markup mode by default', () => {
      const { getByDisplayValue, queryByTestId } = render(
        <MarkdownEditor {...defaultProps} />
      );

      expect(getByDisplayValue(defaultProps.value)).toBeTruthy();
      expect(queryByTestId('markdown-preview')).toBeNull();
    });

    it('should render TextInput when viewMode is explicitly set to markup', () => {
      const { getByDisplayValue, queryByTestId } = render(
        <MarkdownEditor {...defaultProps} viewMode="markup" />
      );

      expect(getByDisplayValue(defaultProps.value)).toBeTruthy();
      expect(queryByTestId('markdown-preview')).toBeNull();
    });

    it('should handle text input and selection changes in markup mode', () => {
      const onChangeText = jest.fn();
      const onSelectionChange = jest.fn();
      
      const { getByDisplayValue } = render(
        <MarkdownEditor 
          {...defaultProps} 
          onChangeText={onChangeText}
          onSelectionChange={onSelectionChange}
          viewMode="markup"
        />
      );

      const textInput = getByDisplayValue(defaultProps.value);
      
      fireEvent.changeText(textInput, 'New text content');
      expect(onChangeText).toHaveBeenCalledWith('New text content');

      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 5, end: 10 } }
      });
      expect(onSelectionChange).toHaveBeenCalledWith({ start: 5, end: 10 });
    });
  });

  describe('Preview Mode', () => {
    it('should render markdown preview when viewMode is formatted', () => {
      const { queryByDisplayValue, getByTestId } = render(
        <MarkdownEditor {...defaultProps} viewMode="formatted" />
      );

      expect(queryByDisplayValue(defaultProps.value)).toBeNull();
      expect(getByTestId('markdown-preview')).toBeTruthy();
    });

    it('should display markdown content in preview mode', () => {
      const { getByTestId } = render(
        <MarkdownEditor {...defaultProps} viewMode="formatted" />
      );

      const preview = getByTestId('markdown-preview');
      expect(preview).toBeTruthy();
      // The mock component should render the markdown content as text
      expect(preview.props.children.props.children).toBe(defaultProps.value);
    });

    it('should show placeholder when value is empty in preview mode', () => {
      const { getByTestId } = render(
        <MarkdownEditor 
          {...defaultProps} 
          value=""
          viewMode="formatted" 
        />
      );

      const preview = getByTestId('markdown-preview');
      expect(preview.props.children.props.children).toBe(defaultProps.placeholder);
    });
  });

  describe('Mode Switching', () => {
    it('should switch from markup to preview mode', () => {
      const { rerender, getByDisplayValue, queryByDisplayValue, getByTestId } = render(
        <MarkdownEditor {...defaultProps} viewMode="markup" />
      );

      // Initially in markup mode
      expect(getByDisplayValue(defaultProps.value)).toBeTruthy();

      // Switch to preview mode
      rerender(<MarkdownEditor {...defaultProps} viewMode="formatted" />);

      expect(queryByDisplayValue(defaultProps.value)).toBeNull();
      expect(getByTestId('markdown-preview')).toBeTruthy();
    });

    it('should switch from preview to markup mode', () => {
      const { rerender, queryByDisplayValue, getByDisplayValue, queryByTestId } = render(
        <MarkdownEditor {...defaultProps} viewMode="formatted" />
      );

      // Initially in preview mode
      expect(queryByDisplayValue(defaultProps.value)).toBeNull();
      expect(queryByTestId('markdown-preview')).toBeTruthy();

      // Switch to markup mode
      rerender(<MarkdownEditor {...defaultProps} viewMode="markup" />);

      expect(getByDisplayValue(defaultProps.value)).toBeTruthy();
      expect(queryByTestId('markdown-preview')).toBeNull();
    });

    it('should maintain cursor position during mode switches', async () => {
      const ref = React.createRef<MarkdownEditorHandle>();
      const { rerender } = render(
        <MarkdownEditor {...defaultProps} viewMode="markup" ref={ref} />
      );

      // Set cursor position
      ref.current?.setSelection(10, 10);
      
      // Switch to preview mode
      rerender(<MarkdownEditor {...defaultProps} viewMode="formatted" ref={ref} />);
      
      // Switch back to markup mode
      rerender(<MarkdownEditor {...defaultProps} viewMode="markup" ref={ref} />);

      // Wait for cursor position to be restored
      await waitFor(() => {
        const selection = ref.current?.getSelection();
        expect(selection?.start).toBe(10);
        expect(selection?.end).toBe(10);
      }, { timeout: 200 });
    });
  });

  describe('Ref Methods in Different Modes', () => {
    it('should handle ref methods correctly in markup mode', () => {
      const ref = React.createRef<MarkdownEditorHandle>();
      render(<MarkdownEditor {...defaultProps} viewMode="markup" ref={ref} />);

      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.blur).toBeDefined();
      expect(ref.current?.insertText).toBeDefined();
      expect(ref.current?.wrapSelection).toBeDefined();
      expect(ref.current?.getSelection).toBeDefined();
      expect(ref.current?.setSelection).toBeDefined();

      // Test getSelection
      const selection = ref.current?.getSelection();
      expect(selection).toEqual({ start: 0, end: 0 });
    });

    it('should handle ref methods correctly in preview mode', () => {
      const ref = React.createRef<MarkdownEditorHandle>();
      render(<MarkdownEditor {...defaultProps} viewMode="formatted" ref={ref} />);

      // Ref methods should still be available even in preview mode
      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.blur).toBeDefined();
      expect(ref.current?.insertText).toBeDefined();
      expect(ref.current?.wrapSelection).toBeDefined();
      expect(ref.current?.getSelection).toBeDefined();
      expect(ref.current?.setSelection).toBeDefined();
    });

    it('should not crash when calling text manipulation methods in preview mode', () => {
      const ref = React.createRef<MarkdownEditorHandle>();
      const onChangeText = jest.fn();
      
      render(
        <MarkdownEditor 
          {...defaultProps} 
          viewMode="formatted" 
          ref={ref}
          onChangeText={onChangeText}
        />
      );

      // These should not crash even though we're in preview mode
      expect(() => {
        ref.current?.insertText('test');
        ref.current?.wrapSelection('**', '**');
        ref.current?.setSelection(5, 10);
      }).not.toThrow();
    });
  });

  describe('Smooth Transitions', () => {
    it('should handle rapid mode switching without errors', () => {
      const { rerender } = render(
        <MarkdownEditor {...defaultProps} viewMode="markup" />
      );

      // Rapidly switch modes multiple times
      for (let i = 0; i < 5; i++) {
        rerender(<MarkdownEditor {...defaultProps} viewMode="formatted" />);
        rerender(<MarkdownEditor {...defaultProps} viewMode="markup" />);
      }

      // Should not crash or throw errors
      expect(true).toBe(true);
    });

    it('should preserve content during mode switches', () => {
      const testContent = '# Dynamic Content\n\nThis content should persist.';
      const { rerender, getByDisplayValue, queryByDisplayValue, getByTestId } = render(
        <MarkdownEditor {...defaultProps} value={testContent} viewMode="markup" />
      );

      // Verify content in markup mode
      expect(getByDisplayValue(testContent)).toBeTruthy();

      // Switch to preview mode
      rerender(<MarkdownEditor {...defaultProps} value={testContent} viewMode="formatted" />);
      
      // Verify content is passed to preview
      const preview = getByTestId('markdown-preview');
      expect(preview.props.children.props.children).toBe(testContent);

      // Switch back to markup mode
      rerender(<MarkdownEditor {...defaultProps} value={testContent} viewMode="markup" />);
      
      // Verify content is still there
      expect(getByDisplayValue(testContent)).toBeTruthy();
    });
  });
});