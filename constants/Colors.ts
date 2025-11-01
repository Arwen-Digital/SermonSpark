/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * Spiritual theme: Deep purple for spiritual depth, warm gold for divine light, soft neutrals
 */

const tintColorLight = '#B8860B'; // Warm gold accent
const tintColorDark = '#DAA520'; // Lighter gold for dark mode

export const Colors = {
  light: {
    text: '#2D1B3D', // Deep purple-black for content
    background: '#F5F0F9', // Soft purple-tinged background
    tint: tintColorLight,
    icon: '#6B5B7D', // Medium purple-gray for icons
    tabIconDefault: '#9B8DA8', // Light purple for inactive tabs
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F5E6FF',
    background: '#1A1125', // Deep purple background
    tint: tintColorDark,
    icon: '#B8A9C8',
    tabIconDefault: '#6B5B7D',
    tabIconSelected: tintColorDark,
  },
};
