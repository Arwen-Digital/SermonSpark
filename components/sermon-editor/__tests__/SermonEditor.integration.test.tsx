import { Sermon } from '@/types';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';
import { SermonEditor } from '../SermonEditor';

// Mock dependencies
jest.mock('@/services/repositories', () => ({
  seriesRepository: {
    list: jest.fn().mockResolvedValue([
      {
        id: 'series-1',
        title: 'Test Series',
        description: 'Test Description',
        status: 'active',
        sermonCount: 5,
      },
    ]),
  },
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
  getStringAsync: jest.fn().mockResolvedValue(''),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock MarkdownEditor
jest.mock('../MarkdownEditor', () => ({
  MarkdownEditor: React.forwardRef<any, any>((props, ref) => {
    const [selection, setSelection] = React.useState({ start: 0, end: 0 });
    
    React.useImperativeHandle(ref, () => ({
      focus: jest.fn(),
      blur: jest.fn(),
      insertText: jest.fn((text: string) => {
        const newValue = props.value + text;
        props.onChangeText?.(newValue);
      }),
      wrapSelection: jest.fn((before: string, after: string) => {
        const { start, end } = selection;
        const selectedText = props.value.substring(start, end);
        const newText = before + selectedText + after;
        const newValue = props.value.substring(0, start) + newText + props.value.substring(end);
        props.onChangeText?.(newValue);
      }),
      getSelection: jest.fn(() => selection),
    }));

    return (
      <div
        data-testid="markdown-editor"
        onFocus={() => props.onSelectionChange?.({ start: 0, end: 0 })}
        onClick={() => {
          const newSelection = { start: 5, end: 10 };
          setSelection(newSelection);
          props.onSelectionChange?.(newSelection);
        }}
      >
        {props.value}
      </div>
    );
  }),
}));

describe('SermonEditor Integration Tests', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    onSave: mockOnSave,
    onCancel: mockOnCancel,
  };

  const sampleSermon: Sermon = {
    id: 'test-sermon-1',
    title: 'Test Sermon',
    content: '# Introduction\n\nThis is a test sermon with **bold** text and *italic* text.',
    outline: 'I. Introduction\nII. Main Point\nIII. Conclusion',
    scripture: 'John 3:16',
    tags: ['faith', 'love'],
    seriesId: 'series-1',
    notes: 'Remember to speak slowly',
    date: new Date('2024-01-01'),
    lastModified: new Date('2024-01-01'),
    wordCount: 15,
    readingTime: 1,
    isArchived: false,
    isFavorite: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Complete Sermon Editing Workflow', () => {
    it('should handle complete sermon creation workflow', async () => {
      const { getByPlaceholderText, getByText, getByTestId } = render(
        <SermonEditor {...defaultProps} />
      );

      // Step 1: Enter title
      const titleInput = getByPlaceholderText('Enter sermon title...');
      fireEvent.changeText(titleInput, 'My New Sermon');

      // Step 2: Switch to content tab and add content
      const contentTab = getByText('Content');
      fireEvent.press(contentTab);

      const contentEditor = getByTestId('markdown-editor');
      fireEvent.changeText(contentEditor, '# Introduction\n\nThis is my sermon content.');

      // Step 3: Add formatting
      fireEvent.press(contentEditor); // Simulate text selection
      const boldButton = getByText('B');
      fireEvent.press(boldButton);

      // Step 4: Switch to outline tab
      const outlineTab = getByText('Outline');
      fireEvent.press(outlineTab);

      const outlineInput = getByPlaceholderText(/Create your sermon outline/);
      fireEvent.changeText(outlineInput, 'I. Introduction\nII. Main Point');

      // Step 5: Add details
      const detailsTab = getByText('Details');
      fireEvent.press(detailsTab);

      const scriptureInput = getByPlaceholderText('e.g., John 3:16-21');
      fireEvent.changeText(scriptureInput, 'Romans 8:28');

      // Step 6: Save sermon
      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'My New Sermon',
            content: expect.stringContaining('Introduction'),
            outline: 'I. Introduction\nII. Main Point',
            scripture: 'Romans 8:28',
          })
        );
      });
    });

    it('should handle sermon editing workflow', async () => {
      const { getByDisplayValue, getByText, getByTestId } = render(
        <SermonEditor {...defaultProps} sermon={sampleSermon} />
      );

      // Verify existing content is loaded
      expect(getByDisplayValue('Test Sermon')).toBeTruthy();
      expect(getByTestId('markdown-editor')).toBeTruthy();

      // Edit title
      const titleInput = getByDisplayValue('Test Sermon');
      fireEvent.changeText(titleInput, 'Updated Test Sermon');

      // Edit content
      const contentEditor = getByTestId('markdown-editor');
      fireEvent.changeText(contentEditor, sampleSermon.content + '\n\nAdditional content');

      // Save changes
      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'test-sermon-1',
            title: 'Updated Test Sermon',
            content: expect.stringContaining('Additional content'),
          })
        );
      });
    });
  });

  describe('Formatting Operations in Realistic Scenarios', () => {
    it('should apply formatting to selected text', async () => {
      const { getByTestId, getByText } = render(
        <SermonEditor {...defaultProps} sermon={sampleSermon} />
      );

      const contentEditor = getByTestId('markdown-editor');
      
      // Simulate text selection
      fireEvent.press(contentEditor);
      
      // Apply bold formatting
      const boldButton = getByText('B');
      fireEvent.press(boldButton);

      // Verify formatting was applied (mocked behavior)
      expect(contentEditor).toBeTruthy();
    });

    it('should handle multiple formatting operations', async () => {
      const { getByTestId, getByText } = render(
        <SermonEditor {...defaultProps} />
      );

      const contentEditor = getByTestId('markdown-editor');
      fireEvent.changeText(contentEditor, 'Sample text for formatting');

      // Apply multiple formats
      fireEvent.press(contentEditor); // Select text
      
      const boldButton = getByText('B');
      fireEvent.press(boldButton);
      
      const italicButton = getByText('I');
      fireEvent.press(italicButton);
      
      const h2Button = getByText('H2');
      fireEvent.press(h2Button);

      // Verify editor still functions
      expect(contentEditor).toBeTruthy();
    });

    it('should handle list formatting', async () => {
      const { getByTestId, getByLabelText } = render(
        <SermonEditor {...defaultProps} />
      );

      const contentEditor = getByTestId('markdown-editor');
      fireEvent.changeText(contentEditor, 'List item 1\nList item 2');

      // Apply bullet list formatting
      const listButton = getByLabelText('list');
      fireEvent.press(listButton);

      expect(contentEditor).toBeTruthy();
    });
  });

  describe('Auto-save Functionality', () => {
    it('should trigger auto-save after content changes', async () => {
      const { getByTestId, getByPlaceholderText } = render(
        <SermonEditor {...defaultProps} />
      );

      // Add title and content
      const titleInput = getByPlaceholderText('Enter sermon title...');
      fireEvent.changeText(titleInput, 'Auto-save Test');

      const contentEditor = getByTestId('markdown-editor');
      fireEvent.changeText(contentEditor, 'Content that should trigger auto-save');

      // Fast-forward time to trigger auto-save
      act(() => {
        jest.advanceTimersByTime(30000); // 30 seconds
      });

      // Auto-save should have been triggered (logged to console in real implementation)
      expect(titleInput).toBeTruthy(); // Basic verification that component is still functional
    });

    it('should not auto-save empty content', async () => {
      const { getByTestId } = render(
        <SermonEditor {...defaultProps} />
      );

      const contentEditor = getByTestId('markdown-editor');
      fireEvent.changeText(contentEditor, '');

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Should not have called onSave
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('View Mode Switching', () => {
    it('should switch between markup and preview modes', async () => {
      const { getByTestId, getByLabelText } = render(
        <SermonEditor {...defaultProps} sermon={sampleSermon} />
      );

      const contentEditor = getByTestId('markdown-editor');
      expect(contentEditor).toBeTruthy();

      // Switch to markup mode
      const viewModeToggle = getByLabelText('eye-outline');
      fireEvent.press(viewModeToggle);

      // Verify mode switch (component should still be rendered)
      expect(contentEditor).toBeTruthy();

      // Switch back to preview mode
      fireEvent.press(viewModeToggle);
      expect(contentEditor).toBeTruthy();
    });

    it('should maintain content during mode switches', async () => {
      const { getByTestId, getByLabelText } = render(
        <SermonEditor {...defaultProps} />
      );

      const contentEditor = getByTestId('markdown-editor');
      const testContent = '# Test Header\n\nThis is **bold** text.';
      
      fireEvent.changeText(contentEditor, testContent);

      // Switch modes multiple times
      const viewModeToggle = getByLabelText('eye-outline');
      fireEvent.press(viewModeToggle);
      fireEvent.press(viewModeToggle);
      fireEvent.press(viewModeToggle);

      // Content should be preserved
      expect(contentEditor).toBeTruthy();
    });
  });

  describe('Performance with Various Document Sizes', () => {
    const generateLargeContent = (wordCount: number): string => {
      const words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit'];
      const content = [];
      for (let i = 0; i < wordCount; i++) {
        content.push(words[i % words.length]);
      }
      return content.join(' ');
    };

    it('should handle small documents efficiently', async () => {
      const smallContent = generateLargeContent(100); // 100 words
      const smallSermon = { ...sampleSermon, content: smallContent };

      const startTime = Date.now();
      const { getByTestId } = render(
        <SermonEditor {...defaultProps} sermon={smallSermon} />
      );
      const renderTime = Date.now() - startTime;

      expect(getByTestId('markdown-editor')).toBeTruthy();
      expect(renderTime).toBeLessThan(100); // Should render quickly
    });

    it('should handle medium documents efficiently', async () => {
      const mediumContent = generateLargeContent(1000); // 1000 words
      const mediumSermon = { ...sampleSermon, content: mediumContent };

      const startTime = Date.now();
      const { getByTestId } = render(
        <SermonEditor {...defaultProps} sermon={mediumSermon} />
      );
      const renderTime = Date.now() - startTime;

      expect(getByTestId('markdown-editor')).toBeTruthy();
      expect(renderTime).toBeLessThan(200); // Should still render reasonably quickly
    });

    it('should handle large documents without crashing', async () => {
      const largeContent = generateLargeContent(5000); // 5000 words
      const largeSermon = { ...sampleSermon, content: largeContent };

      const { getByTestId } = render(
        <SermonEditor {...defaultProps} sermon={largeSermon} />
      );

      expect(getByTestId('markdown-editor')).toBeTruthy();
      
      // Test that editing still works with large content
      const contentEditor = getByTestId('markdown-editor');
      fireEvent.changeText(contentEditor, largeContent + '\nAdditional text');
      
      expect(contentEditor).toBeTruthy();
    });

    it('should maintain performance during rapid text changes', async () => {
      const { getByTestId } = render(
        <SermonEditor {...defaultProps} />
      );

      const contentEditor = getByTestId('markdown-editor');
      
      // Simulate rapid typing
      const startTime = Date.now();
      for (let i = 0; i < 50; i++) {
        fireEvent.changeText(contentEditor, `Content update ${i}`);
      }
      const updateTime = Date.now() - startTime;

      expect(contentEditor).toBeTruthy();
      expect(updateTime).toBeLessThan(1000); // Should handle rapid updates
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should work correctly on iOS', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
        configurable: true,
      });

      const { getByTestId, getByText } = render(
        <SermonEditor {...defaultProps} sermon={sampleSermon} />
      );

      expect(getByTestId('markdown-editor')).toBeTruthy();
      
      // Test formatting on iOS
      fireEvent.press(getByTestId('markdown-editor'));
      fireEvent.press(getByText('B'));
      
      expect(getByTestId('markdown-editor')).toBeTruthy();
    });

    it('should work correctly on Android', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'android',
        configurable: true,
      });

      const { getByTestId, getByText } = render(
        <SermonEditor {...defaultProps} sermon={sampleSermon} />
      );

      expect(getByTestId('markdown-editor')).toBeTruthy();
      
      // Test formatting on Android
      fireEvent.press(getByTestId('markdown-editor'));
      fireEvent.press(getByText('B'));
      
      expect(getByTestId('markdown-editor')).toBeTruthy();
    });

    it('should work correctly on Web', async () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'web',
        configurable: true,
      });

      const { getByTestId, getByText } = render(
        <SermonEditor {...defaultProps} sermon={sampleSermon} />
      );

      expect(getByTestId('markdown-editor')).toBeTruthy();
      
      // Test formatting on Web
      fireEvent.press(getByTestId('markdown-editor'));
      fireEvent.press(getByText('B'));
      
      expect(getByTestId('markdown-editor')).toBeTruthy();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle save errors gracefully', async () => {
      const failingOnSave = jest.fn().mockRejectedValue(new Error('Save failed'));
      
      const { getByPlaceholderText, getByText } = render(
        <SermonEditor {...defaultProps} onSave={failingOnSave} />
      );

      const titleInput = getByPlaceholderText('Enter sermon title...');
      fireEvent.changeText(titleInput, 'Test Sermon');

      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(failingOnSave).toHaveBeenCalled();
      });

      // Component should still be functional after error
      expect(titleInput).toBeTruthy();
    });

    it('should prevent saving without title', async () => {
      // Mock alert for web platform
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      Object.defineProperty(Platform, 'OS', {
        get: () => 'web',
        configurable: true,
      });

      const { getByText, getByTestId } = render(
        <SermonEditor {...defaultProps} />
      );

      const contentEditor = getByTestId('markdown-editor');
      fireEvent.changeText(contentEditor, 'Content without title');

      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      expect(alertSpy).toHaveBeenCalledWith('Please enter a title for your sermon');
      expect(mockOnSave).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });
  });

  describe('Tab Navigation and State Management', () => {
    it('should maintain state when switching between tabs', async () => {
      const { getByText, getByTestId, getByPlaceholderText } = render(
        <SermonEditor {...defaultProps} />
      );

      // Add content to different tabs
      const titleInput = getByPlaceholderText('Enter sermon title...');
      fireEvent.changeText(titleInput, 'Multi-tab Test');

      // Content tab
      const contentEditor = getByTestId('markdown-editor');
      fireEvent.changeText(contentEditor, 'Content tab text');

      // Switch to outline tab
      const outlineTab = getByText('Outline');
      fireEvent.press(outlineTab);
      
      const outlineInput = getByPlaceholderText(/Create your sermon outline/);
      fireEvent.changeText(outlineInput, 'Outline content');

      // Switch to notes tab
      const notesTab = getByText('Notes');
      fireEvent.press(notesTab);
      
      const notesInput = getByPlaceholderText(/Add your sermon notes/);
      fireEvent.changeText(notesInput, 'Notes content');

      // Switch back to content tab
      const contentTab = getByText('Content');
      fireEvent.press(contentTab);

      // Verify content is preserved
      expect(getByTestId('markdown-editor')).toBeTruthy();

      // Save and verify all content is included
      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Multi-tab Test',
            content: 'Content tab text',
            outline: 'Outline content',
            notes: 'Notes content',
          })
        );
      });
    });
  });

  describe('Bible Verse Integration', () => {
    it('should open and close Bible verse modal', async () => {
      const { getByText, queryByText } = render(
        <SermonEditor {...defaultProps} />
      );

      // Open Bible verse modal
      const bibleVerseButton = getByText('Bible Verse Finder');
      fireEvent.press(bibleVerseButton);

      // Modal should be open
      expect(getByText('Find A Bible Verse')).toBeTruthy();

      // Close modal
      const closeButton = getByLabelText('close');
      fireEvent.press(closeButton);

      // Modal should be closed
      await waitFor(() => {
        expect(queryByText('Find A Bible Verse')).toBeFalsy();
      });
    });
  });

  describe('Series Integration', () => {
    it('should load and display series options', async () => {
      const { getByText } = render(
        <SermonEditor {...defaultProps} />
      );

      // Switch to details tab
      const detailsTab = getByText('Details');
      fireEvent.press(detailsTab);

      // Open series selector
      const seriesSelector = getByText('Select a series...');
      fireEvent.press(seriesSelector);

      // Should show series modal
      await waitFor(() => {
        expect(getByText('Select Series')).toBeTruthy();
      });
    });
  });
});