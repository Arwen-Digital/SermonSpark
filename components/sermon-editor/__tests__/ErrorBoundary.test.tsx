import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock component that throws errors
const ThrowError = ({ shouldThrow, errorType }: { shouldThrow: boolean; errorType?: string }) => {
  if (shouldThrow) {
    const error = new Error(errorType || 'Test error');
    if (errorType === 'library') {
      error.message = 'react-native-markdown-editor failed to load';
    } else if (errorType === 'performance') {
      error.message = 'Render timeout exceeded';
    } else if (errorType === 'memory') {
      error.message = 'Out of memory allocation failed';
    }
    throw error;
  }
  return <Text>Working component</Text>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByText('Working component')).toBeTruthy();
  });

  it('catches and displays library errors', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorType="library" />
      </ErrorBoundary>
    );

    expect(getByText('Editor Error')).toBeTruthy();
    expect(getByText(/compatibility issue/)).toBeTruthy();
    expect(getByText('Retry with fallback editor')).toBeTruthy();
  });

  it('catches and displays performance errors', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorType="performance" />
      </ErrorBoundary>
    );

    expect(getByText('Editor Error')).toBeTruthy();
    expect(getByText(/performance issues/)).toBeTruthy();
    expect(getByText('Retry with performance optimizations')).toBeTruthy();
  });

  it('catches and displays memory errors', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorType="memory" />
      </ErrorBoundary>
    );

    expect(getByText('Editor Error')).toBeTruthy();
    expect(getByText(/too large/)).toBeTruthy();
    expect(getByText('Retry with memory optimizations')).toBeTruthy();
  });

  it('handles retry functionality', async () => {
    let shouldThrow = true;
    const TestComponent = () => <ThrowError shouldThrow={shouldThrow} />;

    const { getByText, rerender } = render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    // Should show error initially
    expect(getByText('Editor Error')).toBeTruthy();

    // Simulate fixing the error
    shouldThrow = false;

    // Click retry button
    fireEvent.press(getByText(/Try again/));

    // Re-render with fixed component
    rerender(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(getByText('Working component')).toBeTruthy();
    });
  });

  it('shows permanent fallback after max retries', () => {
    const { getByText, rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // First error
    expect(getByText('Attempt 1 of 3')).toBeTruthy();

    // Retry 3 times
    for (let i = 0; i < 3; i++) {
      fireEvent.press(getByText(/Try again/));
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
    }

    // Should show permanent fallback
    expect(getByText('Editor Unavailable')).toBeTruthy();
    expect(getByText(/temporarily unavailable/)).toBeTruthy();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('calls onRetry callback when retry is pressed', () => {
    const onRetry = jest.fn();
    
    const { getByText } = render(
      <ErrorBoundary onRetry={onRetry}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.press(getByText(/Try again/));
    expect(onRetry).toHaveBeenCalled();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <Text>Custom fallback component</Text>;
    
    const { getByText } = render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Custom fallback component')).toBeTruthy();
  });

  it('categorizes unknown errors correctly', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} errorType="unknown" />
      </ErrorBoundary>
    );

    expect(getByText('Editor Error')).toBeTruthy();
    expect(getByText(/unexpected error occurred/)).toBeTruthy();
  });

  it('handles errors with no message', () => {
    const ThrowEmptyError = () => {
      const error = new Error();
      error.message = '';
      throw error;
    };

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowEmptyError />
      </ErrorBoundary>
    );

    expect(getByText(/Unknown error/)).toBeTruthy();
  });
});