export const theme = {
  colors: {
    // Primary colors (minimal red usage)
    primary: '#4A5568', // Dark gray for main elements
    primaryLight: '#718096', // Medium gray
    primaryDark: '#2D3748', // Very dark gray
    
    // Red accent (minimal usage only)
    accent: '#FF4444', // Red accent like YouVersion - use sparingly
    accentLight: '#FF6666', // Light red
    accentDark: '#CC3333', // Dark red
    
    // Secondary colors (neutral grays)
    secondary: '#666666', // Medium gray
    secondaryLight: '#999999', // Light gray
    secondaryDark: '#333333', // Dark gray
    
    
    // Neutral colors (clean grays)
    white: '#FFFFFF',
    black: '#000000',
    gray100: '#FAFAFA', // Very light gray
    gray200: '#F5F5F5', // Light gray
    gray300: '#EEEEEE', // Medium light gray
    gray400: '#DDDDDD', // Medium gray
    gray500: '#999999', // Gray
    gray600: '#666666', // Dark gray
    gray700: '#333333', // Very dark gray
    gray800: '#1F1F1F', // Almost black
    gray900: '#000000', // Pure black
    
    // Semantic colors
    success: '#28A745',
    successLight: '#34CE57',
    error: '#DC3545',
    errorLight: '#E74C3C',
    warning: '#FFC107',
    warningLight: '#FFD43B',
    info: '#17A2B8',
    infoLight: '#20C997',
    
    // Background colors (clean and minimal)
    background: '#F7F7F7', // Light gray like YouVersion
    backgroundSecondary: '#EEEEEE', // Slightly darker gray
    surface: '#FFFFFF', // Pure white for cards
    surfaceSecondary: '#FAFAFA', // Very light gray
    
    // Text colors (high contrast)
    textPrimary: '#1F1F1F', // Almost black
    textSecondary: '#666666', // Medium gray
    textTertiary: '#999999', // Light gray
    textOnPrimary: '#FFFFFF', // White on red
    textOnSecondary: '#FFFFFF', // White on gray
    
    // Premium feature indicator
    premium: '#FFD700',
    premiumDark: '#FFA500',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    round: 50,
  },
  
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
    },
    h2: {
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 36,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    h5: {
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 26,
    },
    h6: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 24,
    },
    body1: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 22,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 18,
    },
    button: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
    },
    overline: {
      fontSize: 10,
      fontWeight: '500',
      lineHeight: 16,
      textTransform: 'uppercase' as const,
    },
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

export type Theme = typeof theme;