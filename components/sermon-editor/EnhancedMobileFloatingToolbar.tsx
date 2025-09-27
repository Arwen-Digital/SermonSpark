import { theme } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { FORMAT_CONFIGS, FormatType } from './FormattingToolbar';

interface EnhancedMobileFloatingToolbarProps {
  onFormatPress: (format: FormatType) => void;
  visible: boolean;
  hasSelection: boolean;
  selectionLength?: number;
  enableHapticFeedback?: boolean;
  compactMode?: boolean;
  customButtonSet?: FormatType[];
  showSelectionInfo?: boolean;
  enableSwipeGestures?: boolean;
  autoHideDelay?: number;
}

export const EnhancedMobileFloatingToolbar: React.FC<EnhancedMobileFloatingToolbarProps> = ({
  onFormatPress,
  visible,
  hasSelection,
  selectionLength = 0,
  enableHapticFeedback = true,
  compactMode = false,
  customButtonSet,
  showSelectionInfo = true,
  enableSwipeGestures = true,
  autoHideDelay,
}) => {
  const [slideAnim] = useState(new Animated.Value(visible ? 0 : -100));
  const [pressedButton, setPressedButton] = useState<FormatType | null>(null);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset] = useState(new Animated.Value(0));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -100,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  // Auto-hide functionality
  useEffect(() => {
    if (visible && autoHideDelay && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        // This would need to be handled by parent component
        // onAutoHide?.();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [visible, autoHideDelay]);

  const handleFormatPress = useCallback(async (format: FormatType) => {
    // Visual feedback
    setPressedButton(format);
    setTimeout(() => setPressedButton(null), 150);

    // Haptic feedback
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

  const getToolbarButtons = (): FormatType[] => {
    if (customButtonSet) {
      return customButtonSet;
    }

    const baseButtons: FormatType[] = ['bold', 'italic', 'highlight'];
    const extendedButtons: FormatType[] = ['heading2', 'heading3', 'quote', 'code'];
    const selectionButtons: FormatType[] = ['strikethrough', 'code', 'link'];
    
    if (compactMode || screenWidth < 350) {
      return baseButtons;
    }
    
    if (hasSelection) {
      return [...baseButtons, ...selectionButtons];
    }
    
    return [...baseButtons, ...extendedButtons];
  };

  // Simplified touch handling without gesture handler
  const handleTouchStart = () => {
    setIsDragging(true);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const renderButton = (format: FormatType) => {
    const isPressed = pressedButton === format;
    const config = FORMAT_CONFIGS[format];
    
    const buttonStyle = [
      styles.button,
      isPressed && styles.buttonPressed,
      compactMode && styles.buttonCompact,
      isDragging && styles.buttonDragging,
    ];
    
    return (
      <Pressable 
        key={format}
        style={buttonStyle}
        onPress={() => handleFormatPress(format)}
        onPressIn={() => setPressedButton(format)}
        onPressOut={() => setPressedButton(null)}
        accessibilityLabel={`${format} formatting`}
        accessibilityHint={`Apply ${format} formatting to selected text`}
        accessibilityRole="button"
        delayPressIn={0}
        delayPressOut={0}
      >
        {renderButtonContent(format)}
      </Pressable>
    );
  };

  const renderButtonContent = (format: FormatType) => {
    const iconSize = compactMode ? 14 : 16;
    const textSize = compactMode ? 14 : 16;

    switch (format) {
      case 'bold':
        return <Text style={[styles.boldButtonText, { fontSize: textSize }]}>B</Text>;
      case 'italic':
        return <Text style={[styles.italicButtonText, { fontSize: textSize }]}>I</Text>;
      case 'strikethrough':
        return <Text style={[styles.strikethroughButtonText, { fontSize: textSize }]}>S</Text>;
      case 'heading2':
        return <Text style={[styles.headingButtonText, { fontSize: textSize - 2 }]}>H2</Text>;
      case 'heading3':
        return <Text style={[styles.headingButtonText, { fontSize: textSize - 2 }]}>H3</Text>;
      case 'highlight':
        return <Ionicons name="color-fill" size={iconSize} color={theme.colors.warning} />;
      case 'quote':
        return <Ionicons name="chatbox-outline" size={iconSize} color={theme.colors.textPrimary} />;
      case 'code':
        return <Ionicons name="code" size={iconSize} color={theme.colors.textPrimary} />;
      case 'link':
        return <Ionicons name="link" size={iconSize} color={theme.colors.primary} />;
      default:
        return <Text style={[styles.buttonText, { fontSize: textSize - 2 }]}>{format}</Text>;
    }
  };

  if (!visible) return null;

  const toolbarButtons = getToolbarButtons();

  const containerTransform = [
    { translateY: slideAnim },
    ...(enableSwipeGestures ? [{ translateY: dragOffset }] : []),
  ];

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: containerTransform },
        compactMode && styles.containerCompact,
      ]}
      onTouchStart={enableSwipeGestures ? handleTouchStart : undefined}
      onTouchEnd={enableSwipeGestures ? handleTouchEnd : undefined}
    >
      {enableSwipeGestures && (
        <View style={styles.dragHandle}>
          <View style={styles.dragIndicator} />
        </View>
      )}
      
      <View style={styles.header}>
        <Text style={[styles.title, compactMode && styles.titleCompact]}>
          {hasSelection && showSelectionInfo
            ? `Format Selection${selectionLength > 0 ? ` (${selectionLength} chars)` : ''}` 
            : 'Quick Format'
          }
        </Text>
        {hasSelection && (
          <View style={styles.selectionIndicator}>
            <Ionicons name="checkmark-circle" size={12} color={theme.colors.success} />
          </View>
        )}
      </View>
      
      <ScrollView 
        horizontal 
        style={styles.scroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          compactMode && styles.contentCompact,
        ]}
        bounces={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
      >
        {toolbarButtons.map(renderButton)}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    zIndex: 1000,
    elevation: 8,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  containerCompact: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 11,
  },
  selectionIndicator: {
    backgroundColor: theme.colors.successLight,
    borderRadius: 10,
    padding: 2,
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  contentCompact: {
    gap: theme.spacing.xs,
  },
  button: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonPressed: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
    transform: [{ scale: 0.95 }],
    shadowOpacity: 0.12,
  },
  buttonCompact: {
    minWidth: 36,
    minHeight: 36,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  buttonDragging: {
    opacity: 0.8,
  },
  boldButtonText: {
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  italicButtonText: {
    fontStyle: 'italic',
    color: theme.colors.textPrimary,
  },
  strikethroughButtonText: {
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textDecorationLine: 'line-through',
  },
  headingButtonText: {
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  buttonText: {
    fontWeight: '500',
    color: theme.colors.textPrimary,
    textTransform: 'capitalize',
  },
});