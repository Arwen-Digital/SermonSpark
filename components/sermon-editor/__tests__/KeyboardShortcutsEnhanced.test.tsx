import { render } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';
import { KeyboardShortcutHandler } from '../KeyboardShortcutHandler';

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'web',
  select: jest.fn(),
}));

describe('Enhanced Keyboard Shortcuts', () => {
  const mockOnFormatPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'web';
    
    // Mock document
    global.document = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as any;
  });

  describe('KeyboardShortcutHandler', () => {
    it('handles Ctrl+B for bold formatting', () => {
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      const keydownHandler = (document.addEventListener as jest.Mock).mock.calls[0][1];
      
      const event = {
        key: 'b',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        target: { tagName: 'DIV' },
        preventDefault: jest.fn(),
      };

      keydownHandler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOnFormatPress).toHaveBeenCalledWith('bold');
    });

    it('handles Cmd+I for italic formatting on Mac', () => {
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      const keydownHandler = (document.addEventListener as jest.Mock).mock.calls[0][1];
      
      const event = {
        key: 'i',
        ctrlKey: false,
        metaKey: true,
        shiftKey: false,
        altKey: false,
        target: { tagName: 'DIV' },
        preventDefault: jest.fn(),
      };

      keydownHandler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOnFormatPress).toHaveBeenCalledWith('italic');
    });

    it('handles Ctrl+U for highlight formatting', () => {
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      const keydownHandler = (document.addEventListener as jest.Mock).mock.calls[0][1];
      
      const event = {
        key: 'u',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        target: { tagName: 'DIV' },
        preventDefault: jest.fn(),
      };

      keydownHandler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOnFormatPress).toHaveBeenCalledWith('highlight');
    });

    it('handles Ctrl+L for list formatting', () => {
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      const keydownHandler = (document.addEventListener as jest.Mock).mock.calls[0][1];
      
      const event = {
        key: 'l',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        target: { tagName: 'DIV' },
        preventDefault: jest.fn(),
      };

      keydownHandler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOnFormatPress).toHaveBeenCalledWith('list');
    });

    it('handles Ctrl+Shift+L for numbered list', () => {
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      const keydownHandler = (document.addEventListener as jest.Mock).mock.calls[0][1];
      
      const event = {
        key: 'l',
        ctrlKey: true,
        metaKey: false,
        shiftKey: true,
        altKey: false,
        target: { tagName: 'DIV' },
        preventDefault: jest.fn(),
      };

      keydownHandler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOnFormatPress).toHaveBeenCalledWith('numberedList');
    });

    it('handles Ctrl+Q for quote formatting', () => {
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      const keydownHandler = (document.addEventListener as jest.Mock).mock.calls[0][1];
      
      const event = {
        key: 'q',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        target: { tagName: 'DIV' },
        preventDefault: jest.fn(),
      };

      keydownHandler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOnFormatPress).toHaveBeenCalledWith('quote');
    });

    it('handles Ctrl+E for code formatting', () => {
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      const keydownHandler = (document.addEventListener as jest.Mock).mock.calls[0][1];
      
      const event = {
        key: 'e',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        target: { tagName: 'DIV' },
        preventDefault: jest.fn(),
      };

      keydownHandler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOnFormatPress).toHaveBeenCalledWith('code');
    });

    it('handles Ctrl+K for link formatting', () => {
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      const keydownHandler = (document.addEventListener as jest.Mock).mock.calls[0][1];
      
      const event = {
        key: 'k',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        target: { tagName: 'DIV' },
        preventDefault: jest.fn(),
      };

      keydownHandler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOnFormatPress).toHaveBeenCalledWith('link');
    });

    it('handles Ctrl+Shift+2 for heading 2', () => {
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      const keydownHandler = (document.addEventListener as jest.Mock).mock.calls[0][1];
      
      const event = {
        key: '2',
        ctrlKey: true,
        metaKey: false,
        shiftKey: true,
        altKey: false,
        target: { tagName: 'DIV' },
        preventDefault: jest.fn(),
      };

      keydownHandler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOnFormatPress).toHaveBeenCalledWith('heading2');
    });

    it('handles Ctrl+Shift+3 for heading 3', () => {
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      const keydownHandler = (document.addEventListener as jest.Mock).mock.calls[0][1];
      
      const event = {
        key: '3',
        ctrlKey: true,
        metaKey: false,
        shiftKey: true,
        altKey: false,
        target: { tagName: 'DIV' },
        preventDefault: jest.fn(),
      };

      keydownHandler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOnFormatPress).toHaveBeenCalledWith('heading3');
    });

    it('handles Ctrl+Shift+S for strikethrough', () => {
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      const keydownHandler = (document.addEventListener as jest.Mock).mock.calls[0][1];
      
      const event = {
        key: 's',
        ctrlKey: true,
        metaKey: false,
        shiftKey: true,
        altKey: false,
        target: { tagName: 'DIV' },
        preventDefault: jest.fn(),
      };

      keydownHandler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOnFormatPress).toHaveBeenCalledWith('strikethrough');
    });

    it('ignores shortcuts with Alt key pressed', () => {
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      const keydownHandler = (document.addEventListener as jest.Mock).mock.calls[0][1];
      
      const event = {
        key: 'b',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: true,
        target: { tagName: 'DIV' },
        preventDefault: jest.fn(),
      };

      keydownHandler(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(mockOnFormatPress).not.toHaveBeenCalled();
    });

    it('ignores shortcuts when target is an input field', () => {
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      const keydownHandler = (document.addEventListener as jest.Mock).mock.calls[0][1];
      
      const event = {
        key: 'b',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        target: { tagName: 'INPUT' },
        preventDefault: jest.fn(),
      };

      keydownHandler(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(mockOnFormatPress).not.toHaveBeenCalled();
    });

    it('ignores shortcuts without Ctrl or Cmd key', () => {
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      const keydownHandler = (document.addEventListener as jest.Mock).mock.calls[0][1];
      
      const event = {
        key: 'b',
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        target: { tagName: 'DIV' },
        preventDefault: jest.fn(),
      };

      keydownHandler(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(mockOnFormatPress).not.toHaveBeenCalled();
    });

    it('handles case insensitive shortcuts', () => {
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      const keydownHandler = (document.addEventListener as jest.Mock).mock.calls[0][1];
      
      const event = {
        key: 'B',
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        target: { tagName: 'DIV' },
        preventDefault: jest.fn(),
      };

      keydownHandler(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOnFormatPress).toHaveBeenCalledWith('bold');
    });

    it('does not handle shortcuts when disabled', () => {
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={false}
        />
      );

      expect(document.addEventListener).not.toHaveBeenCalled();
    });

    it('does not handle shortcuts on non-web platforms', () => {
      Platform.OS = 'ios';
      
      render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      expect(document.addEventListener).not.toHaveBeenCalled();
    });

    it('cleans up event listeners on unmount', () => {
      const { unmount } = render(
        <KeyboardShortcutHandler
          onFormatPress={mockOnFormatPress}
          enabled={true}
        />
      );

      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));

      unmount();

      expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});