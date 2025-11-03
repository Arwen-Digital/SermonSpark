import { Platform, StyleSheet } from 'react-native';
import { theme } from '@/constants/Theme';

/**
 * Platform-aware modal styles for research result modals.
 * On Android, modals open to near full-screen (95% height).
 * On iOS with pageSheet, modals use the default sheet behavior.
 */
const androidModalMaxHeight = '95%';
const iosModalMaxHeight = '85%';

// Scrollable content area - platform-aware height
const androidScrollMaxHeight = '70%';
const iosScrollMaxHeight = '55%';

// Export default styles object for easy importing
const styles = StyleSheet.create({
  // Modal overlay - positions the modal at the bottom on Android
  resultOverlay: {
    flex: 1,
    justifyContent: Platform.OS === 'android' ? 'center' as const : 'flex-end' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingTop: Platform.OS === 'android' ? '2.5%' : undefined,
    paddingBottom: Platform.OS === 'android' ? '2.5%' : undefined,
    paddingHorizontal: Platform.OS === 'android' ? '2.5%' : undefined,
  },

  // Backdrop - full screen touchable overlay
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  // Sheet container for iOS pageSheet mode
  sheetContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingTop: 0,
  },

  // Modal content - the actual modal/sheet with platform-aware height
  resultModalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    width: '100%',
    height: Platform.OS === 'android' ? '95%' : undefined,
    maxHeight: Platform.OS === 'android' ? '95%' : iosModalMaxHeight,
    flexGrow: 1,
    flex: 1,
    flexDirection: 'column' as const,
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },

  // Sheet content for iOS pageSheet mode - uses full height
  resultModalContentSheet: {
    flex: 1,
    alignSelf: 'center' as const,
    width: '100%',
    maxWidth: 720,
    maxHeight: undefined,
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },

  // Modal header
  resultModalHeader: {
    flexDirection: 'row' as const,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'space-between' as const,
    marginBottom: theme.spacing.md,
  },

  resultModalTitle: {
    ...theme.typography.h5,
    color: theme.colors.textPrimary,
    fontWeight: '600' as const,
  },

  modalCloseButton: {
    padding: theme.spacing.xs,
  },

  modalCloseButtonDisabled: {
    opacity: 0.4,
  },

  // Loading state
  thinkingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: theme.spacing.xxl,
    minHeight: 200,
  },

  thinkingText: {
    ...theme.typography.body1,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },

  // Error state
  errorContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.error + '15',
    borderRadius: theme.borderRadius.md,
    margin: theme.spacing.md,
    flexShrink: 0,
  },

  errorText: {
    ...theme.typography.body2,
    color: theme.colors.error,
    flex: 1,
  },

  // Container for modals that don't use overlay pattern (like topic-explorer)
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  resultScroll: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.white,
    maxHeight: Platform.OS === 'android' ? undefined : '55%',
    marginBottom: theme.spacing.md,
  },

  resultScrollSheet: {
    maxHeight: undefined,
    flex: 1,
  },

  resultScrollContent: {
    padding: theme.spacing.md,
  },

  resultButtonRow: {
    flexDirection: 'row' as const,
    flexShrink: 0,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray200,
    backgroundColor: theme.colors.surface,
  },

  resultButton: {
    flex: 1,
  },
});

export default styles;

// Re-export individual styles for convenience
export const resultOverlay = styles.resultOverlay;
export const backdrop = styles.backdrop;
export const sheetContainer = styles.sheetContainer;
export const resultModalContent = styles.resultModalContent;
export const resultModalContentSheet = styles.resultModalContentSheet;
export const resultModalHeader = styles.resultModalHeader;
export const resultModalTitle = styles.resultModalTitle;
export const modalCloseButton = styles.modalCloseButton;
export const modalCloseButtonDisabled = styles.modalCloseButtonDisabled;
export const thinkingContainer = styles.thinkingContainer;
export const thinkingText = styles.thinkingText;
export const errorContainer = styles.errorContainer;
export const errorText = styles.errorText;
export const modalContainer = styles.modalContainer;
export const resultScroll = styles.resultScroll;
export const resultScrollSheet = styles.resultScrollSheet;
export const resultScrollContent = styles.resultScrollContent;
export const resultButtonRow = styles.resultButtonRow;
export const resultButton = styles.resultButton;

