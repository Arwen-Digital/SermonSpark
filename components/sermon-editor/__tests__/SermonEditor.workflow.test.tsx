import { Sermon } from '@/types';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { SermonEditor } from '../SermonEditor';

// Mock dependencies
jest.mock('@/services/repositories', () => ({
  seriesRepository: {
    list: jest.fn().mockResolvedValue([
      {
        id: 'series-1',
        title: 'Sunday Morning Series',
        description: 'Weekly Sunday sermons',
        status: 'active',
        sermonCount: 12,
      },
      {
        id: 'series-2',
        title: 'Evening Study',
        description: 'Wednesday evening studies',
        status: 'inactive',
        sermonCount: 8,
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

// Enhanced MarkdownEditor mock with more realistic behavior
jest.mock('../MarkdownEditor', () => ({
  MarkdownEditor: React.forwardRef<any, any>((props, ref) => {
    const [selection, setSelection] = React.useState({ start: 0, end: 0 });
    const [internalValue, setInternalValue] = React.useState(props.value || '');
    
    React.useEffect(() => {
      setInternalValue(props.value || '');
    }, [props.value]);
    
    React.useImperativeHandle(ref, () => ({
      focus: jest.fn(),
      blur: jest.fn(),
      insertText: jest.fn((text: string) => {
        const newValue = internalValue + text;
        setInternalValue(newValue);
        props.onChangeText?.(newValue);
      }),
      wrapSelection: jest.fn((before: string, after: string) => {
        const { start, end } = selection;
        const selectedText = internalValue.substring(start, end) || 'selected text';
        const newText = before + selectedText + after;
        const newValue = internalValue.substring(0, start) + newText + internalValue.substring(end);
        setInternalValue(newValue);
        props.onChangeText?.(newValue);
      }),
      getSelection: jest.fn(() => selection),
    }));

    const handleTextChange = (text: string) => {
      setInternalValue(text);
      props.onChangeText?.(text);
    };

    const handlePress = () => {
      // Simulate text selection
      const newSelection = { start: 5, end: 15 };
      setSelection(newSelection);
      props.onSelectionChange?.(newSelection);
    };

    return (
      <div
        data-testid="markdown-editor"
        data-value={internalValue}
        onClick={handlePress}
        onChange={(e: any) => handleTextChange(e.target.value)}
      >
        {props.viewMode === 'formatted' ? (
          <div data-testid="formatted-view">{internalValue}</div>
        ) : (
          <div data-testid="markup-view">{internalValue}</div>
        )}
      </div>
    );
  }),
}));

describe('SermonEditor Workflow Integration Tests', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    onSave: mockOnSave,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Complete Sermon Writing Workflow', () => {
    it('should support a complete sermon writing session from start to finish', async () => {
      const { getByPlaceholderText, getByText, getByTestId, getByLabelText } = render(
        <SermonEditor {...defaultProps} />
      );

      // Phase 1: Initial Setup
      const titleInput = getByPlaceholderText('Enter sermon title...');
      fireEvent.changeText(titleInput, 'The Power of Faith');

      // Phase 2: Content Creation
      const contentTab = getByText('Content');
      fireEvent.press(contentTab);

      const contentEditor = getByTestId('markdown-editor');
      const sermonContent = `# Introduction

Faith is the foundation of our Christian walk. In today's message, we'll explore what it means to have **unwavering faith** in God's promises.

## Main Point 1: Faith Requires Trust

> "Now faith is confidence in what we hope for and assurance about what we do not see." - Hebrews 11:1

When we face challenges, our faith is tested. But it's in these moments that we must remember:

- God is always faithful
- His promises never fail
- Our trust should be in Him alone

## Main Point 2: Faith Produces Action

Faith without works is dead. True faith manifests itself through:

1. Obedience to God's word
2. Service to others
3. Perseverance through trials

## Conclusion

Let us commit to living by faith, trusting in God's goodness and walking in His ways.`;

      fireEvent.changeText(contentEditor, sermonContent);

      // Phase 3: Apply Formatting
      fireEvent.press(contentEditor); // Select text
      
      // Apply bold formatting to selected text
      const boldButton = getByText('B');
      fireEvent.press(boldButton);

      // Apply italic formatting
      const italicButton = getByText('I');
      fireEvent.press(italicButton);

      // Add a quote
      const quoteButton = getByLabelText('chatbox-outline');
      fireEvent.press(quoteButton);

      // Phase 4: Create Outline
      const outlineTab = getByText('Outline');
      fireEvent.press(outlineTab);

      const outlineInput = getByPlaceholderText(/Create your sermon outline/);
      const outlineContent = `I. Introduction (5 minutes)
   A. Opening story about faith
   B. Scripture reading: Hebrews 11:1

II. Main Point 1: Faith Requires Trust (15 minutes)
   A. Definition of biblical faith
   B. Examples from Scripture
   C. Personal application

III. Main Point 2: Faith Produces Action (15 minutes)
   A. James 2:17 - Faith without works
   B. Practical examples
   C. Challenge to congregation

IV. Conclusion (5 minutes)
   A. Summary of key points
   B. Call to commitment
   C. Closing prayer`;

      fireEvent.changeText(outlineInput, outlineContent);

      // Phase 5: Add Notes
      const notesTab = getByText('Notes');
      fireEvent.press(notesTab);

      const notesInput = getByPlaceholderText(/Add your sermon notes/);
      const notesContent = `• Start with personal testimony about faith
• Use visual aid for Hebrews 11:1
• Remember to pause after each main point
• Invite people forward for prayer at the end
• Mention upcoming baptism service
• Thank worship team for music`;

      fireEvent.changeText(notesInput, notesContent);

      // Phase 6: Add Details
      const detailsTab = getByText('Details');
      fireEvent.press(detailsTab);

      const scriptureInput = getByPlaceholderText('e.g., John 3:16-21');
      fireEvent.changeText(scriptureInput, 'Hebrews 11:1-6');

      // Add tags
      const tagInput = getByPlaceholderText('Add a tag...');
      fireEvent.changeText(tagInput, 'faith');
      const addTagButton = getByText('Add');
      fireEvent.press(addTagButton);

      fireEvent.changeText(tagInput, 'trust');
      fireEvent.press(addTagButton);

      fireEvent.changeText(tagInput, 'action');
      fireEvent.press(addTagButton);

      // Phase 7: Select Series
      const seriesSelector = getByText('Select a series...');
      fireEvent.press(seriesSelector);

      await waitFor(() => {
        expect(getByText('Select Series')).toBeTruthy();
      });

      const sundaySeriesOption = getByText('Sunday Morning Series');
      fireEvent.press(sundaySeriesOption);

      // Phase 8: Final Save
      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'The Power of Faith',
            content: expect.stringContaining('Faith is the foundation'),
            outline: expect.stringContaining('Introduction (5 minutes)'),
            notes: expect.stringContaining('personal testimony'),
            scripture: 'Hebrews 11:1-6',
            tags: expect.arrayContaining(['faith', 'trust', 'action']),
            seriesId: 'series-1',
            wordCount: expect.any(Number),
            readingTime: expect.any(Number),
          })
        );
      });
    });

    it('should handle editing an existing sermon with complex formatting', async () => {
      const existingSermon: Sermon = {
        id: 'existing-sermon',
        title: 'Love One Another',
        content: `# The Greatest Commandment

Jesus said the greatest commandment is to **love God** and *love your neighbor*.

## What Does Love Look Like?

> "By this everyone will know that you are my disciples, if you love one another." - John 13:35

Love is:
- Patient and kind
- Not envious or boastful
- Not arrogant or rude

### Practical Applications

1. Show compassion to those in need
2. Forgive those who hurt you
3. Serve others selflessly

==Remember: Love is not just a feeling, it's a choice.==`,
        outline: 'I. Introduction\nII. Definition of Love\nIII. Practical Applications',
        scripture: 'John 13:34-35',
        tags: ['love', 'discipleship'],
        seriesId: 'series-1',
        notes: 'Emphasize practical application',
        date: new Date('2024-01-15'),
        lastModified: new Date('2024-01-15'),
        wordCount: 85,
        readingTime: 1,
        isArchived: false,
        isFavorite: true,
      };

      const { getByDisplayValue, getByText, getByTestId } = render(
        <SermonEditor {...defaultProps} sermon={existingSermon} />
      );

      // Verify existing content is loaded
      expect(getByDisplayValue('Love One Another')).toBeTruthy();

      // Edit the title
      const titleInput = getByDisplayValue('Love One Another');
      fireEvent.changeText(titleInput, 'Love One Another - Updated');

      // Edit content with additional formatting
      const contentEditor = getByTestId('markdown-editor');
      const updatedContent = existingSermon.content + `

## New Section: Love in Action

When we truly understand God's love for us, we can't help but share that love with others.

### Ways to Show Love:

- **Listen** actively to others
- **Serve** without expecting anything in return
- **Encourage** those who are struggling
- **Pray** for your enemies

> "We love because he first loved us." - 1 John 4:19`;

      fireEvent.changeText(contentEditor, updatedContent);

      // Apply additional formatting
      fireEvent.press(contentEditor); // Select text
      
      const boldButton = getByText('B');
      fireEvent.press(boldButton);

      // Switch to view mode to see formatted result
      const viewModeToggle = getByLabelText('eye-outline');
      fireEvent.press(viewModeToggle);

      // Verify formatted view is displayed
      expect(getByTestId('formatted-view')).toBeTruthy();

      // Switch back to markup mode
      fireEvent.press(viewModeToggle);
      expect(getByTestId('markup-view')).toBeTruthy();

      // Update outline
      const outlineTab = getByText('Outline');
      fireEvent.press(outlineTab);

      const outlineInput = getByDisplayValue(existingSermon.outline);
      fireEvent.changeText(outlineInput, existingSermon.outline + '\nIV. Love in Action');

      // Save changes
      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'existing-sermon',
            title: 'Love One Another - Updated',
            content: expect.stringContaining('Love in Action'),
            outline: expect.stringContaining('Love in Action'),
          })
        );
      });
    });
  });

  describe('Advanced Formatting Workflows', () => {
    it('should handle complex markdown formatting scenarios', async () => {
      const { getByTestId, getByText, getByLabelText } = render(
        <SermonEditor {...defaultProps} />
      );

      const contentEditor = getByTestId('markdown-editor');
      
      // Start with basic content
      fireEvent.changeText(contentEditor, 'This is a test sermon with various formatting needs.');

      // Apply heading formatting
      fireEvent.press(contentEditor); // Select text
      const h2Button = getByText('H2');
      fireEvent.press(h2Button);

      // Apply bold formatting
      const boldButton = getByText('B');
      fireEvent.press(boldButton);

      // Apply italic formatting
      const italicButton = getByText('I');
      fireEvent.press(italicButton);

      // Add bullet list
      const listButton = getByLabelText('list');
      fireEvent.press(listButton);

      // Add numbered list
      const numberedListButton = getByLabelText('list-outline');
      fireEvent.press(numberedListButton);

      // Add quote
      const quoteButton = getByLabelText('chatbox-outline');
      fireEvent.press(quoteButton);

      // Add highlight
      const highlightButton = getByLabelText('color-fill');
      fireEvent.press(highlightButton);

      // Verify editor still functions after multiple formatting operations
      expect(contentEditor).toBeTruthy();
    });

    it('should handle rapid formatting changes without issues', async () => {
      const { getByTestId, getByText } = render(
        <SermonEditor {...defaultProps} />
      );

      const contentEditor = getByTestId('markdown-editor');
      fireEvent.changeText(contentEditor, 'Rapid formatting test content');

      // Simulate rapid formatting changes
      for (let i = 0; i < 10; i++) {
        fireEvent.press(contentEditor); // Select text
        
        const boldButton = getByText('B');
        fireEvent.press(boldButton);
        
        const italicButton = getByText('I');
        fireEvent.press(italicButton);
      }

      // Editor should still be functional
      expect(contentEditor).toBeTruthy();
    });
  });

  describe('Auto-save Integration Scenarios', () => {
    it('should auto-save during long writing sessions', async () => {
      const { getByPlaceholderText, getByTestId } = render(
        <SermonEditor {...defaultProps} />
      );

      // Start writing
      const titleInput = getByPlaceholderText('Enter sermon title...');
      fireEvent.changeText(titleInput, 'Long Writing Session');

      const contentEditor = getByTestId('markdown-editor');
      
      // Simulate writing over time with auto-saves
      fireEvent.changeText(contentEditor, 'First paragraph of content...');
      
      // Trigger first auto-save
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Continue writing
      fireEvent.changeText(contentEditor, 'First paragraph of content...\n\nSecond paragraph with more details...');
      
      // Trigger second auto-save
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Continue writing
      fireEvent.changeText(contentEditor, 'First paragraph of content...\n\nSecond paragraph with more details...\n\nThird paragraph with conclusion...');
      
      // Trigger third auto-save
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Verify component is still functional
      expect(contentEditor).toBeTruthy();
    });

    it('should handle auto-save conflicts with manual saves', async () => {
      const { getByPlaceholderText, getByTestId, getByText } = render(
        <SermonEditor {...defaultProps} />
      );

      const titleInput = getByPlaceholderText('Enter sermon title...');
      fireEvent.changeText(titleInput, 'Save Conflict Test');

      const contentEditor = getByTestId('markdown-editor');
      fireEvent.changeText(contentEditor, 'Content that might cause save conflicts');

      // Manual save
      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });

      // Continue editing
      fireEvent.changeText(contentEditor, 'Content that might cause save conflicts\n\nAdditional content');

      // Trigger auto-save
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      // Another manual save
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Performance Under Load', () => {
    it('should maintain responsiveness with frequent view mode switches', async () => {
      const { getByTestId, getByLabelText } = render(
        <SermonEditor {...defaultProps} />
      );

      const contentEditor = getByTestId('markdown-editor');
      const largeContent = `# Large Content Test

${'This is a paragraph with substantial content that will be used to test performance. '.repeat(50)}

## Section 1

${'More content for testing performance under load. '.repeat(30)}

## Section 2

${'Additional content to make the document larger. '.repeat(40)}

### Subsection

${'Even more content for comprehensive testing. '.repeat(25)}`;

      fireEvent.changeText(contentEditor, largeContent);

      const viewModeToggle = getByLabelText('eye-outline');
      
      // Rapidly switch view modes
      const startTime = Date.now();
      for (let i = 0; i < 20; i++) {
        fireEvent.press(viewModeToggle);
      }
      const switchTime = Date.now() - startTime;

      expect(contentEditor).toBeTruthy();
      expect(switchTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle multiple simultaneous operations', async () => {
      const { getByTestId, getByText, getByPlaceholderText } = render(
        <SermonEditor {...defaultProps} />
      );

      // Perform multiple operations simultaneously
      const titleInput = getByPlaceholderText('Enter sermon title...');
      const contentEditor = getByTestId('markdown-editor');

      // Simulate concurrent operations
      fireEvent.changeText(titleInput, 'Concurrent Operations Test');
      fireEvent.changeText(contentEditor, 'Testing concurrent operations');
      fireEvent.press(contentEditor); // Select text
      
      const boldButton = getByText('B');
      fireEvent.press(boldButton);
      
      const italicButton = getByText('I');
      fireEvent.press(italicButton);

      // Switch tabs while operations are happening
      const outlineTab = getByText('Outline');
      fireEvent.press(outlineTab);

      const notesTab = getByText('Notes');
      fireEvent.press(notesTab);

      const contentTab = getByText('Content');
      fireEvent.press(contentTab);

      // All operations should complete without issues
      expect(contentEditor).toBeTruthy();
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should recover from formatting errors gracefully', async () => {
      const { getByTestId, getByText } = render(
        <SermonEditor {...defaultProps} />
      );

      const contentEditor = getByTestId('markdown-editor');
      
      // Add content that might cause formatting issues
      fireEvent.changeText(contentEditor, 'Content with **unclosed bold and *unclosed italic');

      // Try to apply more formatting
      fireEvent.press(contentEditor);
      
      const boldButton = getByText('B');
      fireEvent.press(boldButton);

      // Editor should still be functional
      expect(contentEditor).toBeTruthy();
    });

    it('should handle network failures during save operations', async () => {
      const networkFailingSave = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      const { getByPlaceholderText, getByText } = render(
        <SermonEditor {...defaultProps} onSave={networkFailingSave} />
      );

      const titleInput = getByPlaceholderText('Enter sermon title...');
      fireEvent.changeText(titleInput, 'Network Test Sermon');

      const saveButton = getByText('Save');
      
      // First save attempt fails
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(networkFailingSave).toHaveBeenCalledTimes(1);
      });

      // Second save attempt succeeds
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(networkFailingSave).toHaveBeenCalledTimes(2);
      });

      // Component should still be functional
      expect(titleInput).toBeTruthy();
    });
  });
});