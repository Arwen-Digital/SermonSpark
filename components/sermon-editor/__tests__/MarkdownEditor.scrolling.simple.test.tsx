import { render } from '@testing-library/react-native';
import React from 'react';
import { MarkdownEditor } from '../MarkdownEditor';

describe('MarkdownEditor - Scrolling Optimizations', () => {
  it('should have optimized scrolling properties for TextInput', () => {
    const { getByTestId } = render(
      <MarkdownEditor
        value="Test content"
        onChangeText={jest.fn()}
        testID="markdown-editor"
      />
    );

    const textInput = getByTestId('markdown-editor');
    
    // Verify scrolling is enabled
    expect(textInput.props.scrollEnabled).toBe(true);
    
    // Verify keyboard handling
    expect(textInput.props.keyboardShouldPersistTaps).toBe('handled');
    expect(textInput.props.blurOnSubmit).toBe(false);
    
    // Verify scroll indicators
    expect(textInput.props.showsVerticalScrollIndicator).toBe(true);
  });

  it('should have optimized ScrollView properties for preview mode', () => {
    const { getByTestId } = render(
      <MarkdownEditor
        value="# Test\nContent"
        onChangeText={jest.fn()}
        viewMode="formatted"
        testID="markdown-editor"
      />
    );

    const scrollView = getByTestId('markdown-editor');
    
    // Verify performance optimizations
    expect(scrollView.props.removeClippedSubviews).toBe(true);
    expect(scrollView.props.maxToRenderPerBatch).toBe(10);
    expect(scrollView.props.windowSize).toBe(10);
    expect(scrollView.props.keyboardShouldPersistTaps).toBe('handled');
  });

  it('should not have minHeight constraints that interfere with scrolling', () => {
    const { getByTestId } = render(
      <MarkdownEditor
        value="Short content"
        onChangeText={jest.fn()}
        testID="markdown-editor"
      />
    );

    const textInput = getByTestId('markdown-editor');
    
    // Verify no fixed minHeight that could interfere with natural scrolling
    expect(textInput.props.style.minHeight).toBeUndefined();
  });

  it('should handle large content without performance issues', () => {
    const largeContent = 'Lorem ipsum dolor sit amet. '.repeat(1000);
    
    const { getByTestId } = render(
      <MarkdownEditor
        value={largeContent}
        onChangeText={jest.fn()}
        testID="markdown-editor"
      />
    );

    const textInput = getByTestId('markdown-editor');
    
    // Should render without issues
    expect(textInput).toBeTruthy();
    expect(textInput.props.value).toBe(largeContent);
  });
});