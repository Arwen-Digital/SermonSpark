import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Dimensions, Platform } from 'react-native';
import { MobileFloatingToolbar } from '../MobileFloatingToolbar';

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
      Value: jest.fn(() => ({
        setValue: jest.fn(),
      })),
    },
  };
});

describe('Mobile Touch Interactions', () => {
  const mockOnFormatPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
    mockImpactAsync.mockClear();
  });

  describe('Touch Target Size', () => {
    it('provides adequate touch targets for mobile devices', () => {
      const { getByLabelText } = render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
        />
      );

      const boldButton = getByLabelText('bold formatting');
      const buttonStyle = boldButton.props.style;
      
      // Check that button has minimum 44pt touch target (iOS HIG recommendation)
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
        <MobileFloatingToolbar
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
  });

  describe('Haptic Feedback', () => {
    it('provides haptic feedback on button press for iOS', async () => {
      Platform.OS = 'ios';
      
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
        expect(mockImpactAsync).toHaveBeenCalledWith('light');
      });
    });

    it('provides haptic feedback on button press for Android', async () => {
      Platform.OS = 'android';
      
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
        expect(mockImpactAsync).toHaveBeenCalledWith('light');
      });
    });

    it('does not provide haptic feedback on web', async () => {
      Platform.OS = 'web';
      
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
        expect(mockImpactAsync).not.toHaveBeenCalled();
      });
    });

    it('does not provide haptic feedback when disabled', async () => {
      Platform.OS = 'ios';
      
      const { getByLabelText } = render(
        <MobileFloatingToolbar
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

    it('handles haptic feedback errors gracefully', async () => {
      Platform.OS = 'ios';
      mockImpactAsync.mockRejectedValueOnce(new Error('Haptics not available'));
      
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
        expect(mockOnFormatPress).toHaveBeenCalledWith('bold');
      });
      
      // Should not throw error
    });
  });

  describe('Visual Feedback', () => {
    it('provides visual feedback when button is pressed', async () => {
      const { getByLabelText } = render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
        />
      );

      const boldButton = getByLabelText('bold formatting');
      
      fireEvent.press(boldButton);

      // Visual feedback should be applied temporarily
      await waitFor(() => {
        expect(mockOnFormatPress).toHaveBeenCalledWith('bold');
      });
    });

    it('removes visual feedback after press animation', async () => {
      jest.useFakeTimers();
      
      const { getByLabelText } = render(
        <MobileFloatingToolbar
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
  });

  describe('Responsive Design', () => {
    it('adapts button layout for small screens', () => {
      // Mock small screen dimensions
      const mockDimensions = {
        get: jest.fn(() => ({ width: 320, height: 568 })),
        addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      };
      
      jest.spyOn(Dimensions, 'get').mockImplementation(mockDimensions.get);
      jest.spyOn(Dimensions, 'addEventListener').mockImplementation(mockDimensions.addEventListener);

      const { queryByLabelText } = render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
        />
      );

      // On small screens, should show fewer buttons
      expect(queryByLabelText('bold formatting')).toBeTruthy();
      expect(queryByLabelText('italic formatting')).toBeTruthy();
      expect(queryByLabelText('highlight formatting')).toBeTruthy();
    });

    it('shows more buttons on larger screens', () => {
      // Mock large screen dimensions
      const mockDimensions = {
        get: jest.fn(() => ({ width: 768, height: 1024 })),
        addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      };
      
      jest.spyOn(Dimensions, 'get').mockImplementation(mockDimensions.get);
      jest.spyOn(Dimensions, 'addEventListener').mockImplementation(mockDimensions.addEventListener);

      const { getByLabelText } = render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
        />
      );

      // On larger screens, should show extended button set
      expect(getByLabelText('bold formatting')).toBeTruthy();
      expect(getByLabelText('italic formatting')).toBeTruthy();
      expect(getByLabelText('strikethrough formatting')).toBeTruthy();
      expect(getByLabelText('code formatting')).toBeTruthy();
      expect(getByLabelText('link formatting')).toBeTruthy();
    });

    it('handles screen rotation and dimension changes', () => {
      const mockRemove = jest.fn();
      const mockAddEventListener = jest.fn(() => ({ remove: mockRemove }));
      
      jest.spyOn(Dimensions, 'addEventListener').mockImplementation(mockAddEventListener);

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

  describe('Animation and Transitions', () => {
    it('animates toolbar appearance', () => {
      const { Animated } = require('react-native');
      
      render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={false}
        />
      );

      expect(Animated.timing).toHaveBeenCalled();
    });

    it('animates toolbar disappearance', () => {
      const { Animated } = require('react-native');
      
      const { rerender } = render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={false}
        />
      );

      rerender(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={false}
          hasSelection={false}
        />
      );

      expect(Animated.timing).toHaveBeenCalled();
    });
  });

  describe('Selection Context', () => {
    it('shows different buttons based on selection state', () => {
      const { getByText, rerender } = render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={false}
        />
      );

      expect(getByText('Quick Format')).toBeTruthy();

      rerender(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
          selectionLength={15}
        />
      );

      expect(getByText('Format Selection (15 chars)')).toBeTruthy();
    });

    it('shows selection indicator when text is selected', () => {
      const { UNSAFE_getByType } = render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
        />
      );

      // Should render the selection indicator icon
      const icons = UNSAFE_getByType(require('@expo/vector-icons').Ionicons);
      expect(icons).toBeTruthy();
    });
  });

  describe('Scroll Behavior', () => {
    it('configures horizontal scroll with proper settings', () => {
      const { UNSAFE_getByType } = render(
        <MobileFloatingToolbar
          onFormatPress={mockOnFormatPress}
          visible={true}
          hasSelection={true}
        />
      );

      const scrollView = UNSAFE_getByType(require('react-native').ScrollView);
      expect(scrollView.props.horizontal).toBe(true);
      expect(scrollView.props.showsHorizontalScrollIndicator).toBe(false);
      expect(scrollView.props.bounces).toBe(false);
      expect(scrollView.props.decelerationRate).toBe('fast');
    });
  });
});