/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#FF4444'; // Red accent - use sparingly
const tintColorDark = '#FF6666'; // Lighter red for dark mode

export const Colors = {
  light: {
    text: '#1F1F1F', // Almost black for readability
    background: '#F7F7F7', // Light gray background like YouVersion
    tint: tintColorLight,
    icon: '#666666', // Medium gray for icons
    tabIconDefault: '#999999', // Light gray for inactive tabs
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#FFFFFF',
    background: '#1F1F1F',
    tint: tintColorDark,
    icon: '#CCCCCC',
    tabIconDefault: '#666666',
    tabIconSelected: tintColorDark,
  },
};
