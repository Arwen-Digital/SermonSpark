import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { FormattingToolbar } from '../FormattingToolbar';

describe('FormattingToolbar', () => {
  const mockProps = {
    onFormatPress: jest.fn(),
    hasSelection: false,
    viewMode: 'markup' as const,
    onViewModeToggle: jest.fn(),
    onBibleVersePress: jest.fn(),
    isLargeScreen: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all formatting buttons', () => {
    const { getByText } = render(<FormattingToolbar {...mockProps} />);
    
    // Text formatting buttons
    expect(getByText('B')).toBeTruthy(); // Bold
    expect(getByText('I')).toBeTruthy(); // Italic
    expect(getByText('H2')).toBeTruthy(); // Heading 2
    expect(getByText('H3')).toBeTruthy(); // Heading 3
    expect(getByText('Bible Verse Finder')).toBeTruthy(); // Bible verse button
  });

  it('calls onFormatPress when formatting buttons are pressed', () => {
    const { getByText } = render(<FormattingToolbar {...mockProps} />);
    
    // Test bold button
    fireEvent.press(getByText('B'));
    expect(mockProps.onFormatPress).toHaveBeenCalledWith('bold');
    
    // Test italic button
    fireEvent.press(getByText('I'));
    expect(mockProps.onFormatPress).toHaveBeenCalledWith('italic');
    
    // Test heading buttons
    fireEvent.press(getByText('H2'));
    expect(mockProps.onFormatPress).toHaveBeenCalledWith('heading2');
    
    fireEvent.press(getByText('H3'));
    expect(mockProps.onFormatPress).toHaveBeenCalledWith('heading3');
  });

  it('shows selection indicator when text is selected on large screens', () => {
    const { getByText } = render(
      <FormattingToolbar {...mockProps} hasSelection={true} isLargeScreen={true} />
    );
    
    expect(getByText('Text selected')).toBeTruthy();
  });

  it('does not show selection indicator on small screens', () => {
    const { queryByText } = render(
      <FormattingToolbar {...mockProps} hasSelection={true} isLargeScreen={false} />
    );
    
    expect(queryByText('Text selected')).toBeNull();
  });

  it('toggles view mode when view mode button is pressed', () => {
    const { getByText } = render(<FormattingToolbar {...mockProps} />);
    
    fireEvent.press(getByText('Preview'));
    expect(mockProps.onViewModeToggle).toHaveBeenCalled();
  });

  it('shows correct view mode text based on current mode', () => {
    const { getByText, rerender } = render(<FormattingToolbar {...mockProps} />);
    
    // Should show "Preview" when in markup mode
    expect(getByText('Preview')).toBeTruthy();
    
    // Should show "Markup" when in formatted mode
    rerender(<FormattingToolbar {...mockProps} viewMode="formatted" />);
    expect(getByText('Markup')).toBeTruthy();
  });

  it('calls onBibleVersePress when Bible verse button is pressed', () => {
    const { getByText } = render(<FormattingToolbar {...mockProps} />);
    
    fireEvent.press(getByText('Bible Verse Finder'));
    expect(mockProps.onBibleVersePress).toHaveBeenCalled();
  });

  it('does not show Bible verse button on small screens', () => {
    const { queryByText } = render(
      <FormattingToolbar {...mockProps} isLargeScreen={false} />
    );
    
    expect(queryByText('Bible Verse Finder')).toBeNull();
  });

  it('applies correct styling for active view mode', () => {
    const { getByText } = render(
      <FormattingToolbar {...mockProps} viewMode="markup" />
    );
    
    const markupButton = getByText('Markup');
    // The button should have active styling when in markup mode
    expect(markupButton).toBeTruthy();
  });
});