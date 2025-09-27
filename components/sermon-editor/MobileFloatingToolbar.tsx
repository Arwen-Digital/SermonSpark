import { theme } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FORMAT_CONFIGS, FormatType } from './FormattingToolbar';

interface MobileFloatingToolbarProps {
  onFormatPress: (format: FormatType) => void;
  visible: boolean;
  hasSelection: boolean;
  selectionLength?: number;
  enableHapticFeedback?: boolean;
  compactMode?: boolean;
}

export const MobileFloatingToolbar: React.FC<MobileFloatingToolbarProps> = ({
  onFormatPress,
  visible,
  hasSelection,
  selectionLength = 0,
  enableHapticFeedback = true,
  compactMode = false,
}) => {
  const [slideAnim] = useState(new Animated.Value(visible ? 0 : -100));
  const [pressedButton, setPressedButton] = useState<FormatType | null>(null);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

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

  if (!visible) return null;

  const handleFormatPress = async (format: FormatType) => {
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
  };

  // Determine which buttons to show based on selection and screen size
  const getToolbarButtons = (): FormatType[] => {
    const baseButtons: FormatType[] = ['bold', 'italic', 'highlight'];
    const extendedButtons: FormatType[] = ['heading2', 'heading3', 'quote', 'code'];
    
    if (compactMode || screenWidth < 350) {
      return baseButtons;
    }
    
    if (hasSelection) {
      return [...baseButtons, 'strikethrough', 'code', 'link'];
    }
    
    return [...baseButtons, ...extendedButtons];
  };

  const toolbarButtons = getToolbarButtons();

  const renderButton = (format: FormatType) => {
    const isPressed = pressedButton === format;
    const config = FORMAT_CONFIGS[format];
    
    return (
      <Pressable 
        key={format}
        style={[
          styles.button,
          isPressed && styles.buttonPressed,
          compactMode && styles.buttonCompact
        ]} 
        onPress={() => handleFormatPress(format)}
        accessibilityLabel={`${format} formatting`}
        accessibilityHint={`Apply ${format} formatting to selected text`}
        accessibilityRole="button"
      >
        {format === 'bold' && <Text style={styles.boldButtonText}>B</Text>}
        {format === 'italic' && <Text style={styles.italicButtonText}>I</Text>}
        {format === 'strikethrough' && <Text style={styles.strikethroughButtonText}>S</Text>}
        {format === 'heading2' && <Text style={styles.headingButtonText}>H2</Text>}
        {format === 'heading3' && <Text style={styles.headingButtonText}>H3</Text>}
        {format === 'highlight' && <Ionicons name="color-fill" size={16} color={theme.colors.warning} />}
        {format === 'quote' && <Ionicons name="chatbox-outline" size={16} color={theme.colors.textPrimary} />}
        {format === 'code' && <Ionicons name="code" size={16} color={theme.colors.textPrimary} />}
        {format === 'link' && <Ionicons name="link" size={16} color={theme.colors.primary} />}
      </Pressable>
    );
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          {hasSelection 
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
        contentContainerStyle={styles.content}
        bounces={false}
        decelerationRate="fast"
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
  boldButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  italicButtonText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: theme.colors.textPrimary,
  },
  strikethroughButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textDecorationLine: 'line-through',
  },
  headingButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
});