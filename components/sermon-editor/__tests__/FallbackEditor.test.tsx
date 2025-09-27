import { fireEvent, render } from '@testing-library/react-native';
import React, { createRef } from 'react';
import { FallbackEditor } from '../FallbackEditor';
import { MarkdownEditorHandle } from '../MarkdownEditor';

describe('FallbackEditor', () => {
  const defaultProps = {
    value: '',
    onChangeText: jest.fn(),
    onSelectionChange: jest.fn(),
    placeholder: 'Enter text here',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial value', () => {
    const { getByDisplayValue } = render(
      <FallbackEditor {...defaultProps} value="Initial content" />
    );

    expect(getByDisplayValue('Initial content')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue } = render(
      <FallbackEditor {...defaultProps} onChangeText={onChangeText} value="test" />
    );

    const textInput = getByDisplayValue('test');
    fireEvent.changeText(textInput, 'new text');

    expect(onChangeText).toHaveBeenCalledWith('new text');
  });

  it('calls onSelectionChange when selection changes', () => {
    const onSelectionChange = jest.fn();
    const { getByDisplayValue } = render(
      <FallbackEditor {...defaultProps} onSelectionChange={onSelectionChange} value="test" />
    );

    const textInput = getByDisplayValue('test');
    fireEvent(textInput, 'selectionChange', {
      nativeEvent: { selection: { start: 1, end: 3 } }
    });

    expect(onSelectionChange).toHaveBeenCalledWith({ start: 1, end: 3 });
  });

  it('handles selection bounds validation', () => {
    const onSelectionChange = jest.fn();
    const { getByDisplayValue } = render(
      <FallbackEditor {...defaultProps} onSelectionChange={onSelectionChange} value="test" />
    );

    const textInput = getByDisplayValue('test');
    
    // Test selection beyond text length
    fireEvent(textInput, 'selectionChange', {
      nativeEvent: { selection: { start: 10, end: 20 } }
    });

    expect(onSelectionChange).toHaveBeenCalledWith({ start: 4, end: 4 });
  });

  it('handles negative selection values', () => {
    const onSelectionChange = jest.fn();
    const { getByDisplayValue } = render(
      <FallbackEditor {...defaultProps} onSelectionChange={onSelectionChange} value="test" />
    );

    const textInput = getByDisplayValue('test');
    
    fireEvent(textInput, 'selectionChange', {
      nativeEvent: { selection: { start: -1, end: -1 } }
    });

    expect(onSelectionChange).toHaveBeenCalledWith({ start: 0, end: 0 });
  });

  describe('Imperative Handle Methods', () => {
    it('exposes focus method', () => {
      const ref = createRef<MarkdownEditorHandle>();
      render(<FallbackEditor {...defaultProps} ref={ref} />);

      expect(ref.current?.focus).toBeDefined();
      expect(typeof ref.current?.focus).toBe('function');
    });

    it('exposes blur method', () => {
      const ref = createRef<MarkdownEditorHandle>();
      render(<FallbackEditor {...defaultProps} ref={ref} />);

      expect(ref.current?.blur).toBeDefined();
      expect(typeof ref.current?.blur).toBe('function');
    });

    it('insertText method works correctly', async () => {
      const onChangeText = jest.fn();
      const ref = createRef<MarkdownEditorHandle>();
      
      render(
        <FallbackEditor 
          {...defaultProps} 
          ref={ref} 
          value="Hello world" 
          onChangeText={onChangeText}
        />
      );

      // Simulate cursor at position 5 (after "Hello")
      ref.current?.setSelection(5, 5);
      ref.current?.insertText(' beautiful');

      expect(onChangeText).toHaveBeenCalledWith('Hello beautiful world');
    });

    it('wrapSelection method works with selected text', async () => {
      const onChangeText = jest.fn();
      const ref = createRef<MarkdownEditorHandle>();
      
      render(
        <FallbackEditor 
          {...defaultProps} 
          ref={ref} 
          value="Hello world" 
          onChangeText={onChangeText}
        />
      );

      // Simulate selecting "world" (positions 6-11)
      ref.current?.setSelection(6, 11);
      ref.current?.wrapSelection('**', '**');

      expect(onChangeText).toHaveBeenCalledWith('Hello **world**');
    });

    it('wrapSelection method works without selection', async () => {
      const onChangeText = jest.fn();
      const ref = createRef<MarkdownEditorHandle>();
      
      render(
        <FallbackEditor 
          {...defaultProps} 
          ref={ref} 
          value="Hello world" 
          onChangeText={onChangeText}
        />
      );

      // Simulate cursor at position 5
      ref.current?.setSelection(5, 5);
      ref.current?.wrapSelection('**', '**');

      expect(onChangeText).toHaveBeenCalledWith('Hello** world**');
    });

    it('applyFormat method works for inline formats', async () => {
      const onChangeText = jest.fn();
      const ref = createRef<MarkdownEditorHandle>();
      
      render(
        <FallbackEditor 
          {...defaultProps} 
          ref={ref} 
          value="Hello world" 
          onChangeText={onChangeText}
        />
      );

      // Select "world" and apply bold
      ref.current?.setSelection(6, 11);
      ref.current?.applyFormat('bold');

      expect(onChangeText).toHaveBeenCalledWith('Hello **world**');
    });

    it('applyFormat method works for line-based formats', async () => {
      const onChangeText = jest.fn();
      const ref = createRef<MarkdownEditorHandle>();
      
      render(
        <FallbackEditor 
          {...defaultProps} 
          ref={ref} 
          value="Hello world\nSecond line" 
          onChangeText={onChangeText}
        />
      );

      // Position cursor on first line
      ref.current?.setSelection(5, 5);
      ref.current?.applyFormat('heading2');

      expect(onChangeText).toHaveBeenCalledWith('## Hello world\nSecond line');
    });

    it('applyFormat method works for numbered lists', async () => {
      const onChangeText = jest.fn();
      const ref = createRef<MarkdownEditorHandle>();
      
      render(
        <FallbackEditor 
          {...defaultProps} 
          ref={ref} 
          value="First item" 
          onChangeText={onChangeText}
        />
      );

      ref.current?.setSelection(0, 0);
      ref.current?.applyFormat('numberedList');

      expect(onChangeText).toHaveBeenCalledWith('1. First item');
    });

    it('getSelection method returns current selection', () => {
      const ref = createRef<MarkdownEditorHandle>();
      render(<FallbackEditor {...defaultProps} ref={ref} value="test" />);

      const selection = ref.current?.getSelection();
      expect(selection).toEqual({ start: 0, end: 0 });
    });

    it('setSelection method validates bounds', () => {
      const ref = createRef<MarkdownEditorHandle>();
      render(<FallbackEditor {...defaultProps} ref={ref} value="test" />);

      // Test setting selection beyond text length
      ref.current?.setSelection(10, 20);
      const selection = ref.current?.getSelection();
      expect(selection).toEqual({ start: 4, end: 4 });
    });

    it('setSelection method handles negative values', () => {
      const ref = createRef<MarkdownEditorHandle>();
      render(<FallbackEditor {...defaultProps} ref={ref} value="test" />);

      ref.current?.setSelection(-1, -1);
      const selection = ref.current?.getSelection();
      expect(selection).toEqual({ start: 0, end: 0 });
    });
  });

  it('displays placeholder when value is empty', () => {
    const { getByPlaceholderText } = render(
      <FallbackEditor {...defaultProps} placeholder="Type here..." />
    );

    expect(getByPlaceholderText('Type here...')).toBeTruthy();
  });

  it('has correct accessibility properties', () => {
    const { getByRole } = render(<FallbackEditor {...defaultProps} />);

    const textInput = getByRole('textbox');
    expect(textInput.props.accessible).toBe(true);
    expect(textInput.props.accessibilityLabel).toBe('Basic text editor');
  });

  it('applies custom testID', () => {
    const { getByTestId } = render(
      <FallbackEditor {...defaultProps} testID="custom-editor" />
    );

    expect(getByTestId('custom-editor')).toBeTruthy();
  });

  it('handles multiline text correctly', () => {
    const multilineText = 'Line 1\nLine 2\nLine 3';
    const { getByDisplayValue } = render(
      <FallbackEditor {...defaultProps} value={multilineText} />
    );

    expect(getByDisplayValue(multilineText)).toBeTruthy();
  });

  it('handles empty text correctly', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <FallbackEditor 
        {...defaultProps} 
        value="" 
        onChangeText={onChangeText}
        placeholder="Empty editor"
      />
    );

    const textInput = getByPlaceholderText('Empty editor');
    fireEvent.changeText(textInput, 'New content');

    expect(onChangeText).toHaveBeenCalledWith('New content');
  });
});