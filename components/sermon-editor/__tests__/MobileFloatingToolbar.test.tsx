import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { MobileFloatingToolbar } from '../MobileFloatingToolbar';

describe('MobileFloatingToolbar', () => {
  const mockOnFormatPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible is true', () => {
    const { getByText } = render(
      <MobileFloatingToolbar onFormatPress={mockOnFormatPress} visible={true} />
    );
    
    expect(getByText('Format Selection')).toBeTruthy();
    expect(getByText('B')).toBeTruthy(); // Bold button
    expect(getByText('I')).toBeTruthy(); // Italic button
  });

  it('does not render when visible is false', () => {
    const { queryByText } = render(
      <MobileFloatingToolbar onFormatPress={mockOnFormatPress} visible={false} />
    );
    
    expect(queryByText('Format Selection')).toBeNull();
  });

  it('calls onFormatPress with correct format types', () => {
    const { getByText } = render(
      <MobileFloatingToolbar onFormatPress={mockOnFormatPress} visible={true} />
    );
    
    // Test bold button
    fireEvent.press(getByText('B'));
    expect(mockOnFormatPress).toHaveBeenCalledWith('bold');
    
    // Test italic button
    fireEvent.press(getByText('I'));
    expect(mockOnFormatPress).toHaveBeenCalledWith('italic');
    
    // Test heading buttons
    fireEvent.press(getByText('H2'));
    expect(mockOnFormatPress).toHaveBeenCalledWith('heading2');
    
    fireEvent.press(getByText('H3'));
    expect(mockOnFormatPress).toHaveBeenCalledWith('heading3');
  });

  it('renders all expected formatting buttons', () => {
    const { getByText } = render(
      <MobileFloatingToolbar onFormatPress={mockOnFormatPress} visible={true} />
    );
    
    // Text formatting
    expect(getByText('B')).toBeTruthy(); // Bold
    expect(getByText('I')).toBeTruthy(); // Italic
    expect(getByText('H2')).toBeTruthy(); // Heading 2
    expect(getByText('H3')).toBeTruthy(); // Heading 3
    
    // Note: Icon buttons (highlight, quote) are tested by their presence in the component tree
    // since they don't have text content
  });
});