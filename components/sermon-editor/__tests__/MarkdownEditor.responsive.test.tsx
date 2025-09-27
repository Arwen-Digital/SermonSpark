import { render } from '@testing-library/react-native';
import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { MarkdownEditor } from '../MarkdownEditor';

// Mock useWindowDimensions
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    useWindowDimensions: jest.fn(),
  };
});

const mockUseWindowDimensions = useWindowDimensions as jest.MockedFunction<typeof useWindowDimensions>;

describe('MarkdownEditor Responsive Behavior', () => {
  const defaultProps = {
    value: 'Test content for responsive behavior testing',
    onChangeText: jest.fn(),
    testID: 'markdown-editor',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Platform.OS for iOS by default
    Object.defineProperty(Platform, 'OS', {
      get: () => 'ios',
      configurable: true,
    });
  });

  describe('Mobile Phone Screens', () => {
    it('should optimize for iPhone SE (small screen)', () => {
      mockUseWindowDimensions.mockReturnValue({ width: 320, height: 568 });
      
      const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
      const textInput = getByTestId('markdown-editor');
      
      // Should use mobile-optimized styles
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 16,
            lineHeight: 24,
          })
        ])
      );
      
      // Should show scroll indicators on small screens
      expect(textInput.props.showsVerticalScrollIndicator).toBe(true);
    });

    it('should optimize for iPhone 12/13/14 (standard mobile)', () => {
      mockUseWindowDimensions.mockReturnValue({ width: 390, height: 844 });
      
      const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
      const textInput = getByTestId('markdown-editor');
      
      // Should use mobile-optimized styles
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 16,
            lineHeight: 24,
          })
        ])
      );
    });

    it('should optimize for iPhone 12/13/14 Pro Max (large mobile)', () => {
      mockUseWindowDimensions.mockReturnValue({ width: 428, height: 926 });
      
      const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
      const textInput = getByTestId('markdown-editor');
      
      // Should still use mobile styles (not large screen)
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

  describe('Tablet Screens', () => {
    it('should optimize for iPad Mini (768x1024)', () => {
      mockUseWindowDimensions.mockReturnValue({ width: 768, height: 1024 });
      
      const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
      const textInput = getByTestId('markdown-editor');
      
      // Should use large screen styles
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 17,
            lineHeight: 26,
          })
        ])
      );
    });

    it('should optimize for iPad Air/Pro (834x1194)', () => {
      mockUseWindowDimensions.mockReturnValue({ width: 834, height: 1194 });
      
      const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
      const textInput = getByTestId('markdown-editor');
      
      // Should use large screen styles
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 17,
            lineHeight: 26,
          })
        ])
      );
    });

    it('should optimize for iPad Pro 12.9" (1024x1366)', () => {
      mockUseWindowDimensions.mockReturnValue({ width: 1024, height: 1366 });
      
      const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
      const textInput = getByTestId('markdown-editor');
      
      // Should use large screen styles
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 17,
            lineHeight: 26,
          })
        ])
      );
    });
  });

  describe('Desktop Screens', () => {
    it('should optimize for laptop screens (1366x768)', () => {
      mockUseWindowDimensions.mockReturnValue({ width: 1366, height: 768 });
      
      const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
      const textInput = getByTestId('markdown-editor');
      
      // Should use large screen styles
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 17,
            lineHeight: 26,
          })
        ])
      );
    });

    it('should optimize for desktop screens (1920x1080)', () => {
      mockUseWindowDimensions.mockReturnValue({ width: 1920, height: 1080 });
      
      const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
      const textInput = getByTestId('markdown-editor');
      
      // Should use large screen styles
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 17,
            lineHeight: 26,
          })
        ])
      );
    });
  });

  describe('Orientation Changes', () => {
    it('should handle portrait to landscape transition on mobile', () => {
      // Start in portrait
      mockUseWindowDimensions.mockReturnValue({ width: 390, height: 844 });
      
      const { getByTestId, rerender } = render(<MarkdownEditor {...defaultProps} />);
      let textInput = getByTestId('markdown-editor');
      
      // Should use mobile styles in portrait
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 16,
            lineHeight: 24,
          })
        ])
      );
      
      // Switch to landscape
      mockUseWindowDimensions.mockReturnValue({ width: 844, height: 390 });
      rerender(<MarkdownEditor {...defaultProps} />);
      textInput = getByTestId('markdown-editor');
      
      // Should still use mobile styles (min dimension is 390)
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 16,
            lineHeight: 24,
          })
        ])
      );
    });

    it('should handle portrait to landscape transition on tablet', () => {
      // Start in portrait
      mockUseWindowDimensions.mockReturnValue({ width: 768, height: 1024 });
      
      const { getByTestId, rerender } = render(<MarkdownEditor {...defaultProps} />);
      let textInput = getByTestId('markdown-editor');
      
      // Should use large screen styles in portrait
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 17,
            lineHeight: 26,
          })
        ])
      );
      
      // Switch to landscape
      mockUseWindowDimensions.mockReturnValue({ width: 1024, height: 768 });
      rerender(<MarkdownEditor {...defaultProps} />);
      textInput = getByTestId('markdown-editor');
      
      // Should still use large screen styles (min dimension is 768)
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 17,
            lineHeight: 26,
          })
        ])
      );
    });
  });

  describe('Preview Mode Responsiveness', () => {
    it('should apply large screen preview styles on tablets', () => {
      mockUseWindowDimensions.mockReturnValue({ width: 1024, height: 768 });
      
      const { getByTestId } = render(
        <MarkdownEditor {...defaultProps} viewMode="formatted" />
      );
      const scrollView = getByTestId('markdown-editor');
      
      // Should apply large screen preview content styles
      expect(scrollView.props.contentContainerStyle).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            maxWidth: 800,
            alignSelf: 'center',
          })
        ])
      );
    });

    it('should not apply large screen preview styles on mobile', () => {
      mockUseWindowDimensions.mockReturnValue({ width: 390, height: 844 });
      
      const { getByTestId } = render(
        <MarkdownEditor {...defaultProps} viewMode="formatted" />
      );
      const scrollView = getByTestId('markdown-editor');
      
      // Should not include large screen styles
      const hasMaxWidth = scrollView.props.contentContainerStyle.some((style: any) => 
        style && typeof style === 'object' && 'maxWidth' in style
      );
      expect(hasMaxWidth).toBe(false);
    });
  });

  describe('Large Document Optimizations', () => {
    const largeContent = 'a'.repeat(15000); // > 10k characters

    it('should apply large document optimizations on mobile', () => {
      mockUseWindowDimensions.mockReturnValue({ width: 390, height: 844 });
      
      const { getByTestId } = render(
        <MarkdownEditor
          {...defaultProps}
          value={largeContent}
          optimizeForLargeDocuments={true}
        />
      );
      const textInput = getByTestId('markdown-editor');
      
      // Should apply large document styles even on mobile
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 15,
            lineHeight: 22,
          })
        ])
      );
      
      // Should hide scroll indicators for performance
      expect(textInput.props.showsVerticalScrollIndicator).toBe(false);
    });

    it('should apply large document optimizations on tablets', () => {
      mockUseWindowDimensions.mockReturnValue({ width: 1024, height: 768 });
      
      const { getByTestId } = render(
        <MarkdownEditor
          {...defaultProps}
          value={largeContent}
          optimizeForLargeDocuments={true}
        />
      );
      const textInput = getByTestId('markdown-editor');
      
      // Should combine large screen and large document styles
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 15, // Large document override
            lineHeight: 22, // Large document override
          })
        ])
      );
    });

    it('should apply large document optimizations in preview mode', () => {
      mockUseWindowDimensions.mockReturnValue({ width: 1024, height: 768 });
      
      const { getByTestId } = render(
        <MarkdownEditor
          {...defaultProps}
          value={largeContent}
          viewMode="formatted"
          optimizeForLargeDocuments={true}
        />
      );
      const scrollView = getByTestId('markdown-editor');
      
      // Should apply performance optimizations
      expect(scrollView.props.removeClippedSubviews).toBe(true);
      expect(scrollView.props.scrollEventThrottle).toBe(16);
      expect(scrollView.props.showsVerticalScrollIndicator).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small screens gracefully', () => {
      mockUseWindowDimensions.mockReturnValue({ width: 240, height: 320 });
      
      const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
      const textInput = getByTestId('markdown-editor');
      
      // Should still render with mobile styles
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 16,
            lineHeight: 24,
          })
        ])
      );
    });

    it('should handle very large screens gracefully', () => {
      mockUseWindowDimensions.mockReturnValue({ width: 3840, height: 2160 });
      
      const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
      const textInput = getByTestId('markdown-editor');
      
      // Should use large screen styles
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 17,
            lineHeight: 26,
          })
        ])
      );
    });

    it('should handle square screens', () => {
      mockUseWindowDimensions.mockReturnValue({ width: 800, height: 800 });
      
      const { getByTestId } = render(<MarkdownEditor {...defaultProps} />);
      const textInput = getByTestId('markdown-editor');
      
      // Should use large screen styles (min dimension is 800)
      expect(textInput.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fontSize: 17,
            lineHeight: 26,
          })
        ])
      );
    });
  });
});