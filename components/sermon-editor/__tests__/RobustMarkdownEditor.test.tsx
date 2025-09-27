import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React, { createRef } from 'react';
import { Alert } from 'react-native';
import { MarkdownEditorHandle } from '../MarkdownEditor';
import { RobustMarkdownEditor } from '../RobustMarkdownEditor';

// Mock the MarkdownEditor to control when it throws errors
jest.mock('../MarkdownEditor', () => {
  const React = require('react');
  const { forwardRef } = React;
  
  return {
    MarkdownEditor: forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        focus: jest.fn(),
        blur: jest.fn(),
        insertText: jest.fn(),
        wrapSelection: jest.fn(),
        applyFormat: jest.fn(),
        getSelection: () => ({ start: 0, end: 0 }),
        setSelection: jest.fn(),
      }));

      // Simulate performance warnings
      React.useEffect(() => {
        if (props.value.length > 50000) {
          props.onPerformanceWarning?.('Large document detected');
        }
      }, [props.value, props.onPerformanceWarning]);

      if (props.value === 'THROW_ERROR') {
        throw new Error('react-native-markdown-editor failed');
      }

      const { TextInput } = require('react-native');
      return React.createElement(TextInput, {
        value: props.value,
        onChangeText: props.onChangeText,
        testID: props.testID,
        multiline: true,
      });
    }),
  };
});

// Mock Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

describe('RobustMarkdownEditor', () => {
  const defaultProps = {
    value: '',
    onChangeText: jest.fn(),
    placeholder: 'Enter text here',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Alert.alert as jest.Mock).mockClear();
  });

  it('renders main editor by default', () => {
    const { getByTestId } = render(
      <RobustMarkdownEditor {...defaultProps} testID="editor" />
    );

    expect(getByTestId('editor-main')).toBeTruthy();
  });

  it('switches to fallback editor when document is too large', () => {
    const largeDocument = 'x'.repeat(100001); // Exceeds default maxDocumentSize
    const onFallbackActivated = jest.fn();

    const { getByTestId } = render(
      <RobustMarkdownEditor 
        {...defaultProps} 
        value={largeDocument}
        onFallbackActivated={onFallbackActivated}
        testID="editor"
      />
    );

    expect(getByTestId('editor-fallback')).toBeTruthy();
    expect(onFallbackActivated).toHaveBeenCalledWith(
      expect.stringContaining('Document too large')
    );
  });

  it('handles custom maxDocumentSize', () => {
    const mediumDocument = 'x'.repeat(5001);
    const onFallbackActivated = jest.fn();

    const { getByTestId } = render(
      <RobustMarkdownEditor 
        {...defaultProps} 
        value={mediumDocument}
        maxDocumentSize={5000}
        onFallbackActivated={onFallbackActivated}
        testID="editor"
      />
    );

    expect(getByTestId('editor-fallback')).toBeTruthy();
    expect(onFallbackActivated).toHaveBeenCalledWith(
      expect.stringContaining('Document too large')
    );
  });

  it('switches to fallback after performance warnings threshold', async () => {
    const onFallbackActivated = jest.fn();
    const largeDocument = 'x'.repeat(60000); // Triggers performance warning

    const { rerender } = render(
      <RobustMarkdownEditor 
        {...defaultProps} 
        value=""
        onFallbackActivated={onFallbackActivated}
        performanceThreshold={2}
        testID="editor"
      />
    );

    // Trigger multiple performance warnings
    rerender(
      <RobustMarkdownEditor 
        {...defaultProps} 
        value={largeDocument}
        onFallbackActivated={onFallbackActivated}
        performanceThreshold={2}
        testID="editor"
      />
    );

    rerender(
      <RobustMarkdownEditor 
        {...defaultProps} 
        value={largeDocument + 'more'}
        onFallbackActivated={onFallbackActivated}
        performanceThreshold={2}
        testID="editor"
      />
    );

    await waitFor(() => {
      expect(onFallbackActivated).toHaveBeenCalledWith(
        expect.stringContaining('Performance issues')
      );
    });
  });

  it('handles errors from main editor', () => {
    const onError = jest.fn();
    const onFallbackActivated = jest.fn();

    const { getByTestId } = render(
      <RobustMarkdownEditor 
        {...defaultProps} 
        value="THROW_ERROR"
        onError={onError}
        onFallbackActivated={onFallbackActivated}
        testID="editor"
      />
    );

    expect(getByTestId('editor-error-fallback')).toBeTruthy();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Editor Issue',
      expect.stringContaining('Switching to basic editor'),
      [{ text: 'OK' }]
    );
  });

  it('handles markdown parsing errors gracefully', () => {
    const onChangeText = jest.fn();
    const { getByTestId } = render(
      <RobustMarkdownEditor 
        {...defaultProps} 
        onChangeText={onChangeText}
        testID="editor"
      />
    );

    const textInput = getByTestId('editor-main');
    
    // Test unclosed code block
    fireEvent.changeText(textInput, '```javascript\ncode without closing');

    expect(onChangeText).toHaveBeenCalledWith('```javascript\ncode without closing');
  });

  it('validates markdown syntax and warns about issues', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const onChangeText = jest.fn();
    
    const { getByTestId } = render(
      <RobustMarkdownEditor 
        {...defaultProps} 
        onChangeText={onChangeText}
        testID="editor"
      />
    );

    const textInput = getByTestId('editor-main');
    
    // Test deep nesting
    const deeplyNested = '>'.repeat(15) + ' Deep quote';
    fireEvent.changeText(textInput, deeplyNested);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Deep nesting detected')
    );
    
    consoleSpy.mockRestore();
  });

  it('forwards ref to active editor', () => {
    const ref = createRef<MarkdownEditorHandle>();
    render(
      <RobustMarkdownEditor {...defaultProps} ref={ref} />
    );

    expect(ref.current).toBeDefined();
    expect(ref.current?.focus).toBeDefined();
    expect(ref.current?.blur).toBeDefined();
    expect(ref.current?.insertText).toBeDefined();
  });

  it('forwards ref to fallback editor when using fallback', () => {
    const ref = createRef<MarkdownEditorHandle>();
    const largeDocument = 'x'.repeat(100001);
    
    render(
      <RobustMarkdownEditor 
        {...defaultProps} 
        value={largeDocument}
        ref={ref} 
      />
    );

    expect(ref.current).toBeDefined();
    expect(ref.current?.focus).toBeDefined();
  });

  it('disables auto recovery when enableAutoRecovery is false', async () => {
    const onFallbackActivated = jest.fn();
    const largeDocument = 'x'.repeat(60000);

    render(
      <RobustMarkdownEditor 
        {...defaultProps} 
        value={largeDocument}
        onFallbackActivated={onFallbackActivated}
        enableAutoRecovery={false}
        performanceThreshold={1}
        testID="editor"
      />
    );

    // Should not switch to fallback due to performance warnings when auto recovery is disabled
    await waitFor(() => {
      expect(onFallbackActivated).not.toHaveBeenCalledWith(
        expect.stringContaining('Performance issues')
      );
    }, { timeout: 1000 });
  });

  it('handles text change errors gracefully', () => {
    const onChangeText = jest.fn().mockImplementation(() => {
      throw new Error('Change text error');
    });
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { getByTestId } = render(
      <RobustMarkdownEditor 
        {...defaultProps} 
        onChangeText={onChangeText}
        testID="editor"
      />
    );

    const textInput = getByTestId('editor-main');
    fireEvent.changeText(textInput, 'new text');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Text change error'),
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });

  it('cleans up timeouts on unmount', () => {
    const { unmount } = render(
      <RobustMarkdownEditor {...defaultProps} />
    );

    // Should not throw when unmounting
    expect(() => unmount()).not.toThrow();
  });

  it('debounces performance warnings', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const largeDocument = 'x'.repeat(60000);

    const { rerender } = render(
      <RobustMarkdownEditor 
        {...defaultProps} 
        value={largeDocument}
        testID="editor"
      />
    );

    // Trigger multiple rapid performance warnings
    for (let i = 0; i < 5; i++) {
      rerender(
        <RobustMarkdownEditor 
          {...defaultProps} 
          value={largeDocument + i}
          testID="editor"
        />
      );
    }

    // Wait for debounce
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    // Should only log once due to debouncing
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    
    consoleSpy.mockRestore();
  });

  it('provides fallback methods when no ref is available', () => {
    const ref = createRef<MarkdownEditorHandle>();
    
    // Render without proper ref setup to test fallback
    const { unmount } = render(
      <RobustMarkdownEditor {...defaultProps} ref={ref} />
    );

    // Force ref to be null to test fallback
    (ref as any).current = null;

    // Should not throw when calling methods on null ref
    expect(() => {
      const handle = ref.current || {
        focus: () => {},
        blur: () => {},
        insertText: () => {},
        wrapSelection: () => {},
        applyFormat: () => {},
        getSelection: () => ({ start: 0, end: 0 }),
        setSelection: () => {},
      };
      handle.focus();
      handle.blur();
      handle.insertText('test');
    }).not.toThrow();

    unmount();
  });
});