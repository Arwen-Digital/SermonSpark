import { theme } from '@/constants/Theme';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorType: 'library' | 'performance' | 'memory' | 'unknown';
  retryCount: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Analyze error to determine type
    const errorType = ErrorBoundary.categorizeError(error);
    
    return {
      hasError: true,
      error,
      errorType,
    };
  }

  private static categorizeError(error: Error): 'library' | 'performance' | 'memory' | 'unknown' {
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error details for debugging
    console.error('MarkdownEditor Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
      
      // Call optional retry handler
      this.props.onRetry?.();
    }
  };

  private getErrorMessage(): string {
    const { errorType, error } = this.state;
    
    switch (errorType) {
      case 'library':
        return 'The markdown editor encountered a compatibility issue. Using fallback editor.';
      case 'performance':
        return 'The editor is experiencing performance issues. Switching to optimized mode.';
      case 'memory':
        return 'The document is too large for optimal editing. Using simplified editor.';
      default:
        return `An unexpected error occurred: ${error?.message || 'Unknown error'}`;
    }
  }

  private getRecoveryAction(): string {
    const { errorType, retryCount } = this.state;
    
    if (retryCount < this.maxRetries) {
      switch (errorType) {
        case 'library':
          return 'Retry with fallback editor';
        case 'performance':
          return 'Retry with performance optimizations';
        case 'memory':
          return 'Retry with memory optimizations';
        default:
          return 'Try again';
      }
    }
    
    return 'Using fallback editor';
  }

  render() {
    const { hasError, retryCount } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // If we have a custom fallback, use it
      if (fallback) {
        return fallback;
      }

      // If we've exceeded retry attempts, show permanent fallback message
      if (retryCount >= this.maxRetries) {
        return (
          <View style={styles.errorContainer}>
            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>Editor Unavailable</Text>
              <Text style={styles.errorMessage}>
                The advanced editor is temporarily unavailable. Please use the basic text editor below.
              </Text>
            </View>
          </View>
        );
      }

      // Show error with retry option
      return (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>Editor Error</Text>
            <Text style={styles.errorMessage}>{this.getErrorMessage()}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
              <Text style={styles.retryButtonText}>{this.getRecoveryAction()}</Text>
            </TouchableOpacity>
            <Text style={styles.retryCount}>
              Attempt {retryCount + 1} of {this.maxRetries}
            </Text>
          </View>
        </View>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  errorContent: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.error,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
  },
  retryButtonText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  retryCount: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
});