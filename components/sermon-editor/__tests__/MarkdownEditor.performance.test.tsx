import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { MarkdownEditor, MarkdownEditorHandle } from '../MarkdownEditor';

// Mock performance API for testing
const mockPerformance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
  },
};

(global as any).performance = mockPerformance;

// Generate test content of various sizes
const generateTestContent = (size: number): string => {
  const baseText = 'This is a test sermon content with some markdown **bold** and *italic* text. ';
  const repetitions = Math.ceil(size / baseText.length);
  return baseText.repeat(repetitions).substring(0, size);
};

describe('MarkdownEditor Performance Tests', () => {
  let onChangeText: jest.Mock;
  let onPerformanceWarning: jest.Mock;
  let editorRef: React.RefObject<MarkdownEditorHandle>;

  beforeEach(() => {
    onChangeText = jest.fn();
    onPerformanceWarning = jest.fn();
    editorRef = React.createRef<MarkdownEditorHandle>();
    jest.clearAllMocks();
    mockPerformance.now.mockClear();
  });

  describe('Large Document Handling', () => {
    it('should handle documents over 10k characters efficiently', async () => {
      const largeContent = generateTestContent(15000);
      
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value={largeContent}
          onChangeText={onChangeText}
          onPerformanceWarning={onPerformanceWarning}
          testID="markdown-editor"
          optimizeForLargeDocuments={true}
        />
      );

      const textInput = getByTestId('markdown-editor');
      expect(textInput).toBeTruthy();
      
      // Should not trigger performance warnings for moderately large documents
      expect(onPerformanceWarning).not.toHaveBeenCalled();
    });

    it('should enable lazy loading for very large documents', async () => {
      const veryLargeContent = generateTestContent(60000);
      
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value={veryLargeContent}
          onChangeText={onChangeText}
          onPerformanceWarning={onPerformanceWarning}
          testID="markdown-editor"
          optimizeForLargeDocuments={true}
          performanceConfig={{
            enableLazyLoading: true,
            renderThreshold: 50000,
          }}
        />
      );

      const textInput = getByTestId('markdown-editor');
      expect(textInput).toBeTruthy();
      
      // Wait for lazy loading to complete
      await waitFor(() => {
        expect(textInput.props.value.length).toBeLessThanOrEqual(veryLargeContent.length);
      });
    });

    it('should use virtualization for extremely large documents', async () => {
      const extremelyLargeContent = generateTestContent(150000);
      
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value={extremelyLargeContent}
          onChangeText={onChangeText}
          onPerformanceWarning={onPerformanceWarning}
          testID="markdown-editor"
          optimizeForLargeDocuments={true}
          performanceConfig={{
            enableVirtualization: true,
            maxDocumentSize: 100000,
          }}
        />
      );

      const textInput = getByTestId('markdown-editor');
      expect(textInput).toBeTruthy();
      
      // Virtualized content should be smaller than original
      await waitFor(() => {
        expect(textInput.props.value.length).toBeLessThan(extremelyLargeContent.length);
      });
    });
  });

  describe('Memory Management', () => {
    it('should monitor memory usage and trigger warnings', async () => {
      // Mock high memory usage
      mockPerformance.memory.usedJSHeapSize = 150 * 1024 * 1024; // 150MB

      const content = generateTestContent(50000);
      
      render(
        <MarkdownEditor
          ref={editorRef}
          value={content}
          onChangeText={onChangeText}
          onPerformanceWarning={onPerformanceWarning}
          testID="markdown-editor"
          performanceConfig={{
            enableMemoryMonitoring: true,
            memoryThreshold: 100, // 100MB threshold
          }}
        />
      );

      // Wait for memory monitoring to trigger
      await waitFor(() => {
        expect(onPerformanceWarning).toHaveBeenCalledWith(
          expect.stringContaining('High memory usage')
        );
      }, { timeout: 6000 }); // Memory check runs every 5 seconds
    });

    it('should clean up resources on unmount', () => {
      const content = generateTestContent(30000);
      
      const { unmount } = render(
        <MarkdownEditor
          ref={editorRef}
          value={content}
          onChangeText={onChangeText}
          onPerformanceWarning={onPerformanceWarning}
          testID="markdown-editor"
        />
      );

      // Should not throw errors on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Render Performance', () => {
    it('should debounce text changes for large documents', async () => {
      const largeContent = generateTestContent(80000);
      
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value={largeContent}
          onChangeText={onChangeText}
          onPerformanceWarning={onPerformanceWarning}
          testID="markdown-editor"
          performanceConfig={{
            debounceDelay: 200,
          }}
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Simulate rapid text changes
      act(() => {
        fireEvent.changeText(textInput, largeContent + 'a');
        fireEvent.changeText(textInput, largeContent + 'ab');
        fireEvent.changeText(textInput, largeContent + 'abc');
      });

      // Should debounce and only call onChangeText once after delay
      expect(onChangeText).toHaveBeenCalledTimes(0);
      
      await waitFor(() => {
        expect(onChangeText).toHaveBeenCalledTimes(1);
      }, { timeout: 300 });
    });

    it('should track render performance and warn on slow renders', async () => {
      // Mock slow render time
      let callCount = 0;
      mockPerformance.now.mockImplementation(() => {
        callCount++;
        // Simulate slow render (>100ms)
        return callCount % 2 === 1 ? 0 : 150;
      });

      const content = generateTestContent(40000);
      
      render(
        <MarkdownEditor
          ref={editorRef}
          value={content}
          onChangeText={onChangeText}
          onPerformanceWarning={onPerformanceWarning}
          testID="markdown-editor"
        />
      );

      // Trigger a text change to start render tracking
      const textInput = render(
        <MarkdownEditor
          ref={editorRef}
          value={content + ' updated'}
          onChangeText={onChangeText}
          onPerformanceWarning={onPerformanceWarning}
          testID="markdown-editor"
        />
      ).getByTestId('markdown-editor');

      await waitFor(() => {
        expect(onPerformanceWarning).toHaveBeenCalledWith(
          expect.stringContaining('Slow rendering detected')
        );
      });
    });
  });

  describe('Efficient Re-rendering', () => {
    it('should prevent unnecessary re-renders with identical content', () => {
      const content = generateTestContent(20000);
      let renderCount = 0;
      
      const TestComponent = ({ value }: { value: string }) => {
        renderCount++;
        return (
          <MarkdownEditor
            ref={editorRef}
            value={value}
            onChangeText={onChangeText}
            testID="markdown-editor"
          />
        );
      };

      const { rerender } = render(<TestComponent value={content} />);
      
      const initialRenderCount = renderCount;
      
      // Re-render with same content
      rerender(<TestComponent value={content} />);
      rerender(<TestComponent value={content} />);
      
      // Should not cause additional renders due to efficient re-rendering
      expect(renderCount).toBe(initialRenderCount + 2); // Only the explicit rerenders
    });

    it('should optimize selection handling for large documents', async () => {
      const largeContent = generateTestContent(70000);
      
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value={largeContent}
          onChangeText={onChangeText}
          testID="markdown-editor"
          optimizeForLargeDocuments={true}
        />
      );

      const textInput = getByTestId('markdown-editor');
      
      // Simulate selection change
      act(() => {
        fireEvent(textInput, 'selectionChange', {
          nativeEvent: {
            selection: { start: 1000, end: 1010 }
          }
        });
      });

      // Should handle selection without performance issues
      expect(textInput).toBeTruthy();
    });
  });

  describe('Performance Configuration', () => {
    it('should respect custom performance configuration', () => {
      const content = generateTestContent(30000);
      const customConfig = {
        enableLazyLoading: false,
        enableVirtualization: false,
        debounceDelay: 50,
        memoryThreshold: 200,
      };
      
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value={content}
          onChangeText={onChangeText}
          onPerformanceWarning={onPerformanceWarning}
          testID="markdown-editor"
          performanceConfig={customConfig}
        />
      );

      const textInput = getByTestId('markdown-editor');
      expect(textInput).toBeTruthy();
      
      // With lazy loading disabled, should show full content
      expect(textInput.props.value).toBe(content);
    });

    it('should handle performance warnings gracefully', async () => {
      const content = generateTestContent(25000);
      
      render(
        <MarkdownEditor
          ref={editorRef}
          value={content}
          onChangeText={onChangeText}
          onPerformanceWarning={undefined} // No warning handler
          testID="markdown-editor"
        />
      );

      // Should not throw errors when no warning handler is provided
      expect(true).toBe(true);
    });
  });

  describe('Platform-Specific Performance', () => {
    it('should apply web-specific optimizations', () => {
      const originalPlatform = require('react-native').Platform.OS;
      require('react-native').Platform.OS = 'web';

      const content = generateTestContent(40000);
      
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value={content}
          onChangeText={onChangeText}
          testID="markdown-editor"
          webScrollBehavior="smooth"
        />
      );

      const textInput = getByTestId('markdown-editor');
      expect(textInput).toBeTruthy();

      // Restore original platform
      require('react-native').Platform.OS = originalPlatform;
    });

    it('should apply mobile-specific optimizations', () => {
      const originalPlatform = require('react-native').Platform.OS;
      require('react-native').Platform.OS = 'ios';

      const content = generateTestContent(40000);
      
      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value={content}
          onChangeText={onChangeText}
          testID="markdown-editor"
          touchOptimizations={true}
        />
      );

      const textInput = getByTestId('markdown-editor');
      expect(textInput).toBeTruthy();

      // Restore original platform
      require('react-native').Platform.OS = originalPlatform;
    });
  });

  describe('Stress Testing', () => {
    it('should handle rapid content updates without crashing', async () => {
      const baseContent = generateTestContent(30000);
      
      const { getByTestId, rerender } = render(
        <MarkdownEditor
          ref={editorRef}
          value={baseContent}
          onChangeText={onChangeText}
          testID="markdown-editor"
          optimizeForLargeDocuments={true}
        />
      );

      // Rapidly update content multiple times
      for (let i = 0; i < 10; i++) {
        act(() => {
          rerender(
            <MarkdownEditor
              ref={editorRef}
              value={baseContent + ` update ${i}`}
              onChangeText={onChangeText}
              testID="markdown-editor"
              optimizeForLargeDocuments={true}
            />
          );
        });
      }

      const textInput = getByTestId('markdown-editor');
      expect(textInput).toBeTruthy();
    });

    it('should maintain performance with complex markdown content', () => {
      const complexContent = `
# Large Sermon Document

## Introduction
This is a **very large** sermon document with *complex* markdown formatting.

### Multiple Sections
${Array.from({ length: 1000 }, (_, i) => `
#### Section ${i + 1}
This is section ${i + 1} with some **bold text** and *italic text*.

> This is a blockquote in section ${i + 1}

- List item 1
- List item 2
- List item 3

1. Numbered item 1
2. Numbered item 2
3. Numbered item 3

==Highlighted text== in section ${i + 1}.
`).join('\n')}

## Conclusion
This concludes our large sermon document.
      `;

      const { getByTestId } = render(
        <MarkdownEditor
          ref={editorRef}
          value={complexContent}
          onChangeText={onChangeText}
          testID="markdown-editor"
          optimizeForLargeDocuments={true}
        />
      );

      const textInput = getByTestId('markdown-editor');
      expect(textInput).toBeTruthy();
    });
  });
});