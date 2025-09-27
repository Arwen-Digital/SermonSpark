import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';
import { FormattingToolbar, FormatType, KEYBOARD_SHORTCUTS } from '../FormattingToolbar';
import { MobileFloatingToolbar } from '../MobileFloatingToolbar';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

describe('Enhanced FormattingToolbar', () => {
  const mockOnFormatPress = jest.fn();
  const mockOnViewModeToggle = jest.fn();
  const mockOnBibleVersePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('renders all formatting buttons', () => {
      const { getByLabelText } = render(
        <FormattingToolbar
          onFormatPress={mockOnFormatPress}
          hasSelection={false}
          viewMode="markup"
          onViewModeToggle={mockOnViewModeToggle}
          onBibleVersePress={mockOnBibleVersePress}
        />
      );

      expect(getByLabelText(/Bold/)).toBeTruthy();
      expect(getByLabelText(/Italic/)).toBeTruthy();
      expect(getByLabelText(/Strikethrough/)).toBeTruthy();
      expect(getByLabelText(/Code/)).toBeTruthy();
      expect(getByLabelText(/Heading 2/)).toBeTruthy();
      expect(getByLabelText(/Heading 3/)).toBeTruthy();
      expect(getByLabelText(/Bullet List/)).toBeTruthy();
      expect(getByLabelText(/Numbered List/)).toBeTruthy();
      expect(getByLabelText(/Quote/)).toBeTruthy();
      expect(getByLabelText(/Highlight/)).toBeTruthy();
      expect(getByLabelText(/Link/)).toBeTruthy();
    });

    it('calls onFormatPress with correct format type', () => {
      const { getByLabelText } = render(
        <FormattingToolbar
          onFormatPress={mockOnFormatPress}
          hasSelection={true}
          viewMode="markup"
          onViewModeToggle={mockOnViewModeToggle}
          onBibleVersePress={mockOnBibleVersePress}
        />
      );

      fireEvent.press(getByLabelText(/Bold/));
      expect(mockOnFormatPress).toHaveBeenCalledWith('bold');

      fireEvent.press(getByLabelText(/Italic/));
      expect(mockOnFormatPress).toHaveBeenCalledWith('italic');

      fireEvent.press(getByLabelText(/Strikethrough/));
      expect(mockOnFormatPress).toHaveBeenCalledWith('strikethrough');
    });

    it('shows keyboard shortcuts on web platform', () => {
      Platform.OS = 'web';
      
      const { getByLabelText } = render(
        <FormattingToolbar
          onFormatPress={mockOnFormatPress}
          hasSelection={false}
          viewMode="markup"
          onViewModeToggle={mockOnViewModeToggle}
          onBibleVersePress={mockOnBibleVersePress}
          showKeyboardShortcuts={true}
        />
      );

      expect(getByLabelText(/Bold.*⌘B/)).toBeTruthy();
      expect(getByLabelText(/Italic.*⌘I/)).toBeTruthy();
    });
  });

  describe('Visual Feedback', () => {
    it('provides visual feedback when button is pressed', async () => {
      const { getByLabelText } = render(
        <FormattingToolbar
          onFormatPress={mockOnFormatPress}
          hasSelection={true}
          viewMode="markup"
          onViewModeToggle={mockOnViewModeToggle}
          onBibleVersePress={mockOnBibleVersePress}
        />
      );

      const boldButton = getByLabelText(/Bold/);
      fireEvent.press(boldButton);

      // Visual feedback should be applied temporarily
      await waitFor(() => {
        expect(mockOnFormatPress).toHaveBeenCalledWith('bold');
      });
    });

    it('applies haptic feedback on mobile platforms', async () => {
      Platform.OS = 'ios';
      const { impactAsync } = require('expo-haptics');
      
      const { getByLabelText } = render(
        <FormattingToolbar
          onFormatPress={mockOnFormatPress}
          hasSelection={true}
          viewMode="markup"
          onViewModeToggle={mockOnViewModeToggle}
          onBibleVersePress={mockOnBibleVersePress}
          enableHapticFeedback={true}
        />
      );

      fireEvent.press(getByLabelText(/Bold/));

      await waitFor(() => {
        expect(impactAsync).toHaveBeenCalled();
      });
    });
  });

  describe('Compact Mode', () => {
    it('applies compact styling when compactMode is enabled', () => {
      const { getByLabelText } = render(
        <FormattingToolbar
          onFormatPress={mockOnFormatPress}
          hasSelection={false}
          viewMode="markup"
          onViewModeToggle={mockOnViewModeToggle}
          onBibleVersePress={mockOnBibleVersePress}
          compactMode={true}
        />
      );

      const boldButton = getByLabelText(/Bold/);
      expect(boldButton).toBeTruthy();
      // Compact mode styling should be applied
    });
  });

  describe('Accessibility', () => {
    it('provides proper accessibility labels and hints', () => {
      const { getByLabelText } = render(
        <FormattingToolbar
          onFormatPress={mockOnFormatPress}
          hasSelection={true}
          viewMode="markup"
          onViewModeToggle={mockOnViewModeToggle}
          onBibleVersePress={mockOnBibleVersePress}
        />
      );

      const boldButton = getByLabelText(/Bold/);
      expect(boldButton.props.accessibilityHint).toBe('Apply bold formatting to selected text');

      const headingButton = getByLabelText(/Heading 2/);
      expect(headingButton.props.accessibilityHint).toBe('Format line as heading 2');
    });
  });
});

describe('Enhanced MobileFloatingToolbar', () => {
  const mockOnFormatPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility and Animation', () => {
    it('renders when visible is true', () => {
      const { getByText } = render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={false}
        />
      );

      expect(getByText('Quick Format')).toBeTruthy();
    });

    it('does not render when visible is false', () => {
      const { queryByText } = render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={false}
          hasSelection={false}
        />
      );

      expect(queryByText('Quick Format')).toBeNull();
    });

    it('shows selection info when text is selected', () => {
      const { getByText } = render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
          selectionLength={25}
        />
      );

      expect(getByText('Format Selection (25 chars)')).toBeTruthy();
    });
  });

  describe('Button Rendering', () => {
    it('renders basic buttons when no selection', () => {
      const { getByLabelText } = render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={false}
        />
      );

      expect(getByLabelText('bold formatting')).toBeTruthy();
      expect(getByLabelText('italic formatting')).toBeTruthy();
      expect(getByLabelText('highlight formatting')).toBeTruthy();
    });

    it('renders extended buttons when text is selected', () => {
      const { getByLabelText } = render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
        />
      );

      expect(getByLabelText('bold formatting')).toBeTruthy();
      expect(getByLabelText('italic formatting')).toBeTruthy();
      expect(getByLabelText('strikethrough formatting')).toBeTruthy();
      expect(getByLabelText('code formatting')).toBeTruthy();
      expect(getByLabelText('link formatting')).toBeTruthy();
    });

    it('renders compact buttons on small screens', () => {
      // Mock small screen width
      jest.spyOn(require('react-native'), 'Dimensions').mockReturnValue({
        get: () => ({ width: 320, height: 568 }),
        addEventListener: jest.fn(),
      });

      const { getByLabelText } = render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
          compactMode={true}
        />
      );

      expect(getByLabelText('bold formatting')).toBeTruthy();
      expect(getByLabelText('italic formatting')).toBeTruthy();
      expect(getByLabelText('highlight formatting')).toBeTruthy();
    });
  });

  describe('Touch Interactions', () => {
    it('calls onFormatPress with correct format type', () => {
      const { getByLabelText } = render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
        />
      );

      fireEvent.press(getByLabelText('bold formatting'));
      expect(mockOnFormatPress).toHaveBeenCalledWith('bold');

      fireEvent.press(getByLabelText('italic formatting'));
      expect(mockOnFormatPress).toHaveBeenCalledWith('italic');
    });

    it('provides haptic feedback on button press', async () => {
      Platform.OS = 'ios';
      const { impactAsync } = require('expo-haptics');
      
      const { getByLabelText } = render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
          enableHapticFeedback={true}
        />
      );

      fireEvent.press(getByLabelText('bold formatting'));

      await waitFor(() => {
        expect(impactAsync).toHaveBeenCalled();
      });
    });

    it('handles screen rotation and dimension changes', () => {
      const mockAddEventListener = jest.fn();
      const mockRemove = jest.fn();
      
      jest.spyOn(require('react-native'), 'Dimensions').mockReturnValue({
        get: () => ({ width: 768, height: 1024 }),
        addEventListener: mockAddEventListener.mockReturnValue({ remove: mockRemove }),
      });

      const { unmount } = render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={false}
        />
      );

      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));

      unmount();
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('provides proper accessibility labels for all buttons', () => {
      const { getByLabelText } = render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
        />
      );

      const boldButton = getByLabelText('bold formatting');
      expect(boldButton.props.accessibilityRole).toBe('button');
      expect(boldButton.props.accessibilityHint).toBe('Apply bold formatting to selected text');
    });
  });
});

describe('Keyboard Shortcuts Integration', () => {
  it('exports correct keyboard shortcuts for different platforms', () => {
    Platform.OS = 'web';
    expect(KEYBOARD_SHORTCUTS.bold).toBe('⌘B');
    expect(KEYBOARD_SHORTCUTS.italic).toBe('⌘I');
    expect(KEYBOARD_SHORTCUTS.heading2).toBe('⌘⇧2');

    Platform.OS = 'android';
    const { KEYBOARD_SHORTCUTS: androidShortcuts } = require('../FormattingToolbar');
    expect(androidShortcuts.bold).toBe('Ctrl+B');
    expect(androidShortcuts.italic).toBe('Ctrl+I');
  });

  it('includes shortcuts for all format types', () => {
    const formatTypes: FormatType[] = [
      'bold', 'italic', 'heading2', 'heading3', 'list', 'numberedList', 
      'quote', 'highlight', 'strikethrough', 'code', 'link'
    ];

    formatTypes.forEach(format => {
      expect(KEYBOARD_SHORTCUTS[format]).toBeDefined();
      expect(typeof KEYBOARD_SHORTCUTS[format]).toBe('string');
    });
  });
});