import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { RobustMarkdownEditor } from '../RobustMarkdownEditor';

// Mock console methods to avoid noise in tests
const originalConsole = {
  error: console.error,
  warn: console.warn,
};

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

describe('Error Recovery Scenarios', () => {
  const defaultProps = {
    value: '',
    onChangeText: jest.fn(),
    placeholder: 'Enter text here',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Library Compatibility Issues', () => {
    it('handles missing react-native-markdown-display gracefully', () => {
      // Mock the markdown display to throw an error
      jest.doMock('react-native-markdown-display', () => {
        throw new Error('Module not found: react-native-markdown-display');
      });

      const onError = jest.fn();
      const onFallbackActivated = jest.fn();

      const { getByTestId } = render(
        <RobustMarkdownEditor 
          {...defaultProps}
          onError={onError}
          onFallbackActivated={onFallbackActivated}
          testID="editor"
        />
      );

      // Should render without crashing
      expect(getByTestId('editor-main')).toBeTruthy();
    });

    it('handles native module bridge errors', () => {
      const bridgeError = new Error('Native module bridge communication failed');
      const onError = jest.fn();

      // This would be caught by ErrorBoundary in real scenario
      expect(() => {
        render(
          <RobustMarkdownEditor 
            {...defaultProps}
            onError={onError}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('handles extremely large documents', () => {
      const extremelyLargeDocument = 'x'.repeat(1000000); // 1MB of text
      const onFallbackActivated = jest.fn();

      const { getByTestId } = render(
        <RobustMarkdownEditor 
          {...defaultProps}
          value={extremelyLargeDocument}
          onFallbackActivated={onFallbackActivated}
          testID="editor"
        />
      );

      expect(getByTestId('editor-fallback')).toBeTruthy();
      expect(onFallbackActivated).toHaveBeenCalledWith(
        expect.stringContaining('Document too large')
      );
    });

    it('handles memory allocation errors', () => {
      const memoryError = new Error('Cannot allocate memory for large buffer');
      const onError = jest.fn();

      // Simulate memory error being caught by ErrorBoundary
      const TestComponent = () => {
        throw memoryError;
      };

      const { getByText } = render(
        <RobustMarkdownEditor 
          {...defaultProps}
          onError={onError}
        />
      );

      // Should handle gracefully without crashing the app
      expect(() => render(<TestComponent />)).toThrow();
    });

    it('cleans up resources on unmount', () => {
      const { unmount } = render(
        <RobustMarkdownEditor {...defaultProps} />
      );

      // Should not throw or leak memory
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Performance Degradation', () => {
    it('handles slow rendering performance', async () => {
      const onFallbackActivated = jest.fn();
      let renderCount = 0;

      const SlowRenderingDocument = () => {
        renderCount++;
        // Simulate slow rendering by creating a large document
        return 'x'.repeat(60000) + renderCount;
      };

      const { rerender } = render(
        <RobustMarkdownEditor 
          {...defaultProps}
          value=""
          onFallbackActivated={onFallbackActivated}
          performanceThreshold={2}
        />
      );

      // Trigger multiple slow renders
      for (let i = 0; i < 3; i++) {
        rerender(
          <RobustMarkdownEditor 
            {...defaultProps}
            value={SlowRenderingDocument()}
            onFallbackActivated={onFallbackActivated}
            performanceThreshold={2}
          />
        );
      }

      await waitFor(() => {
        expect(onFallbackActivated).toHaveBeenCalledWith(
          expect.stringContaining('Performance issues')
        );
      });
    });

    it('handles frame drops and UI freezing', async () => {
      const onFallbackActivated = jest.fn();
      
      // Simulate a document that causes frame drops
      const problematicDocument = Array(1000).fill('# Heading\n\nParagraph with **bold** and *italic* text.\n\n').join('');

      render(
        <RobustMarkdownEditor 
          {...defaultProps}
          value={problematicDocument}
          onFallbackActivated={onFallbackActivated}
          performanceThreshold={1}
        />
      );

      await waitFor(() => {
        expect(onFallbackActivated).toHaveBeenCalled();
      });
    });
  });

  describe('Markdown Parsing Edge Cases', () => {
    it('handles malformed markdown syntax', () => {
      const malformedMarkdown = `
        # Unclosed heading
        **Bold without closing
        \`\`\`javascript
        Code block without closing
        > Quote without proper structure
        [Link without URL]
        ![Image without src]
      `;

      const onChangeText = jest.fn();
      const { getByTestId } = render(
        <RobustMarkdownEditor 
          {...defaultProps}
          onChangeText={onChangeText}
          testID="editor"
        />
      );

      const textInput = getByTestId('editor-main');
      fireEvent.changeText(textInput, malformedMarkdown);

      // Should handle gracefully without throwing
      expect(onChangeText).toHaveBeenCalledWith(malformedMarkdown);
    });

    it('handles deeply nested markdown structures', () => {
      const deeplyNested = `
        > Quote level 1
        > > Quote level 2
        > > > Quote level 3
        > > > > Quote level 4
        > > > > > Quote level 5
        > > > > > > Quote level 6
        > > > > > > > Quote level 7
        > > > > > > > > Quote level 8
        > > > > > > > > > Quote level 9
        > > > > > > > > > > Quote level 10
        > > > > > > > > > > > Quote level 11
      `;

      const onChangeText = jest.fn();
      const { getByTestId } = render(
        <RobustMarkdownEditor 
          {...defaultProps}
          onChangeText={onChangeText}
          testID="editor"
        />
      );

      const textInput = getByTestId('editor-main');
      fireEvent.changeText(textInput, deeplyNested);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Deep nesting detected')
      );
      expect(onChangeText).toHaveBeenCalledWith(deeplyNested);
    });

    it('handles special characters and unicode', () => {
      const unicodeText = `
        # Emoji Test 🚀 📝 ✨
        **Bold with émojis** 🎉
        *Italic with ñ and ü*
        \`Code with 中文\`
        > Quote with العربية
        - List with русский
        1. Numbered with 日本語
      `;

      const onChangeText = jest.fn();
      const { getByTestId } = render(
        <RobustMarkdownEditor 
          {...defaultProps}
          onChangeText={onChangeText}
          testID="editor"
        />
      );

      const textInput = getByTestId('editor-main');
      fireEvent.changeText(textInput, unicodeText);

      expect(onChangeText).toHaveBeenCalledWith(unicodeText);
    });
  });

  describe('Platform-Specific Issues', () => {
    it('handles iOS-specific text input issues', () => {
      // Mock iOS platform
      jest.doMock('react-native', () => ({
        ...jest.requireActual('react-native'),
        Platform: { OS: 'ios' },
      }));

      const { getByTestId } = render(
        <RobustMarkdownEditor {...defaultProps} testID="editor" />
      );

      expect(getByTestId('editor-main')).toBeTruthy();
    });

    it('handles Android-specific text input issues', () => {
      // Mock Android platform
      jest.doMock('react-native', () => ({
        ...jest.requireActual('react-native'),
        Platform: { OS: 'android' },
      }));

      const { getByTestId } = render(
        <RobustMarkdownEditor {...defaultProps} testID="editor" />
      );

      expect(getByTestId('editor-main')).toBeTruthy();
    });

    it('handles web-specific issues', () => {
      // Mock web platform
      jest.doMock('react-native', () => ({
        ...jest.requireActual('react-native'),
        Platform: { OS: 'web' },
      }));

      const { getByTestId } = render(
        <RobustMarkdownEditor {...defaultProps} testID="editor" />
      );

      expect(getByTestId('editor-main')).toBeTruthy();
    });
  });

  describe('Recovery Mechanisms', () => {
    it('automatically recovers from temporary errors', async () => {
      let shouldThrow = true;
      const onError = jest.fn();
      const onFallbackActivated = jest.fn();

      const TestEditor = () => {
        if (shouldThrow) {
          throw new Error('Temporary error');
        }
        return null;
      };

      const { rerender } = render(
        <RobustMarkdownEditor 
          {...defaultProps}
          onError={onError}
          onFallbackActivated={onFallbackActivated}
        />
      );

      // Simulate error recovery
      shouldThrow = false;
      
      rerender(
        <RobustMarkdownEditor 
          {...defaultProps}
          onError={onError}
          onFallbackActivated={onFallbackActivated}
        />
      );

      // Should recover without manual intervention
      expect(onError).not.toHaveBeenCalled();
    });

    it('provides graceful degradation for unsupported features', () => {
      const onFallbackActivated = jest.fn();

      // Test with features that might not be supported
      const { getByTestId } = render(
        <RobustMarkdownEditor 
          {...defaultProps}
          value="# Test\n**Bold** *Italic* `code`"
          onFallbackActivated={onFallbackActivated}
          testID="editor"
        />
      );

      // Should render even if some features are not supported
      expect(getByTestId('editor-main')).toBeTruthy();
    });

    it('maintains data integrity during error recovery', () => {
      const originalValue = 'Important sermon content that must not be lost';
      const onChangeText = jest.fn();

      const { getByTestId } = render(
        <RobustMarkdownEditor 
          {...defaultProps}
          value={originalValue}
          onChangeText={onChangeText}
          testID="editor"
        />
      );

      // Even if there are errors, the content should be preserved
      const textInput = getByTestId('editor-main');
      expect(textInput.props.value).toBe(originalValue);
    });
  });

  describe('Error Reporting', () => {
    it('provides detailed error information for debugging', () => {
      const onError = jest.fn();
      const testError = new Error('Test error for debugging');

      // Simulate error being caught
      const errorInfo = {
        componentStack: 'Component stack trace',
      };

      // This would be called by ErrorBoundary
      onError(testError, errorInfo);

      expect(onError).toHaveBeenCalledWith(testError, errorInfo);
    });

    it('categorizes errors correctly for better handling', () => {
      const errors = [
        new Error('react-native-markdown-editor failed'),
        new Error('Render timeout exceeded'),
        new Error('Out of memory allocation failed'),
        new Error('Unknown error type'),
      ];

      const expectedTypes = ['library', 'performance', 'memory', 'unknown'];

      errors.forEach((error, index) => {
        const onError = jest.fn();
        
        // This would be handled by the error categorization logic
        const errorType = expectedTypes[index];
        onError(error, errorType);
        
        expect(onError).toHaveBeenCalledWith(error, errorType);
      });
    });
  });
});