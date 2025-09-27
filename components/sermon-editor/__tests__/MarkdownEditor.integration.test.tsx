import { render } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';
import { MarkdownEditor } from '../MarkdownEditor';

// Simple integration test to verify platform-specific optimizations work
describe('MarkdownEditor Platform Integration', () => {
  const defaultProps = {
    value: 'Test content',
    onChangeText: jest.fn(),
    testID: 'markdown-editor',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing on iOS', () => {
    // Mock Platform.OS for iOS
    Object.defineProperty(Platform, 'OS', {
      get: () => 'ios',
      configurable: true,
    });

    const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
    expect(getByTestId('markdown-editor')).toBeTruthy();
  });

  it('should render without crashing on Android', () => {
    // Mock Platform.OS for Android
    Object.defineProperty(Platform, 'OS', {
      get: () => 'android',
      configurable: true,
    });

    const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
    expect(getByTestId('markdown-editor')).toBeTruthy();
  });

  it('should render without crashing on Web', () => {
    // Mock Platform.OS for Web
    Object.defineProperty(Platform, 'OS', {
      get: () => 'web',
      configurable: true,
    });

    const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
    expect(getByTestId('markdown-editor')).toBeTruthy();
  });

  it('should render in preview mode without crashing', () => {
    const { getByTestId } = render(
      <MarkdownEditor {...defaultProps} viewMode="formatted" />
    );
    expect(getByTestId('markdown-editor')).toBeTruthy();
  });

  it('should handle platform-specific props without crashing', () => {
    const { getByTestId } = render(
      <MarkdownEditor
        {...defaultProps}
        enableKeyboardShortcuts={true}
        optimizeForLargeDocuments={true}
        touchOptimizations={true}
      />
    );
    expect(getByTestId('markdown-editor')).toBeTruthy();
  });
});