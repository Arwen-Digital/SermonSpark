import { fireEvent, render } from '@testing-library/react-native';
import React, { useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { FormattingToolbar, FormatType } from '../FormattingToolbar';
import { MarkdownEditor, MarkdownEditorHandle } from '../MarkdownEditor';
import { MobileFloatingToolbar } from '../MobileFloatingToolbar';

// Mock useWindowDimensions to control screen size
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    useWindowDimensions: jest.fn(),
  };
});

const mockUseWindowDimensions = useWindowDimensions as jest.MockedFunction<typeof useWindowDimensions>;

// Integration test component that combines toolbar and editor
const IntegratedEditor: React.FC<{
  initialValue?: string;
  screenWidth?: number;
}> = ({ initialValue = '', screenWidth = 800 }) => {
  const editorRef = useRef<MarkdownEditorHandle>(null);
  const [value, setValue] = useState(initialValue);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [viewMode, setViewMode] = useState<'markup' | 'formatted'>('markup');
  
  // Mock screen dimensions
  mockUseWindowDimensions.mockReturnValue({ width: screenWidth, height: 600 });
  
  const isLargeScreen = screenWidth >= 768;
  const hasSelection = selection.start !== selection.end;

  const handleFormatPress = (format: FormatType) => {
    editorRef.current?.applyFormat(format);
  };

  const handleSelectionChange = (newSelection: { start: number; end: number }) => {
    setSelection(newSelection);
  };

  const handleViewModeToggle = () => {
    setViewMode(viewMode === 'markup' ? 'formatted' : 'markup');
  };

  const handleBibleVersePress = () => {
    // Mock Bible verse insertion
    editorRef.current?.insertText('\n\n"For God so loved the world..." - John 3:16\n\n');
  };

  return (
    <View>
      {/* Mobile floating toolbar */}
      {!isLargeScreen && (
        <MobileFloatingToolbar
          onFormatPress={handleFormatPress}
          visible={hasSelection}
        />
      )}
      
      {/* Main toolbar */}
      <FormattingToolbar
        onFormatPress={handleFormatPress}
        hasSelection={hasSelection}
        viewMode={viewMode}
        onViewModeToggle={handleViewModeToggle}
        onBibleVersePress={handleBibleVersePress}
        isLargeScreen={isLargeScreen}
      />
      
      {/* Editor */}
      <MarkdownEditor
        ref={editorRef}
        value={value}
        onChangeText={setValue}
        onSelectionChange={handleSelectionChange}
        viewMode={viewMode}
        placeholder="Start writing..."
      />
    </View>
  );
};

describe('Toolbar Integration with MarkdownEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Desktop/Large Screen Integration', () => {
    it('applies formatting through main toolbar on large screens', async () => {
      const { getByDisplayValue, getByText } = render(
        <IntegratedEditor initialValue="Hello world" screenWidth={1024} />
      );
      
      const textInput = getByDisplayValue('Hello world');
      
      // Simulate text selection
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 0, end: 5 } }
      });
      
      // Apply bold formatting through toolbar
      fireEvent.press(getByText('B'));
      
      // Text should be formatted
      expect(textInput.props.value).toContain('**Hello**');
    });

    it('shows selection indicator on large screens when text is selected', async () => {
      const { getByDisplayValue, getByText } = render(
        <IntegratedEditor initialValue="Test text" screenWidth={1024} />
      );
      
      const textInput = getByDisplayValue('Test text');
      
      // Simulate text selection
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 0, end: 4 } }
      });
      
      // Selection indicator should be visible
      expect(getByText('Text selected')).toBeTruthy();
    });

    it('shows Bible verse button on large screens', () => {
      const { getByText } = render(
        <IntegratedEditor screenWidth={1024} />
      );
      
      expect(getByText('Bible Verse Finder')).toBeTruthy();
    });

    it('inserts Bible verse content when button is pressed', async () => {
      const { getByDisplayValue, getByText } = render(
        <IntegratedEditor initialValue="My sermon" screenWidth={1024} />
      );
      
      const textInput = getByDisplayValue('My sermon');
      
      // Press Bible verse button
      fireEvent.press(getByText('Bible Verse Finder'));
      
      // Bible verse should be inserted
      expect(textInput.props.value).toContain('John 3:16');
    });
  });

  describe('Mobile/Small Screen Integration', () => {
    it('shows floating toolbar when text is selected on mobile', async () => {
      const { getByDisplayValue, getByText } = render(
        <IntegratedEditor initialValue="Mobile text" screenWidth={375} />
      );
      
      const textInput = getByDisplayValue('Mobile text');
      
      // Simulate text selection
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 0, end: 6 } }
      });
      
      // Floating toolbar should be visible
      expect(getByText('Format Selection')).toBeTruthy();
    });

    it('applies formatting through floating toolbar on mobile', async () => {
      const { getByDisplayValue, getByText } = render(
        <IntegratedEditor initialValue="Mobile text" screenWidth={375} />
      );
      
      const textInput = getByDisplayValue('Mobile text');
      
      // Simulate text selection
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 0, end: 6 } }
      });
      
      // Apply italic formatting through floating toolbar
      fireEvent.press(getByText('I'));
      
      // Text should be formatted
      expect(textInput.props.value).toContain('*Mobile*');
    });

    it('does not show Bible verse button in main toolbar on mobile', () => {
      const { queryByText } = render(
        <IntegratedEditor screenWidth={375} />
      );
      
      expect(queryByText('Bible Verse Finder')).toBeNull();
    });

    it('does not show selection indicator on mobile', async () => {
      const { getByDisplayValue, queryByText } = render(
        <IntegratedEditor initialValue="Mobile text" screenWidth={375} />
      );
      
      const textInput = getByDisplayValue('Mobile text');
      
      // Simulate text selection
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 0, end: 6 } }
      });
      
      // Selection indicator should not be visible on mobile
      expect(queryByText('Text selected')).toBeNull();
    });
  });

  describe('View Mode Integration', () => {
    it('toggles view mode when toolbar button is pressed', () => {
      const { getByText } = render(
        <IntegratedEditor screenWidth={1024} />
      );
      
      // Initially should show "Preview" button (in markup mode)
      expect(getByText('Preview')).toBeTruthy();
      
      // Toggle to formatted mode
      fireEvent.press(getByText('Preview'));
      
      // Should now show "Markup" button
      expect(getByText('Markup')).toBeTruthy();
    });

    it('passes correct view mode to editor', () => {
      const { getByText } = render(
        <IntegratedEditor screenWidth={1024} />
      );
      
      // Toggle to formatted mode
      fireEvent.press(getByText('Preview'));
      
      // Editor should receive the updated view mode
      // This is tested indirectly through the button text change
      expect(getByText('Markup')).toBeTruthy();
    });
  });

  describe('Complex Formatting Scenarios', () => {
    it('handles multiple formatting operations in sequence', async () => {
      const { getByDisplayValue, getByText } = render(
        <IntegratedEditor initialValue="Test paragraph with multiple formats" screenWidth={1024} />
      );
      
      const textInput = getByDisplayValue('Test paragraph with multiple formats');
      
      // Select "Test"
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 0, end: 4 } }
      });
      
      // Apply bold
      fireEvent.press(getByText('B'));
      
      // Select "paragraph"
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 8, end: 17 } }
      });
      
      // Apply italic
      fireEvent.press(getByText('I'));
      
      // Text should have both formats
      expect(textInput.props.value).toContain('**Test**');
      expect(textInput.props.value).toContain('*paragraph*');
    });

    it('handles line-based formatting with existing inline formats', async () => {
      const { getByDisplayValue, getByText } = render(
        <IntegratedEditor initialValue="**Bold** text in line" screenWidth={1024} />
      );
      
      const textInput = getByDisplayValue('**Bold** text in line');
      
      // Position cursor in the line
      fireEvent(textInput, 'selectionChange', {
        nativeEvent: { selection: { start: 10, end: 10 } }
      });
      
      // Apply heading formatting
      fireEvent.press(getByText('H2'));
      
      // Should add heading prefix while preserving inline formatting
      expect(textInput.props.value).toContain('## **Bold** text in line');
    });
  });
});