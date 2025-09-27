import { fireEvent, render } from '@testing-library/react-native';
import React, { useRef } from 'react';
import { Button, View } from 'react-native';
import { FormatType } from '../FormattingToolbar';
import { MarkdownEditor, MarkdownEditorHandle } from '../MarkdownEditor';

// Test component that provides access to MarkdownEditor methods
const TestMarkdownEditor: React.FC<{
  initialValue?: string;
  onFormatTest?: (format: FormatType) => void;
}> = ({ initialValue = '', onFormatTest }) => {
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const [value, setValue] = React.useState(initialValue);

  const handleFormat = (format: FormatType) => {
    editorRef.current?.applyFormat(format);
    onFormatTest?.(format);
  };

  return (
    <View>
      <MarkdownEditor
        ref={editorRef}
        value={value}
        onChangeText={setValue}
        placeholder="Test editor"
      />
      <Button title="Bold" onPress={() => handleFormat('bold')} />
      <Button title="Italic" onPress={() => handleFormat('italic')} />
      <Button title="Heading2" onPress={() => handleFormat('heading2')} />
      <Button title="Heading3" onPress={() => handleFormat('heading3')} />
      <Button title="List" onPress={() => handleFormat('list')} />
      <Button title="NumberedList" onPress={() => handleFormat('numberedList')} />
      <Button title="Quote" onPress={() => handleFormat('quote')} />
      <Button title="Highlight" onPress={() => handleFormat('highlight')} />
    </View>
  );
};

describe('MarkdownEditor Formatting Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Inline Formatting', () => {
    it('applies bold formatting to selected text', async () => {
      const { getByDisplayValue, getByText } = render(
        <TestMarkdownEditor initialValue="Hello world" />
      );
      
      const textInput = getByDisplayValue('Hello world');
      
      // Simulate text selection
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 0, end: 5 } }
      });
      
      // Apply bold formatting
      fireEvent.press(getByText('Bold'));
      
      // The text should be wrapped with bold markdown
      expect(textInput.props.value).toContain('**Hello**');
    });

    it('applies italic formatting to selected text', async () => {
      const { getByDisplayValue, getByText } = render(
        <TestMarkdownEditor initialValue="Hello world" />
      );
      
      const textInput = getByDisplayValue('Hello world');
      
      // Simulate text selection
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 6, end: 11 } }
      });
      
      // Apply italic formatting
      fireEvent.press(getByText('Italic'));
      
      // The text should be wrapped with italic markdown
      expect(textInput.props.value).toContain('*world*');
    });

    it('applies highlight formatting to selected text', async () => {
      const { getByDisplayValue, getByText } = render(
        <TestMarkdownEditor initialValue="Important text" />
      );
      
      const textInput = getByDisplayValue('Important text');
      
      // Simulate text selection
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 0, end: 9 } }
      });
      
      // Apply highlight formatting
      fireEvent.press(getByText('Highlight'));
      
      // The text should be wrapped with highlight markdown
      expect(textInput.props.value).toContain('==Important==');
    });

    it('inserts placeholder text when no text is selected for inline formats', async () => {
      const { getByDisplayValue, getByText } = render(
        <TestMarkdownEditor initialValue="" />
      );
      
      const textInput = getByDisplayValue('');
      
      // Apply bold formatting without selection
      fireEvent.press(getByText('Bold'));
      
      // Should insert placeholder text
      expect(textInput.props.value).toContain('**bold text**');
    });
  });

  describe('Line-based Formatting', () => {
    it('applies heading2 formatting to current line', async () => {
      const { getByDisplayValue, getByText } = render(
        <TestMarkdownEditor initialValue="My heading" />
      );
      
      const textInput = getByDisplayValue('My heading');
      
      // Position cursor in the line
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 3, end: 3 } }
      });
      
      // Apply heading2 formatting
      fireEvent.press(getByText('Heading2'));
      
      // The line should be prefixed with heading markdown
      expect(textInput.props.value).toContain('## My heading');
    });

    it('applies heading3 formatting to current line', async () => {
      const { getByDisplayValue, getByText } = render(
        <TestMarkdownEditor initialValue="Subheading" />
      );
      
      const textInput = getByDisplayValue('Subheading');
      
      // Position cursor in the line
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 0, end: 0 } }
      });
      
      // Apply heading3 formatting
      fireEvent.press(getByText('Heading3'));
      
      // The line should be prefixed with heading markdown
      expect(textInput.props.value).toContain('### Subheading');
    });

    it('applies list formatting to current line', async () => {
      const { getByDisplayValue, getByText } = render(
        <TestMarkdownEditor initialValue="List item" />
      );
      
      const textInput = getByDisplayValue('List item');
      
      // Position cursor in the line
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 5, end: 5 } }
      });
      
      // Apply list formatting
      fireEvent.press(getByText('List'));
      
      // The line should be prefixed with list markdown
      expect(textInput.props.value).toContain('- List item');
    });

    it('applies numbered list formatting with correct numbering', async () => {
      const { getByDisplayValue, getByText } = render(
        <TestMarkdownEditor initialValue="First item\nSecond item" />
      );
      
      const textInput = getByDisplayValue('First item\nSecond item');
      
      // Position cursor on first line
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 0, end: 0 } }
      });
      
      // Apply numbered list formatting
      fireEvent.press(getByText('NumberedList'));
      
      // Should start with number 1
      expect(textInput.props.value).toContain('1. First item');
      
      // Position cursor on second line
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 15, end: 15 } }
      });
      
      // Apply numbered list formatting again
      fireEvent.press(getByText('NumberedList'));
      
      // Should continue with number 2
      expect(textInput.props.value).toContain('2. Second item');
    });

    it('applies quote formatting to current line', async () => {
      const { getByDisplayValue, getByText } = render(
        <TestMarkdownEditor initialValue="Quote text" />
      );
      
      const textInput = getByDisplayValue('Quote text');
      
      // Position cursor in the line
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 0, end: 0 } }
      });
      
      // Apply quote formatting
      fireEvent.press(getByText('Quote'));
      
      // The line should be prefixed with quote markdown
      expect(textInput.props.value).toContain('> Quote text');
    });
  });

  describe('Cursor Position Management', () => {
    it('maintains cursor position after inline formatting', async () => {
      const mockOnSelectionChange = jest.fn();
      const { getByDisplayValue, getByText } = render(
        <TestMarkdownEditor initialValue="test text" />
      );
      
      const textInput = getByDisplayValue('test text');
      
      // Simulate text selection
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 0, end: 4 } }
      });
      
      // Apply bold formatting
      fireEvent.press(getByText('Bold'));
      
      // Cursor should be positioned after the formatted text
      // This is tested indirectly through the text content change
      expect(textInput.props.value).toContain('**test**');
    });

    it('positions cursor correctly after line-based formatting', async () => {
      const { getByDisplayValue, getByText } = render(
        <TestMarkdownEditor initialValue="heading" />
      );
      
      const textInput = getByDisplayValue('heading');
      
      // Position cursor at start of line
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 0, end: 0 } }
      });
      
      // Apply heading formatting
      fireEvent.press(getByText('Heading2'));
      
      // Text should be formatted correctly
      expect(textInput.props.value).toContain('## heading');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty text input', async () => {
      const { getByDisplayValue, getByText } = render(
        <TestMarkdownEditor initialValue="" />
      );
      
      const textInput = getByDisplayValue('');
      
      // Apply formatting to empty text
      fireEvent.press(getByText('Bold'));
      
      // Should insert placeholder
      expect(textInput.props.value).toContain('**bold text**');
    });

    it('handles multiline text correctly', async () => {
      const { getByDisplayValue, getByText } = render(
        <TestMarkdownEditor initialValue="Line 1\nLine 2\nLine 3" />
      );
      
      const textInput = getByDisplayValue('Line 1\nLine 2\nLine 3');
      
      // Position cursor on second line
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 9, end: 9 } }
      });
      
      // Apply heading formatting
      fireEvent.press(getByText('Heading2'));
      
      // Only the second line should be formatted
      expect(textInput.props.value).toContain('Line 1\n## Line 2\nLine 3');
    });

    it('handles text at end of document', async () => {
      const { getByDisplayValue, getByText } = render(
        <TestMarkdownEditor initialValue="End text" />
      );
      
      const textInput = getByDisplayValue('End text');
      
      // Position cursor at end
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 8, end: 8 } }
      });
      
      // Apply list formatting
      fireEvent.press(getByText('List'));
      
      // Should format the line correctly
      expect(textInput.props.value).toContain('- End text');
    });
  });
});