import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { FormatType } from './FormattingToolbar';

interface KeyboardShortcutHandlerProps {
  onFormatPress: (format: FormatType) => void;
  enabled?: boolean;
}

export const KeyboardShortcutHandler: React.FC<KeyboardShortcutHandlerProps> = ({
  onFormatPress,
  enabled = true,
}) => {
  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle shortcuts if Alt key is pressed or if we're in an input field
      if (event.altKey || (event.target as HTMLElement)?.tagName === 'INPUT') {
        return;
      }

      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (!isCtrlOrCmd) {
        return;
      }

      let format: FormatType | null = null;

      // Basic formatting shortcuts
      switch (key) {
        case 'b':
          format = 'bold';
          break;
        case 'i':
          format = 'italic';
          break;
        case 'u':
          format = 'highlight';
          break;
        case 'l':
          format = event.shiftKey ? 'numberedList' : 'list';
          break;
        case 'q':
          format = 'quote';
          break;
        case 'e':
          format = 'code';
          break;
        case 'k':
          format = 'link';
          break;
        case '2':
          if (event.shiftKey) format = 'heading2';
          break;
        case '3':
          if (event.shiftKey) format = 'heading3';
          break;
        case 's':
          if (event.shiftKey) format = 'strikethrough';
          break;
      }

      if (format) {
        event.preventDefault();
        onFormatPress(format);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onFormatPress, enabled]);

  return null;
};