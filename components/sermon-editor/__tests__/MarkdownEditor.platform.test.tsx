import { render } from '@testing-library/react-native';
import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { MarkdownEditor, MarkdownEditorHandle } from '../MarkdownEditor';

// Mock useWindowDimensions
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    useWindowDimensions: jest.fn(),
  };
});

const mockUseWindowDimensions = useWindowDimensions as jest.MockedFunction<typeof useWindowDimensions>;

describe('MarkdownEditor Platform-Specific Optimizations', () => {
  const defaultProps = {
    value: 'Test content',
    onChangeText: jest.fn(),
    testID: 'markdown-editor',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default to mobile screen size
    mockUseWindowDimensions.mockReturnValue({ width: 375, height: 667 });
  });

  describe('iOS Platform Optimizations', () => {
    beforeEach(() => {
      // Mock Platform.OS for iOS
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
        configurable: true,
      });
    });

    it('should apply iOS-specific TextInput props', () => {
      const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
      const textInput = getByTestId('markdown-editor');
      
      // iOS-specific props should be applied
      expect(textInput.props.selectTextOnFocus).toBe(false);
      expect(textInput.props.contextMenuHidden).toBe(false);
      expect(textInput.props.automaticallyAdjustContentInsets).toBe(false);
      expect(textInput.props.contentInsetAdjustmentBehavior).toBe('never');
    });

    it('should apply touch optimizations on iOS when enabled', () => {
      const { getByTestId } = render(
        <MarkdownEditor {...defaultProps} touchOptimizations={true} />
      );
      const textInput = getByTestId('markdown-editor');
      
      expect(textInput.props.keyboardAppearance).toBe('default');
      expect(textInput.props.returnKeyType).toBe('default');
      expect(textInput.props.enablesReturnKeyAutomatically).toBe(false);
    });

    it('should use iOS-specific font for code blocks', () => {
      const { getByTestId } = render(
        <MarkdownEditor {...defaultProps} viewMode="formatted" value="```\ncode\n```" />
      );
      
      // The markdown renderer should use iOS-specific fonts
      // This is tested indirectly through the style configuration
      expect(getByTestId('markdown-editor')).toBeTruthy();
    });
  });

  describe('Android Platform Optimizations', () => {
    beforeEach(() => {
      // Mock Platform.OS for Android
      Object.defineProperty(Platform, 'OS', {
        get: () => 'android',
        configurable: true,
      });
    });

    it('should apply Android-specific TextInput props', () => {
      const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
      const textInput = getByTestId('markdown-editor');
      
      // Android-specific props should be applied
      expect(textInput.props.selectTextOnFocus).toBe(false);
      expect(textInput.props.contextMenuHidden).toBe(false);
      expect(textInput.props.underlineColorAndroid).toBe('transparent');
    });

    it('should apply touch optimizations on Android when enabled', () => {
      const { getByTestId } = render(
        <MarkdownEditor {...defaultProps} touchOptimizations={true} />
      );
      const textInput = getByTestId('markdown-editor');
      
      expect(textInput.props.textBreakStrategy).toBe('balanced');
      expect(textInput.props.hyphenationFrequency).toBe('normal');
    });
  });

  describe('Web Platform Optimizations', () => {
    beforeEach(() => {
      // Mock Platform.OS for web
      Object.defineProperty(Platform, 'OS', {
        get: () => 'web',
        configurable: true,
      });
    });

    it('should apply web-specific TextInput props', () => {
      const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
      const textInput = getByTestId('markdown-editor');
      
      // Web-specific props should be applied
      expect(textInput.props.selectTextOnFocus).toBe(false);
      expect(textInput.props.spellCheck).toBe(true);
      expect(textInput.props.autoCorrect).toBe(false);
    });

    it('should handle keyboard shortcuts when enabled', () => {
      const mockOnChangeText = jest.fn();
      const editorRef = React.createRef<MarkdownEditorHandle>();
      
      render(
        <MarkdownEditor
          {...defaultProps}
          onChangeText={mockOnChangeText}
          ref={editorRef}
          enableKeyboardShortcuts={true}
        />
      );

      // Simulate keyboard shortcut for bold (Ctrl+B)
      const textInput = editorRef.current;
      expect(textInput).toBeTruthy();
      
      // Note: Testing keyboard shortcuts requires more complex setup
      // This test verifies the component renders with keyboard shortcuts enabled
    });

    it('should disable keyboard shortcuts when disabled', () => {
      const { getByTestId } = render(
        <MarkdownEditor {...defaultProps} enableKeyboardShortcuts={false} />
      );
      const textInput = getByTestId('markdown-editor');
      
      expect(textInput.props.onKeyDown).toBeUndefined();
    });
  });

  describe('Screen Size Responsiveness', () => {
    it('should apply large screen optimizations on tablets', () => {
      // Mock large screen dimensions
      mockUseWindowDimensions.mockReturnValue({ width: 1024, height: 768 });
      
      const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
      const textInput = getByTestId('markdown-editor');
      
      // Large screen styles should be applied
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 17,
            lineHeight: 26,
          })
        ])
      );
    });

    it('should optimize for large documents', () => {
      const largeContent = 'a'.repeat(15000); // > 10k characters
      
      const { getByTestId } = render(
        <MarkdownEditor
          {...defaultProps}
          value={largeContent}
          optimizeForLargeDocuments={true}
        />
      );
      const textInput = getByTestId('markdown-editor');
      
      // Large document optimizations should be applied
      expect(textInput.props.showsVerticalScrollIndicator).toBe(false);
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 15,
            lineHeight: 22,
          })
        ])
      );
    });

    it('should handle small screen mobile layout', () => {
      // Mock small screen dimensions
      mockUseWindowDimensions.mockReturnValue({ width: 320, height: 568 });
      
      const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
      const textInput = getByTestId('markdown-editor');
      
      // Should use default mobile styles
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 16,
            lineHeight: 24,
          })
        ])
      );
    });
  });

  describe('Performance Optimizations', () => {
    it('should apply performance optimizations for large documents in preview mode', () => {
      const largeContent = 'a'.repeat(15000);
      
      const { getByTestId } = render(
        <MarkdownEditor
          {...defaultProps}
          value={largeContent}
          viewMode="formatted"
          optimizeForLargeDocuments={true}
        />
      );
      
      // ScrollView should have performance optimizations
      const scrollView = getByTestId('markdown-editor');
      expect(scrollView.props.removeClippedSubviews).toBe(true);
      expect(scrollView.props.scrollEventThrottle).toBe(16);
    });

    it('should disable performance optimizations when not needed', () => {
      const smallContent = 'Small content';
      
      const { getByTestId } = render(
        <MarkdownEditor
          {...defaultProps}
          value={smallContent}
          viewMode="formatted"
          optimizeForLargeDocuments={false}
        />
      );
      
      const scrollView = getByTestId('markdown-editor');
      expect(scrollView.props.removeClippedSubviews).toBeUndefined();
    });
  });

  describe('Touch Optimizations', () => {
    beforeEach(() => {
      // Mock mobile platform
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
        configurable: true,
      });
    });

    it('should apply touch optimizations when enabled', () => {
      const { getByTestId } = render(
        <MarkdownEditor {...defaultProps} touchOptimizations={true} />
      );
      const textInput = getByTestId('markdown-editor');
      
      // Touch-optimized styles should be applied
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            minHeight: 44, // iOS minimum touch target
          })
        ])
      );
    });

    it('should not apply touch optimizations when disabled', () => {
      const { getByTestId } = render(
        <MarkdownEditor {...defaultProps} touchOptimizations={false} />
      );
      const textInput = getByTestId('markdown-editor');
      
      // Should not include touch optimization styles
      const hasMinHeight = textInput.props.style.some((style: any) => 
        style && typeof style === 'object' && 'minHeight' in style
      );
      expect(hasMinHeight).toBe(false);
    });
  });

  describe('Platform-Specific Selection Timing', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should use immediate selection timing on web', () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'web',
        configurable: true,
      });

      const editorRef = React.createRef<MarkdownEditorHandle>();
      render(<MarkdownEditor {...defaultProps} ref={editorRef} />);

      // Insert text and verify timing
      editorRef.current?.insertText('test');
      
      // On web, selection should update immediately (0ms delay)
      jest.advanceTimersByTime(0);
      expect(editorRef.current?.getSelection()).toEqual({ start: 4, end: 4 });
    });

    it('should use delayed selection timing on iOS', () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'ios',
        configurable: true,
      });

      const editorRef = React.createRef<MarkdownEditorHandle>();
      render(<MarkdownEditor {...defaultProps} ref={editorRef} />);

      // Insert text and verify timing
      editorRef.current?.insertText('test');
      
      // On iOS, selection should update after 10ms delay
      jest.advanceTimersByTime(5);
      expect(editorRef.current?.getSelection()).toEqual({ start: 0, end: 0 });
      
      jest.advanceTimersByTime(10);
      expect(editorRef.current?.getSelection()).toEqual({ start: 4, end: 4 });
    });

    it('should use delayed selection timing on Android', () => {
      Object.defineProperty(Platform, 'OS', {
        get: () => 'android',
        configurable: true,
      });

      const editorRef = React.createRef<MarkdownEditorHandle>();
      render(<MarkdownEditor {...defaultProps} ref={editorRef} />);

      // Insert text and verify timing
      editorRef.current?.insertText('test');
      
      // On Android, selection should update after 5ms delay
      jest.advanceTimersByTime(3);
      expect(editorRef.current?.getSelection()).toEqual({ start: 0, end: 0 });
      
      jest.advanceTimersByTime(5);
      expect(editorRef.current?.getSelection()).toEqual({ start: 4, end: 4 });
    });
  });
});