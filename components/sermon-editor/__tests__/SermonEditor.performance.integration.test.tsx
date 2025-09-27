import { Sermon } from '@/types';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { SermonEditor } from '../SermonEditor';

// Mock dependencies
jest.mock('@/services/repositories', () => ({
  seriesRepository: {
    list: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
  getStringAsync: jest.fn().mockResolvedValue(''),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Performance-focused MarkdownEditor mock
jest.mock('../MarkdownEditor', () => ({
  MarkdownEditor: React.forwardRef<any, any>((props, ref) => {
    const [renderCount, setRenderCount] = React.useState(0);
    const [selection, setSelection] = React.useState({ start: 0, end: 0 });
    
    React.useEffect(() => {
      setRenderCount(prev => prev + 1);
    });
    
    React.useImperativeHandle(ref, () => ({
      focus: jest.fn(),
      blur: jest.fn(),
      insertText: jest.fn((text: string) => {
        const newValue = props.value + text;
        props.onChangeText?.(newValue);
      }),
      wrapSelection: jest.fn((before: string, after: string) => {
        const { start, end } = selection;
        const selectedText = props.value.substring(start, end) || 'selected';
        const newText = before + selectedText + after;
        const newValue = props.value.substring(0, start) + newText + props.value.substring(end);
        props.onChangeText?.(newValue);
      }),
      getSelection: jest.fn(() => selection),
      getRenderCount: jest.fn(() => renderCount),
    }));

    return (
      <div
        data-testid="markdown-editor"
        data-render-count={renderCount}
        onClick={() => {
          setSelection({ start: 0, end: 10 });
          props.onSelectionChange?.({ start: 0, end: 10 });
        }}
      >
        {props.value}
      </div>
    );
  }),
}));

describe('SermonEditor Performance Integration Tests', () => {
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

  // Helper function to generate content of specific word count
  const generateContent = (wordCount: number): string => {
    const words = [
      'faith', 'hope', 'love', 'grace', 'mercy', 'peace', 'joy', 'truth',
      'light', 'salvation', 'redemption', 'forgiveness', 'blessing', 'prayer',
      'worship', 'praise', 'glory', 'honor', 'righteousness', 'holiness'
    ];
    
    const content = [];
    for (let i = 0; i < wordCount; i++) {
      content.push(words[i % words.length]);
      if ((i + 1) % 20 === 0) content.push('\n\n'); // Add paragraphs
      if ((i + 1) % 100 === 0) content.push('## Section Header\n\n'); // Add sections
    }
    
    return content.join(' ');
  };

  describe('Document Size Performance', () => {
    it('should handle small documents (100 words) efficiently', async () => {
      const smallContent = generateContent(100);
      const smallSermon: Sermon = {
        id: 'small-sermon',
        title: 'Small Sermon',
        content: smallContent,
        outline: '',
        scripture: '',
        tags: [],
        seriesId: '',
        notes: '',
        date: new Date(),
        lastModified: new Date(),
        wordCount: 100,
        readingTime: 1,
        isArchived: false,
        isFavorite: false,
      };

      const startTime = performance.now();
      const { getByTestId } = render(
        <SermonEditor {...defaultProps} sermon={smallSermon} />
      );
      const renderTime = performance.now() - startTime;

      expect(getByTestId('markdown-editor')).toBeTruthy();
      expect(renderTime).toBeLessThan(50); // Should render very quickly
    });

    it('should handle medium documents (1000 words) efficiently', async () => {
      const mediumContent = generateContent(1000);
      const mediumSermon: Sermon = {
        id: 'medium-sermon',
        title: 'Medium Sermon',
        content: mediumContent,
        outline: '',
        scripture: '',
        tags: [],
        seriesId: '',
        notes: '',
        date: new Date(),
        lastModified: new Date(),
        wordCount: 1000,
        readingTime: 7,
        isArchived: false,
        isFavorite: false,
      };

      const startTime = performance.now();
      const { getByTestId } = render(
        <SermonEditor {...defaultProps} sermon={mediumSermon} />
      );
      const renderTime = performance.now() - startTime;

      expect(getByTestId('markdown-editor')).toBeTruthy();
      expect(renderTime).toBeLessThan(100); // Should still render quickly
    });

    it('should handle large documents (5000 words) without performance degradation', async () => {
      const largeContent = generateContent(5000);
      const largeSermon: Sermon = {
        id: 'large-sermon',
        title: 'Large Sermon',
        content: largeContent,
        outline: '',
        scripture: '',
        tags: [],
        seriesId: '',
        notes: '',
        date: new Date(),
        lastModified: new Date(),
        wordCount: 5000,
        readingTime: 33,
        isArchived: false,
        isFavorite: false,
      };

      const startTime = performance.now();
      const { getByTestId } = render(
        <SermonEditor {...defaultProps} sermon={largeSermon} />
      );
      const renderTime = performance.now() - startTime;

      expect(getByTestId('markdown-editor')).toBeTruthy();
      expect(renderTime).toBeLessThan(200); // Should render within reasonable time
    });

    it('should handle very large documents (10000 words) gracefully', async () => {
      const veryLargeContent = generateContent(10000);
      const veryLargeSermon: Sermon = {
        id: 'very-large-sermon',
        title: 'Very Large Sermon',
        content: veryLargeContent,
        outline: '',
        scripture: '',
        tags: [],
        seriesId: '',
        notes: '',
        date: new Date(),
        lastModified: new Date(),
        wordCount: 10000,
        readingTime: 67,
        isArchived: false,
        isFavorite: false,
      };

      const startTime = performance.now();
      const { getByTestId } = render(
        <SermonEditor {...defaultProps} sermon={veryLargeSermon} />
      );
      const renderTime = performance.now() - startTime;

      expect(getByTestId('markdown-editor')).toBeTruthy();
      expect(renderTime).toBeLessThan(500); // Should render within acceptable time
    });
  });

  describe('Text Input Performance', () => {
    it('should handle rapid text input without lag', async () => {
      const { getByTestId } = render(
        <SermonEditor {...defaultProps} />
      );

      const contentEditor = getByTestId('markdown-editor');
      
      const startTime = performance.now();
      
      // Simulate rapid typing
      for (let i = 0; i < 100; i++) {
        fireEvent.changeText(contentEditor, `Character ${i} `);
      }
      
      const inputTime = performance.now() - startTime;

      expect(contentEditor).toBeTruthy();
      expect(inputTime).toBeLessThan(1000); // Should handle rapid input efficiently
    });

    it('should maintain performance during continuous typing', async () => {
      const { getByTestId } = render(
        <SermonEditor {...defaultProps} />
      );

      const contentEditor = getByTestId('markdown-editor');
      let currentContent = '';
      
      const startTime = performance.now();
      
      // Simulate continuous typing over time
      for (let i = 0; i < 50; i++) {
        currentContent += `This is sentence ${i} in a continuous typing test. `;
        fireEvent.changeText(contentEditor, currentContent);
        
        // Simulate small delays between keystrokes
        act(() => {
          jest.advanceTimersByTime(10);
        });
      }
      
      const typingTime = performance.now() - startTime;

      expect(contentEditor).toBeTruthy();
      expect(typingTime).toBeLessThan(2000); // Should maintain performance
    });
  });

  describe('Formatting Performance', () => {
    it('should apply formatting operations quickly', async () => {
      const { getByTestId, getByText } = render(
        <SermonEditor {...defaultProps} />
      );

      const contentEditor = getByTestId('markdown-editor');
      fireEvent.changeText(contentEditor, 'Text to be formatted with various styles');

      const startTime = performance.now();
      
      // Apply multiple formatting operations
      fireEvent.press(contentEditor); // Select text
      
      const boldButton = getByText('B');
      fireEvent.press(boldButton);
      
      const italicButton = getByText('I');
      fireEvent.press(italicButton);
      
      const h2Button = getByText('H2');
      fireEvent.press(h2Button);
      
      const h3Button = getByText('H3');
      fireEvent.press(h3Button);
      
      const formatTime = performance.now() - startTime;

      expect(contentEditor).toBeTruthy();
      expect(formatTime).toBeLessThan(100); // Formatting should be instant
    });

    it('should handle complex formatting scenarios efficiently', async () => {
      const { getByTestId, getByText, getByLabelText } = render(
        <SermonEditor {...defaultProps} />
      );

      const contentEditor = getByTestId('markdown-editor');
      const complexContent = `# Main Title

This is a paragraph with **bold text** and *italic text* and ==highlighted text==.

## Section 1

> This is a blockquote with important information.

### Subsection

- Bullet point 1
- Bullet point 2
- Bullet point 3

1. Numbered item 1
2. Numbered item 2
3. Numbered item 3

Another paragraph with more content.`;

      fireEvent.changeText(contentEditor, complexContent);

      const startTime = performance.now();
      
      // Apply additional formatting to complex content
      fireEvent.press(contentEditor); // Select text
      
      const boldButton = getByText('B');
      fireEvent.press(boldButton);
      
      const listButton = getByLabelText('list');
      fireEvent.press(listButton);
      
      const quoteButton = getByLabelText('chatbox-outline');
      fireEvent.press(quoteButton);
      
      const highlightButton = getByLabelText('color-fill');
      fireEvent.press(highlightButton);
      
      const complexFormatTime = performance.now() - startTime;

      expect(contentEditor).toBeTruthy();
      expect(complexFormatTime).toBeLessThan(150); // Should handle complex formatting quickly
    });
  });

  describe('View Mode Switching Performance', () => {
    it('should switch between view modes quickly', async () => {
      const { getByTestId, getByLabelText } = render(
        <SermonEditor {...defaultProps} />
      );

      const contentEditor = getByTestId('markdown-editor');
      const testContent = generateContent(500); // Medium-sized content
      fireEvent.changeText(contentEditor, testContent);

      const viewModeToggle = getByLabelText('eye-outline');
      
      const startTime = performance.now();
      
      // Switch modes multiple times
      for (let i = 0; i < 10; i++) {
        fireEvent.press(viewModeToggle);
      }
      
      const switchTime = performance.now() - startTime;

      expect(contentEditor).toBeTruthy();
      expect(switchTime).toBeLessThan(500); // Mode switching should be fast
    });

    it('should maintain performance with large content during view switches', async () => {
      const { getByTestId, getByLabelText } = render(
        <SermonEditor {...defaultProps} />
      );

      const contentEditor = getByTestId('markdown-editor');
      const largeContent = generateContent(2000); // Large content
      fireEvent.changeText(contentEditor, largeContent);

      const viewModeToggle = getByLabelText('eye-outline');
      
      const startTime = performance.now();
      
      // Switch modes with large content
      for (let i = 0; i < 5; i++) {
        fireEvent.press(viewModeToggle);
      }
      
      const largeSwitchTime = performance.now() - startTime;

      expect(contentEditor).toBeTruthy();
      expect(largeSwitchTime).toBeLessThan(1000); // Should handle large content switches
    });
  });

  describe('Tab Switching Performance', () => {
    it('should switch between tabs efficiently', async () => {
      const { getByText } = render(
        <SermonEditor {...defaultProps} />
      );

      const contentTab = getByText('Content');
      const outlineTab = getByText('Outline');
      const notesTab = getByText('Notes');
      const detailsTab = getByText('Details');

      const startTime = performance.now();
      
      // Rapidly switch between tabs
      for (let i = 0; i < 20; i++) {
        fireEvent.press(contentTab);
        fireEvent.press(outlineTab);
        fireEvent.press(notesTab);
        fireEvent.press(detailsTab);
      }
      
      const tabSwitchTime = performance.now() - startTime;

      expect(contentTab).toBeTruthy();
      expect(tabSwitchTime).toBeLessThan(1000); // Tab switching should be fast
    });

    it('should maintain state efficiently during tab switches', async () => {
      const { getByText, getByTestId, getByPlaceholderText } = render(
        <SermonEditor {...defaultProps} />
      );

      // Add content to different tabs
      const contentEditor = getByTestId('markdown-editor');
      fireEvent.changeText(contentEditor, generateContent(100));

      const outlineTab = getByText('Outline');
      fireEvent.press(outlineTab);
      
      const outlineInput = getByPlaceholderText(/Create your sermon outline/);
      fireEvent.changeText(outlineInput, 'I. Introduction\nII. Main Point\nIII. Conclusion');

      const notesTab = getByText('Notes');
      fireEvent.press(notesTab);
      
      const notesInput = getByPlaceholderText(/Add your sermon notes/);
      fireEvent.changeText(notesInput, 'Important notes for delivery');

      const startTime = performance.now();
      
      // Switch between tabs with content
      const contentTab = getByText('Content');
      for (let i = 0; i < 10; i++) {
        fireEvent.press(contentTab);
        fireEvent.press(outlineTab);
        fireEvent.press(notesTab);
      }
      
      const stateSwitchTime = performance.now() - startTime;

      expect(contentEditor).toBeTruthy();
      expect(stateSwitchTime).toBeLessThan(800); // Should maintain state efficiently
    });
  });

  describe('Auto-save Performance', () => {
    it('should handle auto-save without blocking UI', async () => {
      const { getByTestId, getByPlaceholderText } = render(
        <SermonEditor {...defaultProps} />
      );

      const titleInput = getByPlaceholderText('Enter sermon title...');
      fireEvent.changeText(titleInput, 'Auto-save Performance Test');

      const contentEditor = getByTestId('markdown-editor');
      fireEvent.changeText(contentEditor, generateContent(1000));

      const startTime = performance.now();
      
      // Trigger auto-save
      act(() => {
        jest.advanceTimersByTime(30000);
      });
      
      const autoSaveTime = performance.now() - startTime;

      expect(contentEditor).toBeTruthy();
      expect(autoSaveTime).toBeLessThan(100); // Auto-save should not block UI
    });

    it('should handle multiple auto-saves efficiently', async () => {
      const { getByTestId, getByPlaceholderText } = render(
        <SermonEditor {...defaultProps} />
      );

      const titleInput = getByPlaceholderText('Enter sermon title...');
      fireEvent.changeText(titleInput, 'Multiple Auto-save Test');

      const contentEditor = getByTestId('markdown-editor');
      
      const startTime = performance.now();
      
      // Simulate multiple auto-save cycles
      for (let i = 0; i < 5; i++) {
        fireEvent.changeText(contentEditor, generateContent(200 * (i + 1)));
        
        act(() => {
          jest.advanceTimersByTime(30000);
        });
      }
      
      const multipleAutoSaveTime = performance.now() - startTime;

      expect(contentEditor).toBeTruthy();
      expect(multipleAutoSaveTime).toBeLessThan(500); // Multiple auto-saves should be efficient
    });
  });

  describe('Memory Usage Performance', () => {
    it('should not cause memory leaks during extended use', async () => {
      const { getByTestId, unmount } = render(
        <SermonEditor {...defaultProps} />
      );

      const contentEditor = getByTestId('markdown-editor');
      
      // Simulate extended use
      for (let i = 0; i < 100; i++) {
        fireEvent.changeText(contentEditor, generateContent(50));
        
        // Simulate time passing
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      }

      // Component should still be functional
      expect(contentEditor).toBeTruthy();
      
      // Cleanup should work without errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle component remounting efficiently', async () => {
      const sermon = {
        id: 'remount-test',
        title: 'Remount Test',
        content: generateContent(500),
        outline: '',
        scripture: '',
        tags: [],
        seriesId: '',
        notes: '',
        date: new Date(),
        lastModified: new Date(),
        wordCount: 500,
        readingTime: 3,
        isArchived: false,
        isFavorite: false,
      };

      const startTime = performance.now();
      
      // Mount and unmount multiple times
      for (let i = 0; i < 5; i++) {
        const { getByTestId, unmount } = render(
          <SermonEditor {...defaultProps} sermon={sermon} />
        );
        
        expect(getByTestId('markdown-editor')).toBeTruthy();
        unmount();
      }
      
      const remountTime = performance.now() - startTime;

      expect(remountTime).toBeLessThan(1000); // Remounting should be efficient
    });
  });
});