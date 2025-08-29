export const theme = {
  colors: {
    // Primary colors (Christian-inspired)
    primary: '#2E5C8A', // Deep blue
    primaryLight: '#4A7BA7',
    primaryDark: '#1E3F5A',
    
    // Secondary colors
    secondary: '#8B5A3C', // Warm brown
    secondaryLight: '#A67C52',
    secondaryDark: '#5D3D28',
    
    // Accent colors
    accent: '#D4AF37', // Gold
    accentLight: '#E6C866',
    accentDark: '#B8941F',
    
    // Neutral colors
    white: '#FFFFFF',
    black: '#1A1A1A',
    gray100: '#F8F9FA',
    gray200: '#E9ECEF',
    gray300: '#DEE2E6',
    gray400: '#CED4DA',
    gray500: '#ADB5BD',
    gray600: '#6C757D',
    gray700: '#495057',
    gray800: '#343A40',
    gray900: '#212529',
    
    // Semantic colors
    success: '#28A745',
    successLight: '#34CE57',
    error: '#DC3545',
    errorLight: '#E74C3C',
    warning: '#FFC107',
    warningLight: '#FFD43B',
    info: '#17A2B8',
    infoLight: '#20C997',
    
    // Background colors
    background: '#F8F9FA',
    backgroundSecondary: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSecondary: '#F5F5F5',
    
    // Text colors
    textPrimary: '#212529',
    textSecondary: '#6C757D',
    textTertiary: '#ADB5BD',
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',
    
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