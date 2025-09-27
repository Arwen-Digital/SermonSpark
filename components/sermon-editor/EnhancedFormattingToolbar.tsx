import { theme } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FORMAT_CONFIGS, FormatType, KEYBOARD_SHORTCUTS } from './FormattingToolbar';
import { KeyboardShortcutHandler } from './KeyboardShortcutHandler';

interface EnhancedFormattingToolbarProps {
  onFormatPress: (format: FormatType) => void;
  hasSelection: boolean;
  viewMode: 'markup' | 'formatted';
  onViewModeToggle: () => void;
  onBibleVersePress: () => void;
  isLargeScreen?: boolean;
  showKeyboardShortcuts?: boolean;
  enableHapticFeedback?: boolean;
  compactMode?: boolean;
  enableKeyboardShortcuts?: boolean;
  customButtonOrder?: FormatType[];
  showTooltips?: boolean;
}

export const EnhancedFormattingToolbar: React.FC<EnhancedFormattingToolbarProps> = ({
  onFormatPress,
  hasSelection,
  viewMode,
  onViewModeToggle,
  onBibleVersePress,
  isLargeScreen = false,
  showKeyboardShortcuts = Platform.OS === 'web',
  enableHapticFeedback = Platform.OS !== 'web',
  compactMode = false,
  enableKeyboardShortcuts = Platform.OS === 'web',
  customButtonOrder,
  showTooltips = false,
}) => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [pressedButton, setPressedButton] = useState<FormatType | null>(null);
  const [hoveredButton, setHoveredButton] = useState<FormatType | null>(null);

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

  const handleFormatPress = useCallback(async (format: FormatType) => {
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
  }, [onFormatPress, enableHapticFeedback]);

  const getButtonOrder = (): FormatType[] => {
    if (customButtonOrder) {
      return customButtonOrder;
    }

    const baseOrder: FormatType[] = [
      'bold', 'italic', 'strikethrough', 'code',
      'heading2', 'heading3',
      'list', 'numberedList', 'quote',
      'highlight', 'link'
    ];

    if (compactMode) {
      return ['bold', 'italic', 'heading2', 'list', 'highlight'];
    }

    return baseOrder;
  };

  const renderFormatButton = (format: FormatType) => {
    const isPressed = pressedButton === format;
    const isHovered = hoveredButton === format;
    const config = FORMAT_CONFIGS[format];
    const shortcut = KEYBOARD_SHORTCUTS[format];

    const buttonStyle = [
      styles.toolbarButton,
      isPressed && styles.toolbarButtonPressed,
      isHovered && styles.toolbarButtonHovered,
      compactMode && styles.toolbarButtonCompact,
    ];

    const accessibilityLabel = `${format}${showKeyboardShortcuts && shortcut ? ` (${shortcut})` : ''}`;
    const accessibilityHint = config.requiresSelection === false 
      ? `Format line as ${format}`
      : `Apply ${format} formatting to selected text`;

    return (
      <Pressable
        key={format}
        style={buttonStyle}
        onPress={() => handleFormatPress(format)}
        onPressIn={() => setPressedButton(format)}
        onPressOut={() => setPressedButton(null)}
        onHoverIn={() => Platform.OS === 'web' && setHoveredButton(format)}
        onHoverOut={() => Platform.OS === 'web' && setHoveredButton(null)}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
      >
        {renderButtonContent(format)}
        {showKeyboardShortcuts && !compactMode && shortcut && (
          <Text style={styles.shortcutText}>{shortcut}</Text>
        )}
        {showTooltips && isHovered && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>{format}</Text>
            {shortcut && <Text style={styles.tooltipShortcut}>{shortcut}</Text>}
          </View>
        )}
      </Pressable>
    );
  };

  const renderButtonContent = (format: FormatType) => {
    switch (format) {
      case 'bold':
        return <Text style={styles.boldButtonText}>B</Text>;
      case 'italic':
        return <Text style={styles.italicButtonText}>I</Text>;
      case 'strikethrough':
        return <Text style={styles.strikethroughButtonText}>S</Text>;
      case 'heading2':
        return <Text style={styles.headingButtonText}>H2</Text>;
      case 'heading3':
        return <Text style={styles.headingButtonText}>H3</Text>;
      case 'code':
        return <Ionicons name="code" size={16} color={theme.colors.textPrimary} />;
      case 'list':
        return <Ionicons name="list" size={16} color={theme.colors.textPrimary} />;
      case 'numberedList':
        return <Ionicons name="list-outline" size={16} color={theme.colors.textPrimary} />;
      case 'quote':
        return <Ionicons name="chatbox-outline" size={16} color={theme.colors.textPrimary} />;
      case 'highlight':
        return <Ionicons name="color-fill" size={16} color={theme.colors.warning} />;
      case 'link':
        return <Ionicons name="link" size={16} color={theme.colors.primary} />;
      default:
        return <Text style={styles.buttonText}>{format}</Text>;
    }
  };

  return (
    <>
      <KeyboardShortcutHandler
        onFormatPress={handleFormatPress}
        enabled={enableKeyboardShortcuts}
      />
      <View style={[styles.container, keyboardVisible && styles.containerKeyboardVisible]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {hasSelection && isLargeScreen && (
            <View style={styles.selectionIndicator}>
              <Ionicons name="checkmark-circle" size={12} color={theme.colors.success} />
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
              accessibilityLabel={`Switch to ${viewMode === 'markup' ? 'preview' : 'markup'} mode`}
              accessibilityRole="button"
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
            
            {/* Format Buttons */}
            {getButtonOrder().map(renderFormatButton)}
            
            {/* Bible Verse Button - only show on large screens */}
            {isLargeScreen && (
              <>
                <View style={styles.toolbarSeparator} />
                <Pressable 
                  style={styles.toolbarBibleVerseButton} 
                  onPress={onBibleVersePress}
                  accessibilityLabel="Bible Verse Finder"
                  accessibilityRole="button"
                >
                  <Ionicons name="book" size={16} color={theme.colors.primary} />
                  <Text style={styles.toolbarBibleVerseButtonText}>Bible Verse Finder</Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
  },
  containerKeyboardVisible: {
    paddingVertical: theme.spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
  },
  selectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  selectionIndicatorText: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '500',
  },
  toolbarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
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
    minHeight: 44,
    position: 'relative',
    // Enhanced touch target for mobile
    ...Platform.select({
      web: {
        transition: 'all 0.15s ease',
        cursor: 'pointer',
      },
    }),
  },
  toolbarButtonPressed: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
    transform: [{ scale: 0.95 }],
  },
  toolbarButtonHovered: {
    backgroundColor: theme.colors.backgroundTertiary,
    borderColor: theme.colors.primaryLight,
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
    minHeight: 44,
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
  buttonText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textPrimary,
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
    minHeight: 44,
  },
  toolbarBibleVerseButtonText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: theme.colors.backgroundPrimary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 1000,
    minWidth: 60,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  tooltipText: {
    fontSize: 11,
    color: theme.colors.textPrimary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  tooltipShortcut: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});