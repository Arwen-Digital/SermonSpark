export const theme = {
  colors: {
    // Primary colors (deep purple - spiritual depth)
    primary: '#4B2A5E', // Deep purple for main elements
    primaryLight: '#6B5B7D', // Medium purple
    primaryDark: '#2D1B3D', // Very deep purple
    
    // Gold accent (divine light)
    accent: '#B8860B', // Warm gold accent
    accentLight: '#DAA520', // Light gold
    accentDark: '#8B6914', // Dark gold
    
    // Secondary colors (purple-gray neutrals)
    secondary: '#7B6B8D', // Medium purple-gray
    secondaryLight: '#9B8DA8', // Light purple-gray
    secondaryDark: '#5B4B6D', // Dark purple-gray
    
    // Purple gradient colors
    purpleDeep: '#2D1B3D', // Deepest purple
    purpleMid: '#4B2A5E', // Mid purple
    purpleLight: '#6B5B7D', // Light purple
    purplePale: '#E8E0F0', // Pale purple
    purpleBackground: '#F5F0F9', // Background purple
    
    // Gold gradient colors
    goldDeep: '#8B6914', // Deep gold
    goldMid: '#B8860B', // Mid gold
    goldLight: '#DAA520', // Light gold
    goldPale: '#F5E6D3', // Pale gold
    
    // Neutral colors (soft grays with purple tint)
    white: '#FFFFFF',
    black: '#1A1125', // Deep purple-black
    gray100: '#F9F7FB', // Very light purple-gray
    gray200: '#F5F0F9', // Light purple-gray
    gray300: '#E8E0F0', // Medium light purple-gray
    gray400: '#D4C8DD', // Medium purple-gray
    gray500: '#9B8DA8', // Purple-gray
    gray600: '#6B5B7D', // Dark purple-gray
    gray700: '#4B2A5E', // Very dark purple
    gray800: '#2D1B3D', // Deep purple
    gray900: '#1A1125', // Deepest purple
    
    // Semantic colors
    success: '#4A8B5E',
    successLight: '#6BA874',
    error: '#8B4A4A',
    errorLight: '#A76666',
    warning: '#DAA520',
    warningLight: '#F5C842',
    info: '#5B7D9B',
    infoLight: '#7BA8C4',
    
    // Background colors (soft spiritual)
    background: '#F5F0F9', // Soft purple-tinged background
    backgroundSecondary: '#E8E0F0', // Secondary background
    surface: '#FFFFFF', // Pure white for cards
    surfaceSecondary: '#F9F7FB', // Very light surface
    
    // Text colors
    textPrimary: '#2D1B3D', // Deep purple-black
    textSecondary: '#6B5B7D', // Medium purple-gray
    textTertiary: '#9B8DA8', // Light purple-gray
    textOnPrimary: '#FFFFFF', // White on purple
    textOnSecondary: '#FFFFFF', // White on gold
    
    // Premium feature indicator
    premium: '#B8860B', // Gold
    premiumDark: '#8B6914', // Dark gold
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
      boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
      elevation: 1,
    },
    md: {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
      elevation: 2,
    },
    lg: {
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
      elevation: 4,
    },
    xl: {
      boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.12)',
      elevation: 8,
    },
  },
};

export type Theme = typeof theme;