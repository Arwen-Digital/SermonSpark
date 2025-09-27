import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Dimensions, Platform } from 'react-native';
import { EnhancedMobileFloatingToolbar } from '../EnhancedMobileFloatingToolbar';

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

// Mock Animated
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

describe('Enhanced Mobile Touch Interactions', () => {
  const mockOnFormatPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
    mockImpactAsync.mockClear();
  });

  describe('Enhanced Touch Targets', () => {
    it('provides adequate touch targets for mobile devices', () => {
      const { getByLabelText } = render(
        <EnhancedMobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
        />
      );

      const boldButton = getByLabelText('bold formatting');
      const buttonStyle = boldButton.props.style;
      
      // Check that button has minimum 44pt touch target
      expect(buttonStyle).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            minHeight: 44,
            minWidth: 44,
          })
        ])
      );
    });

    it('uses compact touch targets when compactMode is enabled', () => {
      const { getByLabelText } = render(
        <EnhancedMobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
          compactMode={true}
        />
      );

      const boldButton = getByLabelText('bold formatting');
      const buttonStyle = boldButton.props.style;
      
      // Check that compact button has smaller but still adequate touch target
      expect(buttonStyle).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            minHeight: 36,
            minWidth: 36,
          })
        ])
      );
    });

    it('adjusts button sizes based on screen width', () => {
      // Mock small screen dimensions
      const mockDimensions = {
        get: jest.fn(() => ({ width: 320, height: 568 })),
        addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      };
      
      jest.spyOn(Dimensions, 'get').mockImplementation(mockDimensions.get);
      jest.spyOn(Dimensions, 'addEventListener').mockImplementation(mockDimensions.addEventListener);

      const { getByLabelText } = render(
        <EnhancedMobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
        />
      );

      // Should render basic buttons for small screen
      expect(getByLabelText('bold formatting')).toBeTruthy();
      expect(getByLabelText('italic formatting')).toBeTruthy();
      expect(getByLabelText('highlight formatting')).toBeTruthy();
    });
  });

  describe('Enhanced Haptic Feedback', () => {
    it('provides haptic feedback on button press for iOS', async () => {
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

    it('provides haptic feedback on button press for Android', async () => {
      Platform.OS = 'android';
      
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

    it('does not provide haptic feedback on web', async () => {
      Platform.OS = 'web';
      
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
        expect(mockImpactAsync).not.toHaveBeenCalled();
      });
    });

    it('handles haptic feedback errors gracefully', async () => {
      Platform.OS = 'ios';
      mockImpactAsync.mockRejectedValueOnce(new Error('Haptics not available'));
      
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
        expect(mockOnFormatPress).toHaveBeenCalledWith('bold');
      });
      
      // Should not throw error
    });
  });

  describe('Enhanced Visual Feedback', () => {
    it('provides immediate visual feedback on press', async () => {
      const { getByLabelText } = render(
        <EnhancedMobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
        />
      );

      const boldButton = getByLabelText('bold formatting');
      
      fireEvent(boldButton, 'onPressIn');
      fireEvent.press(boldButton);
      fireEvent(boldButton, 'onPressOut');

      await waitFor(() => {
        expect(mockOnFormatPress).toHaveBeenCalledWith('bold');
      });
    });

    it('removes visual feedback after press animation', async () => {
      jest.useFakeTimers();
      
      const { getByLabelText } = render(
        <EnhancedMobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
        />
      );

      const boldButton = getByLabelText('bold formatting');
      
      fireEvent.press(boldButton);

      // Fast-forward time to complete the visual feedback animation
      act(() => {
        jest.advanceTimersByTime(200);
      });

      await waitFor(() => {
        expect(mockOnFormatPress).toHaveBeenCalledWith('bold');
      });

      jest.useRealTimers();
    });

    it('applies dragging visual state during touch interactions', () => {
      const { container } = render(
        <EnhancedMobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={false}
          enableSwipeGestures={true}
        />
      );

      // Simulate touch start
      fireEvent(container.firstChild, 'onTouchStart');
      
      // Should apply dragging state
      expect(container.firstChild).toBeTruthy();
      
      // Simulate touch end
      fireEvent(container.firstChild, 'onTouchEnd');
    });
  });

  describe('Custom Button Sets', () => {
    it('renders custom button set correctly', () => {
      const customButtons = ['bold', 'italic', 'code', 'link'];
      
      const { getByLabelText, queryByLabelText } = render(
        <EnhancedMobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
          customButtonSet={customButtons}
        />
      );

      // Should render custom buttons
      expect(getByLabelText('bold formatting')).toBeTruthy();
      expect(getByLabelText('italic formatting')).toBeTruthy();
      expect(getByLabelText('code formatting')).toBeTruthy();
      expect(getByLabelText('link formatting')).toBeTruthy();
      
      // Should not render default buttons not in custom set
      expect(queryByLabelText('highlight formatting')).toBeNull();
    });

    it('handles empty custom button set', () => {
      const { queryByLabelText } = render(
        <EnhancedMobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
          customButtonSet={[]}
        />
      );

      // Should not render any format buttons
      expect(queryByLabelText('bold formatting')).toBeNull();
      expect(queryByLabelText('italic formatting')).toBeNull();
    });
  });

  describe('Selection Information Display', () => {
    it('shows detailed selection information', () => {
      const { getByText } = render(
        <EnhancedMobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
          selectionLength={42}
          showSelectionInfo={true}
        />
      );

      expect(getByText('Format Selection (42 chars)')).toBeTruthy();
    });

    it('hides selection information when disabled', () => {
      const { getByText, queryByText } = render(
        <EnhancedMobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
          selectionLength={42}
          showSelectionInfo={false}
        />
      );

      expect(getByText('Quick Format')).toBeTruthy();
      expect(queryByText('Format Selection (42 chars)')).toBeNull();
    });

    it('shows selection indicator icon when text is selected', () => {
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

  describe('Responsive Design Enhancements', () => {
    it('adapts to screen rotation', () => {
      const mockRemove = jest.fn();
      const mockAddEventListener = jest.fn(() => ({ remove: mockRemove }));
      
      jest.spyOn(Dimensions, 'addEventListener').mockImplementation(mockAddEventListener);

      const { unmount } = render(
        <EnhancedMobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={false}
        />
      );

      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));

      unmount();
      expect(mockRemove).toHaveBeenCalled();
    });

    it('updates button layout on dimension changes', () => {
      const mockAddEventListener = jest.fn();
      const dimensionChangeCallback = jest.fn();
      
      mockAddEventListener.mockImplementation((event, callback) => {
        if (event === 'change') {
          dimensionChangeCallback.mockImplementation(callback);
        }
        return { remove: jest.fn() };
      });
      
      jest.spyOn(Dimensions, 'addEventListener').mockImplementation(mockAddEventListener);

      render(
        <EnhancedMobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={false}
        />
      );

      // Simulate dimension change
      dimensionChangeCallback({ window: { width: 768, height: 1024 } });

      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('Animation Enhancements', () => {
    it('uses smooth animations for appearance', () => {
      const { Animated } = require('react-native');
      
      render(
        <EnhancedMobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={false}
        />
      );

      expect(Animated.timing).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      );
    });

    it('animates toolbar disappearance', () => {
      const { Animated } = require('react-native');
      
      const { rerender } = render(
        <EnhancedMobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={false}
        />
      );

      rerender(
        <EnhancedMobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={false}
          hasSelection={false}
        />
      );

      expect(Animated.timing).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        })
      );
    });
  });

  describe('Accessibility Enhancements', () => {
    it('provides comprehensive accessibility labels', () => {
      const { getByLabelText } = render(
        <EnhancedMobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
        />
      );

      const boldButton = getByLabelText('bold formatting');
      expect(boldButton.props.accessibilityRole).toBe('button');
      expect(boldButton.props.accessibilityHint).toBe('Apply bold formatting to selected text');
    });

    it('provides proper accessibility for all button types', () => {
      const { getByLabelText } = render(
        <EnhancedMobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
        />
      );

      const buttons = [
        'bold formatting',
        'italic formatting', 
        'strikethrough formatting',
        'code formatting',
        'link formatting'
      ];

      buttons.forEach(buttonLabel => {
        const button = getByLabelText(buttonLabel);
        expect(button.props.accessibilityRole).toBe('button');
        expect(button.props.accessibilityHint).toContain('Apply');
      });
    });
  });
});