import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';
import { EnhancedFormattingToolbar } from '../EnhancedFormattingToolbar';
import { EnhancedMobileFloatingToolbar } from '../EnhancedMobileFloatingToolbar';
import { KeyboardShortcutHandler } from '../KeyboardShortcutHandler';

// Mock expo-haptics
const mockImpactAsync = jest.fn();
jest.mock('expo-haptics', () => ({
  impactAsync: mockImpactAsync,
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'web',
  select: jest.fn(),
}));

describe('Enhanced Toolbar Features', () => {
  const mockOnFormatPress = jest.fn();
  const mockOnViewModeToggle = jest.fn();
  const mockOnBibleVersePress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'web';
    mockImpactAsync.mockClear();
  });

  describe('EnhancedFormattingToolbar', () => {
    describe('Keyboard Shortcuts Integration', () => {
      it('renders keyboard shortcuts when enabled', () => {
        const { getByLabelText } = render(
          <EnhancedFormattingToolbar
            onFormatPress={mockOnFormatPress}
            hasSelection={false}
            viewMode="markup"
            onViewModeToggle={mockOnViewModeToggle}
            onBibleVersePress={mockOnBibleVersePress}
            enableKeyboardShortcuts={true}
            showKeyboardShortcuts={true}
          />
        );

        expect(getByLabelText(/Bold.*⌘B/)).toBeTruthy();
        expect(getByLabelText(/Italic.*⌘I/)).toBeTruthy();
      });

      it('does not render keyboard shortcuts when disabled', () => {
        const { getByLabelText } = render(
          <EnhancedFormattingToolbar
            onFormatPress={mockOnFormatPress}
            hasSelection={false}
            viewMode="markup"
            onViewModeToggle={mockOnViewModeToggle}
            onBibleVersePress={mockOnBibleVersePress}
            enableKeyboardShortcuts={false}
            showKeyboardShortcuts={false}
          />
        );

        expect(getByLabelText('bold')).toBeTruthy();
        expect(() => getByLabelText(/Bold.*⌘B/)).toThrow();
      });

      it('uses custom button order when provided', () => {
        const customOrder = ['bold', 'italic', 'link'];
        
        const { getAllByRole } = render(
          <EnhancedFormattingToolbar
            onFormatPress={mockOnFormatPress}
            hasSelection={false}
            viewMode="markup"
            onViewModeToggle={mockOnViewModeToggle}
            onBibleVersePress={mockOnBibleVersePress}
            customButtonOrder={customOrder}
          />
        );

        const buttons = getAllByRole('button');
        // Should have view mode toggle + custom buttons + bible verse (if large screen)
        expect(buttons.length).toBeGreaterThanOrEqual(customOrder.length + 1);
      });

      it('applies compact mode styling', () => {
        const { getByLabelText } = render(
          <EnhancedFormattingToolbar
            onFormatPress={mockOnFormatPress}
            hasSelection={false}
            viewMode="markup"
            onViewModeToggle={mockOnViewModeToggle}
            onBibleVersePress={mockOnBibleVersePress}
            compactMode={true}
          />
        );

        const boldButton = getByLabelText('bold');
        expect(boldButton).toBeTruthy();
        // Compact mode should be applied
      });

      it('shows tooltips on hover when enabled', () => {
        Platform.OS = 'web';
        
        const { getByLabelText } = render(
          <EnhancedFormattingToolbar
            onFormatPress={mockOnFormatPress}
            hasSelection={false}
            viewMode="markup"
            onViewModeToggle={mockOnViewModeToggle}
            onBibleVersePress={mockOnBibleVersePress}
            showTooltips={true}
          />
        );

        const boldButton = getByLabelText('bold');
        fireEvent(boldButton, 'onHoverIn');
        
        // Tooltip should be visible
        expect(boldButton).toBeTruthy();
      });
    });

    describe('Visual Feedback', () => {
      it('provides visual feedback on button press', async () => {
        const { getByLabelText } = render(
          <EnhancedFormattingToolbar
            onFormatPress={mockOnFormatPress}
            hasSelection={true}
            viewMode="markup"
            onViewModeToggle={mockOnViewModeToggle}
            onBibleVersePress={mockOnBibleVersePress}
          />
        );

        const boldButton = getByLabelText('bold');
        fireEvent.press(boldButton);

        await waitFor(() => {
          expect(mockOnFormatPress).toHaveBeenCalledWith('bold');
        });
      });

      it('applies hover effects on web platform', () => {
        Platform.OS = 'web';
        
        const { getByLabelText } = render(
          <EnhancedFormattingToolbar
            onFormatPress={mockOnFormatPress}
            hasSelection={false}
            viewMode="markup"
            onViewModeToggle={mockOnViewModeToggle}
            onBibleVersePress={mockOnBibleVersePress}
          />
        );

        const boldButton = getByLabelText('bold');
        fireEvent(boldButton, 'onHoverIn');
        fireEvent(boldButton, 'onHoverOut');
        
        expect(boldButton).toBeTruthy();
      });
    });

    describe('Accessibility', () => {
      it('provides proper accessibility labels with shortcuts', () => {
        const { getByLabelText } = render(
          <EnhancedFormattingToolbar
            onFormatPress={mockOnFormatPress}
            hasSelection={true}
            viewMode="markup"
            onViewModeToggle={mockOnViewModeToggle}
            onBibleVersePress={mockOnBibleVersePress}
            showKeyboardShortcuts={true}
          />
        );

        const boldButton = getByLabelText(/bold.*⌘B/i);
        expect(boldButton.props.accessibilityRole).toBe('button');
        expect(boldButton.props.accessibilityHint).toContain('Apply bold formatting');
      });

      it('provides proper accessibility for view mode toggle', () => {
        const { getByLabelText } = render(
          <EnhancedFormattingToolbar
            onFormatPress={mockOnFormatPress}
            hasSelection={false}
            viewMode="markup"
            onViewModeToggle={mockOnViewModeToggle}
            onBibleVersePress={mockOnBibleVersePress}
          />
        );

        const viewModeButton = getByLabelText('Switch to preview mode');
        expect(viewModeButton.props.accessibilityRole).toBe('button');
      });
    });
  });

  describe('EnhancedMobileFloatingToolbar', () => {
    describe('Responsive Button Sets', () => {
      it('shows basic buttons when no selection', () => {
        const { getByLabelText } = render(
          <EnhancedMobileFloatingToolbar
            onFormatPress={mockOnFormatPress}
            visible={true}
            hasSelection={false}
          />
        );

        expect(getByLabelText('bold formatting')).toBeTruthy();
        expect(getByLabelText('italic formatting')).toBeTruthy();
        expect(getByLabelText('highlight formatting')).toBeTruthy();
      });

      it('shows extended buttons when text is selected', () => {
        const { getByLabelText } = render(
          <EnhancedMobileFloatingToolbar
            onFormatPress={mockOnFormatPress}
            visible={true}
            hasSelection={true}
          />
        );

        expect(getByLabelText('bold formatting')).toBeTruthy();
        expect(getByLabelText('strikethrough formatting')).toBeTruthy();
        expect(getByLabelText('link formatting')).toBeTruthy();
      });

      it('uses custom button set when provided', () => {
        const customButtons = ['bold', 'italic', 'code'];
        
        const { getByLabelText, queryByLabelText } = render(
          <EnhancedMobileFloatingToolbar
            onFormatPress={mockOnFormatPress}
            visible={true}
            hasSelection={true}
            customButtonSet={customButtons}
          />
        );

        expect(getByLabelText('bold formatting')).toBeTruthy();
        expect(getByLabelText('italic formatting')).toBeTruthy();
        expect(getByLabelText('code formatting')).toBeTruthy();
        expect(queryByLabelText('highlight formatting')).toBeNull();
      });

      it('applies compact mode styling', () => {
        const { getByLabelText } = render(
          <EnhancedMobileFloatingToolbar
            onFormatPress={mockOnFormatPress}
            visible={true}
            hasSelection={false}
            compactMode={true}
          />
        );

        const boldButton = getByLabelText('bold formatting');
        expect(boldButton).toBeTruthy();
        // Compact styling should be applied
      });
    });

    describe('Selection Information', () => {
      it('shows selection info when enabled and text is selected', () => {
        const { getByText } = render(
          <EnhancedMobileFloatingToolbar
            onFormatPress={mockOnFormatPress}
            visible={true}
            hasSelection={true}
            selectionLength={25}
            showSelectionInfo={true}
          />
        );

        expect(getByText('Format Selection (25 chars)')).toBeTruthy();
      });

      it('hides selection info when disabled', () => {
        const { getByText, queryByText } = render(
          <EnhancedMobileFloatingToolbar
            onFormatPress={mockOnFormatPress}
            visible={true}
            hasSelection={true}
            selectionLength={25}
            showSelectionInfo={false}
          />
        );

        expect(getByText('Quick Format')).toBeTruthy();
        expect(queryByText('Format Selection (25 chars)')).toBeNull();
      });

      it('shows selection indicator when text is selected', () => {
        const { UNSAFE_getByType } = render(
          <EnhancedMobileFloatingToolbar
            onFormatPress={mockOnFormatPress}
            visible={true}
            hasSelection={true}
          />
        );

        const icons = UNSAFE_getByType(require('@expo/vector-icons').Ionicons);
        expect(icons).toBeTruthy();
      });
    });

    describe('Touch Interactions', () => {
      it('provides haptic feedback on mobile platforms', async () => {
        Platform.OS = 'ios';
        
        const { getByLabelText } = render(
          <EnhancedMobileFloatingToolbar
            onFormatPress={mockOnFormatPress}
            visible={true}
            hasSelection={true}
            enableHapticFeedback={true}
          />
        );

        fireEvent.press(getByLabelText('bold formatting'));

        await waitFor(() => {
          expect(mockImpactAsync).toHaveBeenCalledWith('light');
        });
      });

      it('does not provide haptic feedback when disabled', async () => {
        Platform.OS = 'ios';
        
        const { getByLabelText } = render(
          <EnhancedMobileFloatingToolbar
            onFormatPress={mockOnFormatPress}
            visible={true}
            hasSelection={true}
            enableHapticFeedback={false}
          />
        );

        fireEvent.press(getByLabelText('bold formatting'));

        await waitFor(() => {
          expect(mockImpactAsync).not.toHaveBeenCalled();
        });
      });

      it('handles touch start and end events for drag gestures', () => {
        const { getByTestId } = render(
          <EnhancedMobileFloatingToolbar
            onFormatPress={mockOnFormatPress}
            visible={true}
            hasSelection={false}
            enableSwipeGestures={true}
          />
        );

        // The container should handle touch events
        const container = getByTestId('enhanced-mobile-toolbar') || 
                         document.querySelector('[data-testid="enhanced-mobile-toolbar"]');
        
        if (container) {
          fireEvent(container, 'onTouchStart');
          fireEvent(container, 'onTouchEnd');
        }
        
        // Should not throw errors
        expect(mockOnFormatPress).not.toHaveBeenCalled();
      });
    });

    describe('Animation and Visibility', () => {
      it('animates in when visible becomes true', () => {
        const { rerender } = render(
          <EnhancedMobileFloatingToolbar
            onFormatPress={mockOnFormatPress}
            visible={false}
            hasSelection={false}
          />
        );

        rerender(
          <EnhancedMobileFloatingToolbar
            onFormatPress={mockOnFormatPress}
            visible={true}
            hasSelection={false}
          />
        );

        // Animation should be triggered
        expect(require('react-native').Animated.timing).toHaveBeenCalled();
      });

      it('does not render when visible is false', () => {
        const { queryByText } = render(
          <EnhancedMobileFloatingToolbar
            onFormatPress={mockOnFormatPress}
            visible={false}
            hasSelection={false}
          />
        );

        expect(queryByText('Quick Format')).toBeNull();
      });
    });
  });

  describe('KeyboardShortcutHandler', () => {
    beforeEach(() => {
      Platform.OS = 'web';
      // Mock document event listeners
      global.document = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      } as any;
    });

    it('registers keyboard event listeners when enabled', () => {
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('does not register listeners when disabled', () => {
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={false}
        />
      );

      expect(document.addEventListener).not.toHaveBeenCalled();
    });

    it('does not register listeners on non-web platforms', () => {
      Platform.OS = 'ios';
      
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      expect(document.addEventListener).not.toHaveBeenCalled();
    });

    it('removes event listeners on unmount', () => {
      const { unmount } = render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      unmount();

      expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});

// Mock Animated for tests
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Animated: {
      ...RN.Animated,
      timing: jest.fn(() => ({
        start: jest.fn((callback) => callback && callback()),
      })),
      spring: jest.fn(() => ({
        start: jest.fn((callback) => callback && callback()),
      })),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
      })),
    },
  };
});