import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ErrorBoundary } from './ErrorBoundary';
import { FallbackEditor } from './FallbackEditor';
import { MarkdownEditor, MarkdownEditorHandle, MarkdownEditorProps } from './MarkdownEditor';

interface RobustMarkdownEditorProps extends MarkdownEditorProps {
  onError?: (error: Error, errorType: 'library' | 'performance' | 'memory' | 'unknown') => void;
  onFallbackActivated?: (reason: string) => void;
  enableAutoRecovery?: boolean;
  maxDocumentSize?: number;
  performanceThreshold?: number;
}

interface EditorState {
  useFallback: boolean;
  errorCount: number;
  lastError: Error | null;
  performanceWarnings: number;
  memoryWarnings: number;
}

/**
 * Robust wrapper around MarkdownEditor that provides error handling,
 * fallback mechanisms, and automatic recovery for various failure scenarios.
 */
export const RobustMarkdownEditor = forwardRef<MarkdownEditorHandle, RobustMarkdownEditorProps>(
  ({ 
    onError,
    onFallbackActivated,
    enableAutoRecovery = true,
    maxDocumentSize = 100000,
    performanceThreshold = 3,
    ...props 
  }, ref) => {
    const [editorState, setEditorState] = useState<EditorState>({
      useFallback: false,
      errorCount: 0,
      lastError: null,
      performanceWarnings: 0,
      memoryWarnings: 0,
    });

    const editorRef = useRef<MarkdownEditorHandle>(null);
    const fallbackRef = useRef<MarkdownEditorHandle>(null);
    const performanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Forward ref to the active editor
    React.useImperativeHandle(ref, () => {
      const activeRef = editorState.useFallback ? fallbackRef : editorRef;
      return activeRef.current || {
        focus: () => {},
        blur: () => {},
        insertText: () => {},
        wrapSelection: () => {},
        applyFormat: () => {},
        getSelection: () => ({ start: 0, end: 0 }),
        setSelection: () => {},
      };
    }, [editorState.useFallback]);

    // Check if document is too large for optimal editing
    const isDocumentTooLarge = props.value.length > maxDocumentSize;

    // Handle errors from ErrorBoundary
    const handleError = useCallback((error: Error, errorInfo: React.ErrorInfo) => {
      const errorType = categorizeError(error);
      
      setEditorState(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1,
        lastError: error,
        useFallback: true,
      }));

      // Log error for debugging
      console.error('RobustMarkdownEditor: Error caught', {
        error: error.message,
        errorType,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });

      // Notify parent component
      onError?.(error, errorType);
      onFallbackActivated?.(`Error: ${error.message}`);

      // Show user-friendly error message
      if (errorType === 'library') {
        Alert.alert(
          'Editor Issue',
          'The advanced editor encountered a problem. Switching to basic editor.',
          [{ text: 'OK' }]
        );
      }
    }, [onError, onFallbackActivated]);

    // Handle performance warnings
    const handlePerformanceWarning = useCallback((warning: string) => {
      setEditorState(prev => {
        const newWarningCount = prev.performanceWarnings + 1;
        
        // If we've exceeded the performance threshold, switch to fallback
        if (enableAutoRecovery && newWarningCount >= performanceThreshold) {
          onFallbackActivated?.(`Performance issues: ${warning}`);
          return {
            ...prev,
            performanceWarnings: newWarningCount,
            useFallback: true,
          };
        }
        
        return {
          ...prev,
          performanceWarnings: newWarningCount,
        };
      });

      // Debounce performance warnings to avoid spam
      if (performanceTimeoutRef.current) {
        clearTimeout(performanceTimeoutRef.current);
      }
      
      performanceTimeoutRef.current = setTimeout(() => {
        console.warn('RobustMarkdownEditor: Performance warning', warning);
      }, 1000);
    }, [enableAutoRecovery, performanceThreshold, onFallbackActivated]);

    // Handle retry attempts
    const handleRetry = useCallback(() => {
      setEditorState(prev => ({
        ...prev,
        useFallback: false,
        errorCount: 0,
        lastError: null,
        performanceWarnings: 0,
        memoryWarnings: 0,
      }));
    }, []);

    // Check for edge cases that should trigger fallback
    useEffect(() => {
      // Switch to fallback for extremely large documents
      if (isDocumentTooLarge && !editorState.useFallback) {
        setEditorState(prev => ({ ...prev, useFallback: true }));
        onFallbackActivated?.(`Document too large: ${props.value.length} characters`);
      }
    }, [isDocumentTooLarge, editorState.useFallback, props.value.length, onFallbackActivated]);

    // Cleanup timeouts on unmount
    useEffect(() => {
      return () => {
        if (performanceTimeoutRef.current) {
          clearTimeout(performanceTimeoutRef.current);
        }
      };
    }, []);

    // Handle markdown parsing errors
    const handleMarkdownError = useCallback((text: string): string => {
      try {
        // Basic validation of markdown syntax
        if (text.includes('```') && (text.match(/```/g) || []).length % 2 !== 0) {
          console.warn('RobustMarkdownEditor: Unclosed code block detected');
        }
        
        // Check for extremely nested structures that might cause issues
        const maxNesting = 10;
        const nestingLevel = (text.match(/>/g) || []).length;
        if (nestingLevel > maxNesting) {
          console.warn('RobustMarkdownEditor: Deep nesting detected, may cause performance issues');
        }
        
        return text;
      } catch (error) {
        console.error('RobustMarkdownEditor: Markdown parsing error', error);
        return text; // Return original text if parsing fails
      }
    }, []);

    // Enhanced onChangeText with error handling
    const handleChangeText = useCallback((text: string) => {
      try {
        const processedText = handleMarkdownError(text);
        props.onChangeText(processedText);
      } catch (error) {
        console.error('RobustMarkdownEditor: Text change error', error);
        // Still try to update with original text
        props.onChangeText(text);
      }
    }, [props.onChangeText, handleMarkdownError]);

    // Render the appropriate editor
    const renderEditor = () => {
      if (editorState.useFallback) {
        return (
          <FallbackEditor
            ref={fallbackRef}
            {...props}
            onChangeText={handleChangeText}
            testID={`${props.testID || 'markdown-editor'}-fallback`}
          />
        );
      }

      return (
        <MarkdownEditor
          ref={editorRef}
          {...props}
          onChangeText={handleChangeText}
          onPerformanceWarning={handlePerformanceWarning}
          testID={`${props.testID || 'markdown-editor'}-main`}
        />
      );
    };

    return (
      <View style={[styles.container, props.style]}>
        <ErrorBoundary
          onError={handleError}
          onRetry={handleRetry}
          fallback={
            <FallbackEditor
              ref={fallbackRef}
              {...props}
              onChangeText={handleChangeText}
              testID={`${props.testID || 'markdown-editor'}-error-fallback`}
            />
          }
        >
          {renderEditor()}
        </ErrorBoundary>
      </View>
    );
  }
);

RobustMarkdownEditor.displayName = 'RobustMarkdownEditor';

// Helper function to categorize errors
function categorizeError(error: Error): 'library' | 'performance' | 'memory' | 'unknown' {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';

  // Library-related errors
  if (
    message.includes('react-native-markdown') ||
    message.includes('markdown-display') ||
    stack.includes('markdowneditor') ||
    message.includes('native module') ||
    message.includes('bridge')
  ) {
    return 'library';
  }

  // Performance-related errors
  if (
    message.includes('timeout') ||
    message.includes('slow') ||
    message.includes('render') ||
    message.includes('frame') ||
    stack.includes('performanceoptimizer')
  ) {
    return 'performance';
  }

  // Memory-related errors
  if (
    message.includes('memory') ||
    message.includes('heap') ||
    message.includes('allocation') ||
    message.includes('out of memory')
  ) {
    return 'memory';
  }

  return 'unknown';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});