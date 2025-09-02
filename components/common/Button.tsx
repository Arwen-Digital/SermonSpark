import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/Theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'premium';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode | string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    (disabled || loading) && styles.disabled,
    style,
  ];

  const buttonTextStyle = [
    styles.text,
    styles[`${variant}_text`],
    styles[`text_${size}`],
    textStyle,
  ];

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon !== 'string') return icon;
    const color = getIconColor(variant);
    return <Ionicons name={icon as any} size={16} color={color} />;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        buttonStyle,
        pressed && !disabled && !loading && styles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={getSpinnerColor(variant)} size="small" />
      ) : (
        <>
          {renderIcon()}
          <Text style={buttonTextStyle}>{title}</Text>
        </>
      )}
    </Pressable>
  );
};

const getSpinnerColor = (variant: string) => {
  switch (variant) {
    case 'primary':
    case 'premium':
      return theme.colors.white;
    case 'secondary':
      return theme.colors.white;
    default:
      return theme.colors.primary;
  }
};

const getIconColor = (variant: string) => {
  switch (variant) {
    case 'primary':
    case 'premium':
    case 'secondary':
      return theme.colors.white;
    case 'outline':
    case 'ghost':
    default:
      return theme.colors.primary;
  }
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  
  // Variants
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  premium: {
    backgroundColor: theme.colors.premium,
  },
  
  // Sizes
  size_sm: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  size_md: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  size_lg: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  
  // Text styles
  text: {
    ...theme.typography.button,
    textAlign: 'center',
  },
  primary_text: {
    color: theme.colors.textOnPrimary,
  },
  secondary_text: {
    color: theme.colors.textOnSecondary,
  },
  outline_text: {
    color: theme.colors.primary,
  },
  ghost_text: {
    color: theme.colors.primary,
  },
  premium_text: {
    color: theme.colors.black,
  },
  
  // Text sizes
  text_sm: {
    fontSize: 12,
  },
  text_md: {
    fontSize: 14,
  },
  text_lg: {
    fontSize: 16,
  },
  
  // States
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },
});
