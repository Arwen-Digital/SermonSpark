import { theme } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export type FormatType = 'bold' | 'italic' | 'heading2' | 'heading3' | 'list' | 'numberedList' | 'quote' | 'highlight' | 'strikethrough' | 'code' | 'link';

export interface FormatConfig {
  before: string;
  after: string;
  placeholder?: string;
  requiresSelection?: boolean;
}

export const FORMAT_CONFIGS: Record<FormatType, FormatConfig> = {
  bold: { before: '**', after: '**', placeholder: 'bold text' },
  italic: { before: '*', after: '*', placeholder: 'italic text' },
  heading2: { before: '## ', after: '', requiresSelection: false },
  heading3: { before: '### ', after: '', requiresSelection: false },
  list: { before: '- ', after: '', requiresSelection: false },
  numberedList: { before: '1. ', after: '', requiresSelection: false },
  quote: { before: '> ', after: '', requiresSelection: false },
  highlight: { before: '==', after: '==', placeholder: 'highlighted text' },
  strikethrough: { before: '~~', after: '~~', placeholder: 'strikethrough text' },
  code: { before: '`', after: '`', placeholder: 'code' },
  link: { before: '[', after: '](url)', placeholder: 'link text' }
};

// Keyboard shortcuts mapping for display
export const KEYBOARD_SHORTCUTS: Record<FormatType, string> = {
  bold: Platform.OS === 'web' ? '⌘B' : 'Ctrl+B',
  italic: Platform.OS === 'web' ? '⌘I' : 'Ctrl+I',
  heading2: Platform.OS === 'web' ? '⌘⇧2' : 'Ctrl+Shift+2',
  heading3: Platform.OS === 'web' ? '⌘⇧3' : 'Ctrl+Shift+3',
  list: Platform.OS === 'web' ? '⌘L' : 'Ctrl+L',
  numberedList: Platform.OS === 'web' ? '⌘⇧L' : 'Ctrl+Shift+L',
  quote: Platform.OS === 'web' ? '⌘Q' : 'Ctrl+Q',
  highlight: Platform.OS === 'web' ? '⌘U' : 'Ctrl+U',
  strikethrough: Platform.OS === 'web' ? '⌘⇧S' : 'Ctrl+Shift+S',
  code: Platform.OS === 'web' ? '⌘E' : 'Ctrl+E',
  link: Platform.OS === 'web' ? '⌘K' : 'Ctrl+K'
};

interface FormattingToolbarProps {
  onFormatPress: (format: FormatType) => void;
  hasSelection: boolean;
  viewMode: 'markup' | 'formatted';
  onViewModeToggle: () => void;
  onBibleVersePress: () => void;
  isLargeScreen?: boolean;
  showKeyboardShortcuts?: boolean;
  enableHapticFeedback?: boolean;
  compactMode?: boolean;
}

export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  onFormatPress,
  hasSelection,
  viewMode,
  onViewModeToggle,
  onBibleVersePress,
  isLargeScreen = false,
  showKeyboardShortcuts = Platform.OS === 'web',
  enableHapticFeedback = Platform.OS !== 'web',
  compactMode = false,
}) => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [pressedButton, setPressedButton] = useState<FormatType | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
        setKeyboardVisible(true);
      });
      const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardVisible(false);
      });

      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }
  }, []);

  const handleFormatPress = async (format: FormatType) => {
    // Visual feedback
    setPressedButton(format);
    setTimeout(() => setPressedButton(null), 150);

    // Haptic feedback on mobile
    if (enableHapticFeedback && Platform.OS !== 'web') {
      try {
        const { impactAsync, ImpactFeedbackStyle } = await import('expo-haptics');
        impactAsync(ImpactFeedbackStyle.Light);
      } catch (error) {
        // Haptics not available, continue without feedback
      }
    }

    onFormatPress(format);
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {hasSelection && isLargeScreen && (
          <View style={styles.selectionIndicator}>
            <Text style={styles.selectionIndicatorText}>Text selected</Text>
          </View>
        )}
        
        <View style={styles.toolbarButtons}>
          {/* View Mode Toggle */}
          <Pressable 
            style={[
              styles.viewModeToggle,
              viewMode === 'markup' && styles.viewModeToggleActive
            ]} 
            onPress={onViewModeToggle}
          >
            <Ionicons 
              name={viewMode === 'markup' ? 'code-outline' : 'eye-outline'} 
              size={16} 
              color={viewMode === 'markup' ? theme.colors.primary : theme.colors.textPrimary} 
            />
            <Text style={[
              styles.viewModeToggleText,
              viewMode === 'markup' && styles.viewModeToggleTextActive
            ]}>
              {viewMode === 'markup' ? 'Markup' : 'Preview'}
            </Text>
          </Pressable>
          
          <View style={styles.toolbarSeparator} />
          
          {/* Text Formatting Buttons */}
          <Pressable 
            style={[
              styles.toolbarButton,
              pressedButton === 'bold' && styles.toolbarButtonPressed,
              compactMode && styles.toolbarButtonCompact
            ]} 
            onPress={() => handleFormatPress('bold')}
            accessibilityLabel={`Bold${showKeyboardShortcuts ? ` (${KEYBOARD_SHORTCUTS.bold})` : ''}`}
            accessibilityHint="Apply bold formatting to selected text"
          >
            <Text style={styles.boldButtonText}>B</Text>
            {showKeyboardShortcuts && !compactMode && (
              <Text style={styles.shortcutText}>{KEYBOARD_SHORTCUTS.bold}</Text>
            )}
          </Pressable>
          
          <Pressable 
            style={[
              styles.toolbarButton,
              pressedButton === 'italic' && styles.toolbarButtonPressed,
              compactMode && styles.toolbarButtonCompact
            ]} 
            onPress={() => handleFormatPress('italic')}
            accessibilityLabel={`Italic${showKeyboardShortcuts ? ` (${KEYBOARD_SHORTCUTS.italic})` : ''}`}
            accessibilityHint="Apply italic formatting to selected text"
          >
            <Text style={styles.italicButtonText}>I</Text>
            {showKeyboardShortcuts && !compactMode && (
              <Text style={styles.shortcutText}>{KEYBOARD_SHORTCUTS.italic}</Text>
            )}
          </Pressable>

          <Pressable 
            style={[
              styles.toolbarButton,
              pressedButton === 'strikethrough' && styles.toolbarButtonPressed,
              compactMode && styles.toolbarButtonCompact
            ]} 
            onPress={() => handleFormatPress('strikethrough')}
            accessibilityLabel="Strikethrough"
            accessibilityHint="Apply strikethrough formatting to selected text"
          >
            <Text style={styles.strikethroughButtonText}>S</Text>
          </Pressable>

          <Pressable 
            style={[
              styles.toolbarButton,
              pressedButton === 'code' && styles.toolbarButtonPressed,
              compactMode && styles.toolbarButtonCompact
            ]} 
            onPress={() => handleFormatPress('code')}
            accessibilityLabel="Code"
            accessibilityHint="Format selected text as code"
          >
            <Ionicons name="code" size={16} color={theme.colors.textPrimary} />
          </Pressable>
          
          <View style={styles.toolbarSeparator} />
          
          <Pressable 
            style={[
              styles.toolbarButton,
              pressedButton === 'heading2' && styles.toolbarButtonPressed,
              compactMode && styles.toolbarButtonCompact
            ]} 
            onPress={() => handleFormatPress('heading2')}
            accessibilityLabel={`Heading 2${showKeyboardShortcuts ? ` (${KEYBOARD_SHORTCUTS.heading2})` : ''}`}
            accessibilityHint="Format line as heading 2"
          >
            <Text style={styles.headingButtonText}>H2</Text>
          </Pressable>
          
          <Pressable 
            style={[
              styles.toolbarButton,
              pressedButton === 'heading3' && styles.toolbarButtonPressed,
              compactMode && styles.toolbarButtonCompact
            ]} 
            onPress={() => handleFormatPress('heading3')}
            accessibilityLabel={`Heading 3${showKeyboardShortcuts ? ` (${KEYBOARD_SHORTCUTS.heading3})` : ''}`}
            accessibilityHint="Format line as heading 3"
          >
            <Text style={styles.headingButtonText}>H3</Text>
          </Pressable>
          
          <View style={styles.toolbarSeparator} />
          
          {/* List Buttons */}
          <Pressable 
            style={[
              styles.toolbarButton,
              pressedButton === 'list' && styles.toolbarButtonPressed,
              compactMode && styles.toolbarButtonCompact
            ]} 
            onPress={() => handleFormatPress('list')}
            accessibilityLabel={`Bullet List${showKeyboardShortcuts ? ` (${KEYBOARD_SHORTCUTS.list})` : ''}`}
            accessibilityHint="Create bullet list"
          >
            <Ionicons name="list" size={16} color={theme.colors.textPrimary} />
          </Pressable>
          
          <Pressable 
            style={[
              styles.toolbarButton,
              pressedButton === 'numberedList' && styles.toolbarButtonPressed,
              compactMode && styles.toolbarButtonCompact
            ]} 
            onPress={() => handleFormatPress('numberedList')}
            accessibilityLabel={`Numbered List${showKeyboardShortcuts ? ` (${KEYBOARD_SHORTCUTS.numberedList})` : ''}`}
            accessibilityHint="Create numbered list"
          >
            <Ionicons name="list-outline" size={16} color={theme.colors.textPrimary} />
          </Pressable>
          
          <Pressable 
            style={[
              styles.toolbarButton,
              pressedButton === 'quote' && styles.toolbarButtonPressed,
              compactMode && styles.toolbarButtonCompact
            ]} 
            onPress={() => handleFormatPress('quote')}
            accessibilityLabel={`Quote${showKeyboardShortcuts ? ` (${KEYBOARD_SHORTCUTS.quote})` : ''}`}
            accessibilityHint="Format as quote"
          >
            <Ionicons name="chatbox-outline" size={16} color={theme.colors.textPrimary} />
          </Pressable>
          
          <View style={styles.toolbarSeparator} />
          
          {/* Highlight and Link Buttons */}
          <Pressable 
            style={[
              styles.toolbarButton,
              pressedButton === 'highlight' && styles.toolbarButtonPressed,
              compactMode && styles.toolbarButtonCompact
            ]} 
            onPress={() => handleFormatPress('highlight')}
            accessibilityLabel={`Highlight${showKeyboardShortcuts ? ` (${KEYBOARD_SHORTCUTS.highlight})` : ''}`}
            accessibilityHint="Highlight selected text"
          >
            <Ionicons name="color-fill" size={16} color={theme.colors.warning} />
          </Pressable>

          <Pressable 
            style={[
              styles.toolbarButton,
              pressedButton === 'link' && styles.toolbarButtonPressed,
              compactMode && styles.toolbarButtonCompact
            ]} 
            onPress={() => handleFormatPress('link')}
            accessibilityLabel={`Link${showKeyboardShortcuts ? ` (${KEYBOARD_SHORTCUTS.link})` : ''}`}
            accessibilityHint="Create link from selected text"
          >
            <Ionicons name="link" size={16} color={theme.colors.primary} />
          </Pressable>
          
          {/* Bible Verse Button - only show on large screens in toolbar */}
          {isLargeScreen && (
            <>
              <View style={styles.toolbarSeparator} />
              <Pressable style={styles.toolbarBibleVerseButton} onPress={onBibleVersePress}>
                <Ionicons name="book" size={16} color={theme.colors.primary} />
                <Text style={styles.toolbarBibleVerseButtonText}>Bible Verse Finder</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
  },
  selectionIndicator: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
    alignSelf: 'center',
  },
  selectionIndicatorText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  toolbarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  toolbarButton: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    // Enhanced touch target for mobile
    minHeight: 44,
    // Smooth transitions
    transition: Platform.OS === 'web' ? 'all 0.15s ease' : undefined,
  },
  toolbarButtonPressed: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
    transform: [{ scale: 0.95 }],
  },
  toolbarButtonCompact: {
    minWidth: 28,
    minHeight: 36,
    paddingHorizontal: theme.spacing.xs,
  },
  viewModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  viewModeToggleActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  viewModeToggleText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  viewModeToggleTextActive: {
    color: theme.colors.primary,
  },
  toolbarSeparator: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.xs,
  },
  boldButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  italicButtonText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: theme.colors.textPrimary,
  },
  headingButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  strikethroughButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textDecorationLine: 'line-through',
  },
  shortcutText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  toolbarBibleVerseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  toolbarBibleVerseButtonText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});