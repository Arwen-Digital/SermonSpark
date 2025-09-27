import { theme } from '@/constants/Theme';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ViewStyle, useWindowDimensions } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { FORMAT_CONFIGS, FormatType } from './FormattingToolbar';
import { PerformanceConfig, PerformanceOptimizer, useDebouncedUpdate, useEfficientRerender, useLazyLoading, useMemoryCleanup, usePerformanceMetrics, useVirtualization } from './PerformanceOptimizer';

interface MarkdownEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectionChange?: (selection: { start: number; end: number }) => void;
  placeholder?: string;
  viewMode?: 'markup' | 'formatted';
  onViewModeChange?: (mode: 'markup' | 'formatted') => void;
  style?: ViewStyle;
  testID?: string;
  // Platform-specific props
  enableKeyboardShortcuts?: boolean;
  optimizeForLargeDocuments?: boolean;
  touchOptimizations?: boolean;
  // Enhanced platform-specific props
  webScrollBehavior?: 'smooth' | 'auto';
  mobileKeyboardBehavior?: 'resize' | 'pan';
  tabletLayoutOptimizations?: boolean;
  accessibilityOptimizations?: boolean;
  // Performance optimization props
  performanceConfig?: Partial<PerformanceConfig>;
  onPerformanceWarning?: (warning: string) => void;
}

export interface MarkdownEditorHandle {
  focus: () => void;
  blur: () => void;
  insertText: (text: string) => void;
  wrapSelection: (before: string, after: string) => void;
  applyFormat: (format: FormatType) => void;
  getSelection: () => { start: number; end: number };
  setSelection: (start: number, end: number) => void;
}

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  ({ 
    value, 
    onChangeText, 
    onSelectionChange, 
    placeholder, 
    viewMode = 'markup',
    onViewModeChange,
    style, 
    testID,
    enableKeyboardShortcuts = true,
    optimizeForLargeDocuments = true,
    touchOptimizations = true,
    webScrollBehavior = 'smooth',
    mobileKeyboardBehavior = 'resize',
    tabletLayoutOptimizations = true,
    accessibilityOptimizations = true,
    performanceConfig = {},
    onPerformanceWarning
  }, ref) => {
    const textInputRef = useRef<TextInput>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const [selection, setSelection] = useState({ start: 0, end: 0 });
    const [savedCursorPosition, setSavedCursorPosition] = useState(0);
    const [savedScrollPosition, setSavedScrollPosition] = useState(0);
    const scrollPositionRef = useRef(0);
    const scrollUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const selectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { width, height } = useWindowDimensions();

    // Performance optimization hooks
    const finalPerformanceConfig = useMemo(() => ({
      enableLazyLoading: true,
      enableVirtualization: true,
      enableMemoryMonitoring: true,
      maxDocumentSize: 100000,
      renderThreshold: 50000,
      memoryThreshold: 100,
      debounceDelay: optimizeForLargeDocuments && value.length > 50000 ? 200 : 100,
      ...performanceConfig,
    }), [performanceConfig, optimizeForLargeDocuments, value.length]);

    const { metrics, startRenderTracking, endRenderTracking } = usePerformanceMetrics(value.length);
    const { visibleContent, isLazyLoaded } = useLazyLoading(value, finalPerformanceConfig);
    const debouncedValue = useDebouncedUpdate(value, finalPerformanceConfig.debounceDelay);
    const { virtualizedContent, updateScrollOffset, isVirtualized } = useVirtualization(
      visibleContent, 
      finalPerformanceConfig, 
      height
    );
    const { addCleanupCallback, cleanup } = useMemoryCleanup();

    // Use efficient re-rendering for large documents, but not on web to avoid cursor jumping
    const optimizedValue = useEfficientRerender(
      isVirtualized ? virtualizedContent : (isLazyLoaded ? visibleContent : value),
      (prev, next) => prev === next
    );
    
    // Enhanced platform and screen size detection
    const isWeb = Platform.OS === 'web';
    const isIOS = Platform.OS === 'ios';
    const isAndroid = Platform.OS === 'android';
    const isTablet = Math.min(width, height) >= 768;
    const isLargeScreen = Math.min(width, height) >= 1024;
    const isSmallScreen = Math.min(width, height) < 480;
    const isLandscape = width > height;
    const isLargeDocument = optimizeForLargeDocuments && value.length > 10000;
    const isVeryLargeDocument = optimizeForLargeDocuments && value.length > 50000;
    const isExtremelyLargeDocument = optimizeForLargeDocuments && value.length > finalPerformanceConfig.maxDocumentSize;
    
    // On web, use the actual value to prevent cursor jumping issues
    // On mobile, use optimized value for better performance
    const displayValue = isWeb ? value : optimizedValue;
    
    // Device-specific optimizations
    const shouldUseReducedAnimations = isVeryLargeDocument || isSmallScreen;
    const shouldOptimizeTouch = touchOptimizations && (isIOS || isAndroid);
    const shouldUseTabletLayout = tabletLayoutOptimizations && isTablet;

    // Enhanced web keyboard shortcuts handler
    const handleKeyDown = (event: any) => {
      if (!isWeb || !enableKeyboardShortcuts) return;
      
      const { key, ctrlKey, metaKey, shiftKey, altKey } = event.nativeEvent || event;
      const isModifierPressed = ctrlKey || metaKey;
      
      // Handle standard formatting shortcuts
      if (isModifierPressed && !shiftKey && !altKey) {
        switch (key.toLowerCase()) {
          case 'b':
            event.preventDefault();
            applyFormatRef.current?.('bold');
            break;
          case 'i':
            event.preventDefault();
            applyFormatRef.current?.('italic');
            break;
          case 'u':
            event.preventDefault();
            applyFormatRef.current?.('highlight'); // Use highlight for underline
            break;
          case 'l':
            event.preventDefault();
            applyFormatRef.current?.('list');
            break;
          case 'q':
            event.preventDefault();
            applyFormatRef.current?.('quote');
            break;
          case 'e':
            event.preventDefault();
            applyFormatRef.current?.('code');
            break;
          case 'k':
            event.preventDefault();
            applyFormatRef.current?.('link');
            break;
        }
      }
      
      // Handle heading shortcuts (Ctrl/Cmd + Shift + Number)
      if (isModifierPressed && shiftKey && !altKey) {
        switch (key) {
          case '2':
            event.preventDefault();
            applyFormatRef.current?.('heading2');
            break;
          case '3':
            event.preventDefault();
            applyFormatRef.current?.('heading3');
            break;
        }
      }
      
      // Handle additional shortcuts with Shift
      if (isModifierPressed && shiftKey && !altKey) {
        switch (key.toLowerCase()) {
          case 'l':
            event.preventDefault();
            applyFormatRef.current?.('numberedList');
            break;
          case 's':
            event.preventDefault();
            applyFormatRef.current?.('strikethrough');
            break;
        }
      }
      
      // Handle Tab key for indentation (if not using default behavior)
      if (key === 'Tab' && !isModifierPressed) {
        // Let default behavior handle tab navigation
        // Could add custom indentation logic here if needed
      }
      
      // Handle Escape key to blur editor
      if (key === 'Escape') {
        textInputRef.current?.blur();
      }
    };

    // Create a ref to access applyFormat from keyboard handler
    const applyFormatRef = useRef<((format: FormatType) => void) | null>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        if (isWeb) {
          // On web, use requestAnimationFrame for smoother focus
          requestAnimationFrame(() => {
            textInputRef.current?.focus();
          });
        } else {
          textInputRef.current?.focus();
        }
      },
      blur: () => {
        textInputRef.current?.blur();
      },
      insertText: (text: string) => {
        const { start } = selection;
        const newContent = value.substring(0, start) + text + value.substring(start);
        const newCursorPosition = start + text.length;
        
        onChangeText(newContent);
        
        // Clear any pending selection updates
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
        }
        
        // Platform-specific selection timing
        const selectionDelay = isWeb ? 0 : (isIOS ? 10 : 5);
        
        // Update selection to position cursor after inserted text with platform-optimized delay
        selectionTimeoutRef.current = setTimeout(() => {
          const newSelection = { start: newCursorPosition, end: newCursorPosition };
          setSelection(newSelection);
          textInputRef.current?.setSelection?.(newCursorPosition, newCursorPosition);
          selectionTimeoutRef.current = null;
        }, selectionDelay);
      },
      wrapSelection: (before: string, after: string) => {
        const { start, end } = selection;
        const selectedText = value.substring(start, end);
        
        let newContent: string;
        let newCursorPosition: number;
        
        if (selectedText) {
          // Wrap selected text
          newContent = value.substring(0, start) + before + selectedText + after + value.substring(end);
          newCursorPosition = start + before.length + selectedText.length + after.length;
        } else {
          // Insert at cursor position
          newContent = value.substring(0, start) + before + after + value.substring(start);
          newCursorPosition = start + before.length;
        }
        
        onChangeText(newContent);
        
        // Clear any pending selection updates
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
        }
        
        // Platform-specific selection timing
        const selectionDelay = isWeb ? 0 : (isIOS ? 10 : 5);
        
        // Update selection with platform-optimized delay to avoid interfering with scrolling
        selectionTimeoutRef.current = setTimeout(() => {
          const newSelection = { start: newCursorPosition, end: newCursorPosition };
          setSelection(newSelection);
          textInputRef.current?.setSelection?.(newCursorPosition, newCursorPosition);
          selectionTimeoutRef.current = null;
        }, selectionDelay);
      },
      applyFormat: (format: FormatType) => {
        const config = FORMAT_CONFIGS[format];
        const { start, end } = selection;
        const selectedText = value.substring(start, end);
        
        let newContent: string;
        let newCursorPosition: number;
        
        // Handle line-based formats (headings, lists, quotes)
        if (['heading2', 'heading3', 'list', 'numberedList', 'quote'].includes(format)) {
          // Find the start of the current line
          const lineStart = value.lastIndexOf('\n', start - 1) + 1;
          const lineEnd = value.indexOf('\n', start);
          const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
          const currentLine = value.substring(lineStart, actualLineEnd);
          
          // For list items, handle numbering
          let formatPrefix = config.before;
          if (format === 'numberedList') {
            // Find existing numbered items to determine next number
            const lines = value.substring(0, lineStart).split('\n');
            let lastNumber = 0;
            for (let i = lines.length - 1; i >= 0; i--) {
              const match = lines[i].match(/^(\d+)\.\s/);
              if (match) {
                lastNumber = parseInt(match[1], 10);
                break;
              }
              // Stop if we hit a non-list line
              if (lines[i].trim() && !lines[i].match(/^\s*$/)) {
                break;
              }
            }
            formatPrefix = `${lastNumber + 1}. `;
          }
          
          // Apply format to the line
          const formattedLine = formatPrefix + currentLine;
          newContent = value.substring(0, lineStart) + formattedLine + value.substring(actualLineEnd);
          newCursorPosition = lineStart + formatPrefix.length + (start - lineStart);
        } else {
          // Handle inline formats (bold, italic, highlight)
          if (selectedText) {
            // Wrap selected text
            newContent = value.substring(0, start) + config.before + selectedText + config.after + value.substring(end);
            newCursorPosition = start + config.before.length + selectedText.length + config.after.length;
          } else {
            // Insert placeholder text if no selection
            const placeholder = config.placeholder || '';
            newContent = value.substring(0, start) + config.before + placeholder + config.after + value.substring(start);
            newCursorPosition = start + config.before.length + placeholder.length;
          }
        }
        
        onChangeText(newContent);
        
        // Clear any pending selection updates
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
        }
        
        // Platform-specific selection timing
        const selectionDelay = isWeb ? 0 : (isIOS ? 10 : 5);
        
        // Update selection with platform-optimized delay to avoid interfering with scrolling
        selectionTimeoutRef.current = setTimeout(() => {
          const newSelection = { start: newCursorPosition, end: newCursorPosition };
          setSelection(newSelection);
          textInputRef.current?.setSelection?.(newCursorPosition, newCursorPosition);
          selectionTimeoutRef.current = null;
        }, selectionDelay);
      },
      getSelection: () => selection,
      setSelection: (start: number, end: number) => {
        // Ensure selection bounds are valid
        const textLength = value.length;
        const validStart = Math.max(0, Math.min(start, textLength));
        const validEnd = Math.max(validStart, Math.min(end, textLength));
        
        const newSelection = { start: validStart, end: validEnd };
        setSelection(newSelection);
        
        // Platform-specific selection handling
        if (isWeb) {
          // On web, use requestAnimationFrame for smoother selection
          requestAnimationFrame(() => {
            textInputRef.current?.setSelection?.(validStart, validEnd);
          });
        } else {
          textInputRef.current?.setSelection?.(validStart, validEnd);
        }
      },
    }), [value, selection, onChangeText, isWeb, isIOS]);

    // Set up applyFormat ref for keyboard shortcuts
    useEffect(() => {
      const applyFormatMethod = (format: FormatType) => {
        const config = FORMAT_CONFIGS[format];
        const { start, end } = selection;
        const selectedText = value.substring(start, end);
        
        let newContent: string;
        let newCursorPosition: number;
        
        // Handle line-based formats (headings, lists, quotes)
        if (['heading2', 'heading3', 'list', 'numberedList', 'quote'].includes(format)) {
          // Find the start of the current line
          const lineStart = value.lastIndexOf('\n', start - 1) + 1;
          const lineEnd = value.indexOf('\n', start);
          const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
          const currentLine = value.substring(lineStart, actualLineEnd);
          
          // For list items, handle numbering
          let formatPrefix = config.before;
          if (format === 'numberedList') {
            // Find existing numbered items to determine next number
            const lines = value.substring(0, lineStart).split('\n');
            let lastNumber = 0;
            for (let i = lines.length - 1; i >= 0; i--) {
              const match = lines[i].match(/^(\d+)\.\s/);
              if (match) {
                lastNumber = parseInt(match[1], 10);
                break;
              }
              // Stop if we hit a non-list line
              if (lines[i].trim() && !lines[i].match(/^\s*$/)) {
                break;
              }
            }
            formatPrefix = `${lastNumber + 1}. `;
          }
          
          // Apply format to the line
          const formattedLine = formatPrefix + currentLine;
          newContent = value.substring(0, lineStart) + formattedLine + value.substring(actualLineEnd);
          newCursorPosition = lineStart + formatPrefix.length + (start - lineStart);
        } else {
          // Handle inline formats (bold, italic, highlight)
          if (selectedText) {
            // Wrap selected text
            newContent = value.substring(0, start) + config.before + selectedText + config.after + value.substring(end);
            newCursorPosition = start + config.before.length + selectedText.length + config.after.length;
          } else {
            // Insert placeholder text if no selection
            const placeholder = config.placeholder || '';
            newContent = value.substring(0, start) + config.before + placeholder + config.after + value.substring(start);
            newCursorPosition = start + config.before.length + placeholder.length;
          }
        }
        
        onChangeText(newContent);
        
        // Clear any pending selection updates
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
        }
        
        // Platform-specific selection timing
        const selectionDelay = isWeb ? 0 : (isIOS ? 10 : 5);
        
        // Update selection with platform-optimized delay to avoid interfering with scrolling
        selectionTimeoutRef.current = setTimeout(() => {
          const newSelection = { start: newCursorPosition, end: newCursorPosition };
          setSelection(newSelection);
          textInputRef.current?.setSelection?.(newCursorPosition, newCursorPosition);
          selectionTimeoutRef.current = null;
        }, selectionDelay);
      };
      
      applyFormatRef.current = applyFormatMethod;
    }, [value, selection, onChangeText, isWeb, isIOS]);

    // Optimized text change handler with performance monitoring
    const handleOptimizedTextChange = useCallback((text: string) => {
      startRenderTracking();
      
      // On web, always update immediately to prevent cursor jumping
      if (isWeb) {
        onChangeText(text);
        endRenderTracking();
        return;
      }
      
      // For extremely large documents on mobile, use more aggressive debouncing
      if (isExtremelyLargeDocument) {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
          onChangeText(text);
          endRenderTracking();
        }, finalPerformanceConfig.debounceDelay * 2);
      } else {
        onChangeText(text);
        endRenderTracking();
      }
    }, [onChangeText, isWeb, isExtremelyLargeDocument, finalPerformanceConfig.debounceDelay, startRenderTracking, endRenderTracking]);

    const handleSelectionChange = useCallback((event: { nativeEvent: { selection: { start: number; end: number } } }) => {
      const { start, end } = event.nativeEvent.selection;
      
      // Ensure selection bounds are valid
      const textLength = displayValue.length;
      const validStart = Math.max(0, Math.min(start, textLength));
      const validEnd = Math.max(validStart, Math.min(end, textLength));
      
      const newSelection = { start: validStart, end: validEnd };
      setSelection(newSelection);
      onSelectionChange?.(newSelection);

      // Update scroll offset for virtualization
      if (isVirtualized) {
        const lineHeight = 24;
        const scrollOffset = validStart * lineHeight / displayValue.length;
        updateScrollOffset(scrollOffset);
      }

      // Mobile-specific: Auto-scroll to cursor position to avoid keyboard blocking
      if ((isIOS || isAndroid) && textInputRef.current) {
        // Calculate approximate cursor position
        const textBeforeCursor = displayValue.substring(0, validStart);
        const lineHeight = 24;
        const linesBeforeCursor = textBeforeCursor.split('\n').length;
        const approximateCursorY = linesBeforeCursor * lineHeight;
        
        // If cursor is likely to be blocked by keyboard, scroll to it
        if (approximateCursorY > height * 0.5) {
          // Use a small delay to ensure the keyboard animation has started
          setTimeout(() => {
            if (textInputRef.current && 'scrollTo' in textInputRef.current) {
              (textInputRef.current as any).scrollTo?.({
                y: Math.max(0, approximateCursorY - height * 0.3),
                animated: true,
              });
            }
          }, 100);
        }
      }
    }, [displayValue.length, onSelectionChange, isVirtualized, updateScrollOffset, isIOS, isAndroid, displayValue, height]);

    // Debounced scroll position update to prevent wiggling
    const updateScrollPosition = useCallback((scrollY: number) => {
      scrollPositionRef.current = scrollY;
      
      // Clear existing timeout
      if (scrollUpdateTimeoutRef.current) {
        clearTimeout(scrollUpdateTimeoutRef.current);
      }
      
      // Debounce the scroll position update
      scrollUpdateTimeoutRef.current = setTimeout(() => {
        setSavedScrollPosition(scrollPositionRef.current);
      }, 150); // 150ms debounce to reduce frequent updates
    }, []);

    // Save cursor and scroll position when switching modes
    const handleModeSwitch = useCallback(() => {
      if (viewMode === 'markup') {
        // Switching from markup to preview - save cursor position and scroll position
        setSavedCursorPosition(selection.start);
        
        // Get current scroll position from TextInput
        if (textInputRef.current && 'scrollTo' in textInputRef.current) {
          // For TextInput, we need to estimate scroll position based on cursor
          const lineHeight = 24;
          const textBeforeCursor = displayValue.substring(0, selection.start);
          const linesBeforeCursor = textBeforeCursor.split('\n').length;
          const estimatedScrollY = Math.max(0, (linesBeforeCursor - 5) * lineHeight); // Keep some context above
          setSavedScrollPosition(estimatedScrollY);
        }
      } else {
        // Switching from preview to markup - save scroll position from ScrollView
        if (scrollViewRef.current) {
          // We'll handle this in the scroll event handler
        }
      }
    }, [viewMode, selection.start, displayValue]);

    // Restore cursor and scroll position when switching modes
    React.useEffect(() => {
      if (viewMode === 'markup') {
        // Switching to markup mode - restore cursor and scroll position
        requestAnimationFrame(() => {
          if (savedCursorPosition > 0) {
            textInputRef.current?.setSelection?.(savedCursorPosition, savedCursorPosition);
            setSelection({ start: savedCursorPosition, end: savedCursorPosition });
          }
          
          // Restore scroll position in TextInput
          if (savedScrollPosition > 0 && textInputRef.current && 'scrollTo' in textInputRef.current) {
            setTimeout(() => {
              (textInputRef.current as any).scrollTo?.({
                y: savedScrollPosition,
                animated: false, // Use false for immediate positioning
              });
            }, 50); // Small delay to ensure TextInput is ready
          }
        });
      } else {
        // Switching to preview mode - restore scroll position in ScrollView
        requestAnimationFrame(() => {
          if (savedScrollPosition > 0 && scrollViewRef.current) {
            setTimeout(() => {
              scrollViewRef.current?.scrollTo({
                y: savedScrollPosition,
                animated: false, // Use false for immediate positioning
              });
            }, 50); // Small delay to ensure ScrollView is ready
          }
        });
      }
    }, [viewMode, savedCursorPosition, savedScrollPosition]);

    // Call mode switch handler when viewMode changes
    React.useEffect(() => {
      handleModeSwitch();
    }, [handleModeSwitch, viewMode]);

    // Click-to-edit handler for preview mode
    const handlePreviewPress = useCallback((event: any) => {
      if (viewMode !== 'formatted' || !onViewModeChange) return;
      
      // Switch to markup mode
      onViewModeChange('markup');
      
      // Try to estimate cursor position from click coordinates
      // This is a simplified approach - in a real implementation you might want more sophisticated positioning
      const clickY = event?.nativeEvent?.locationY || 0;
      const lineHeight = 24;
      const approximateLine = Math.floor(clickY / lineHeight);
      
      // Estimate character position based on line
      const lines = displayValue.split('\n');
      let estimatedPosition = 0;
      
      for (let i = 0; i < Math.min(approximateLine, lines.length - 1); i++) {
        estimatedPosition += lines[i].length + 1; // +1 for newline
      }
      
      // Add some characters for the current line (rough estimate)
      if (approximateLine < lines.length) {
        const currentLine = lines[approximateLine] || '';
        estimatedPosition += Math.min(currentLine.length, Math.floor(currentLine.length / 2));
      }
      
      // Ensure position is within bounds
      estimatedPosition = Math.max(0, Math.min(estimatedPosition, displayValue.length));
      
      // Set the cursor position after switching modes
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.setSelection?.(estimatedPosition, estimatedPosition);
          setSelection({ start: estimatedPosition, end: estimatedPosition });
          textInputRef.current.focus();
        }
      }, 100); // Small delay to ensure mode switch is complete
    }, [viewMode, onViewModeChange, displayValue]);

    // Performance monitoring and warnings
    useEffect(() => {
      if (metrics.memoryUsage > finalPerformanceConfig.memoryThreshold) {
        onPerformanceWarning?.(`High memory usage: ${metrics.memoryUsage.toFixed(1)}MB`);
      }
      
      if (metrics.renderTime > 100) {
        onPerformanceWarning?.(`Slow rendering detected: ${metrics.renderTime.toFixed(1)}ms`);
      }
      
      if (metrics.frameDrops > 10) {
        onPerformanceWarning?.(`Frame drops detected: ${metrics.frameDrops} frames`);
      }
    }, [metrics, finalPerformanceConfig.memoryThreshold, onPerformanceWarning]);

    // Memory cleanup registration
    useEffect(() => {
      addCleanupCallback(() => {
        if (selectionTimeoutRef.current) {
          clearTimeout(selectionTimeoutRef.current);
          selectionTimeoutRef.current = null;
        }
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
          debounceTimeoutRef.current = null;
        }
        if (scrollUpdateTimeoutRef.current) {
          clearTimeout(scrollUpdateTimeoutRef.current);
          scrollUpdateTimeoutRef.current = null;
        }
      });
    }, [addCleanupCallback]);

    // Cleanup timeouts on unmount
    React.useEffect(() => {
      return () => {
        cleanup();
      };
    }, [cleanup]);

    if (viewMode === 'formatted') {
      // Get platform-specific ScrollView props with enhanced optimizations
      const getScrollViewProps = () => {
        const baseProps = {
          ref: scrollViewRef,
          style: styles.previewContainer,
          contentContainerStyle: [
            styles.previewContent,
            shouldUseTabletLayout && styles.previewContentTablet,
            isLargeScreen && styles.previewContentLargeScreen,
            isSmallScreen && styles.previewContentSmallScreen,
            isLandscape && shouldUseTabletLayout && styles.previewContentLandscape,
          ],
          showsVerticalScrollIndicator: !isVeryLargeDocument,
          testID,
          // Track scroll position for mode switching
          onScroll: (event: any) => {
            try {
              const scrollY = event?.nativeEvent?.contentOffset?.y;
              if (typeof scrollY === 'number' && !isNaN(scrollY)) {
                updateScrollPosition(scrollY);
              }
            } catch (error) {
              // Silently handle scroll tracking errors
              console.warn('Scroll tracking error in preview mode:', error);
            }
          },
          scrollEventThrottle: 100, // Reduce frequency to prevent wiggling
          // Accessibility optimizations
          ...(accessibilityOptimizations && {
            accessible: true,
            accessibilityRole: 'scrollbar' as const,
            accessibilityLabel: 'Sermon preview',
            accessibilityHint: 'Scroll to view formatted sermon content',
          }),
        };

        // Performance optimizations for large documents
        if (isVeryLargeDocument && optimizeForLargeDocuments) {
          return {
            ...baseProps,
            removeClippedSubviews: true,
            scrollEventThrottle: shouldUseReducedAnimations ? 32 : 16,
            decelerationRate: 'normal' as const,
            // Reduce memory usage for very large documents
            maintainVisibleContentPosition: {
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 100,
            },
          };
        }

        // iOS-specific optimizations
        if (isIOS) {
          return {
            ...baseProps,
            bounces: !shouldUseReducedAnimations,
            alwaysBounceVertical: false,
            scrollEventThrottle: shouldUseReducedAnimations ? 32 : 16,
            decelerationRate: shouldUseReducedAnimations ? 'normal' as const : 'fast' as const,
            // iOS-specific scroll behavior
            automaticallyAdjustContentInsets: false,
            contentInsetAdjustmentBehavior: 'never' as const,
            keyboardDismissMode: 'interactive' as const,
          };
        }

        // Android-specific optimizations
        if (isAndroid) {
          return {
            ...baseProps,
            overScrollMode: shouldUseReducedAnimations ? 'never' as const : 'auto' as const,
            scrollEventThrottle: shouldUseReducedAnimations ? 32 : 16,
            nestedScrollEnabled: true,
            // Android-specific performance optimizations
            ...(isVeryLargeDocument && {
              removeClippedSubviews: true,
              persistentScrollbar: false,
            }),
          };
        }

        // Web-specific optimizations
        if (isWeb) {
          return {
            ...baseProps,
            scrollEventThrottle: shouldUseReducedAnimations ? 16 : 8,
            // Web-specific scroll behavior
            style: [
              baseProps.style,
              webScrollBehavior === 'smooth' && styles.previewContainerWebSmooth,
            ],
          };
        }

        return baseProps;
      };

      return (
        <PerformanceOptimizer 
          config={finalPerformanceConfig}
          onPerformanceWarning={onPerformanceWarning}
        >
          <View style={[styles.container, style]}>
            <Pressable onPress={handlePreviewPress} style={styles.previewPressable}>
              <ScrollView {...getScrollViewProps()}>
                <Markdown 
                  style={markdownStyles}
                  rules={customRules}
                >
                  {displayValue || placeholder || ''}
                </Markdown>
              </ScrollView>
            </Pressable>
          </View>
        </PerformanceOptimizer>
      );
    }

    // Get platform-specific TextInput props with enhanced optimizations
    const getPlatformSpecificProps = () => {
      const baseProps: any = {
        ref: textInputRef,
        value: displayValue,
        onChangeText: handleOptimizedTextChange,
        onSelectionChange: handleSelectionChange,
        placeholder,
        placeholderTextColor: theme.colors.textTertiary,
        multiline: true,
        textAlignVertical: 'top' as const,
        selectionColor: theme.colors.primary,
        style: [
          styles.textInput,
          shouldUseTabletLayout && styles.textInputTablet,
          isLargeScreen && styles.textInputLargeScreen,
          isSmallScreen && styles.textInputSmallScreen,
          isLandscape && shouldUseTabletLayout && styles.textInputLandscape,
          isLargeDocument && styles.textInputLargeDocument,
          isVeryLargeDocument && styles.textInputVeryLargeDocument,
          isExtremelyLargeDocument && styles.textInputExtremelyLargeDocument,
        ],
        scrollEnabled: true,
        showsVerticalScrollIndicator: !isVeryLargeDocument,
        testID,
        // Track scroll position for mode switching
        onScroll: (event: any) => {
          try {
            const scrollY = event?.nativeEvent?.contentOffset?.y;
            if (typeof scrollY === 'number' && !isNaN(scrollY)) {
              updateScrollPosition(scrollY);
            }
          } catch (error) {
            // Silently handle scroll tracking errors
            console.warn('Scroll tracking error in markup mode:', error);
          }
        },
        scrollEventThrottle: 100, // Reduce frequency to prevent performance issues
        // Accessibility optimizations
        ...(accessibilityOptimizations && {
          accessible: true,
          accessibilityRole: 'textbox' as const,
          accessibilityLabel: 'Sermon content editor',
          accessibilityHint: 'Enter your sermon content here. Use the toolbar to format text.',
        }),
      };

      // Web-specific optimizations
      if (isWeb) {
        return {
          ...baseProps,
          onKeyDown: enableKeyboardShortcuts ? handleKeyDown : undefined,
          selectTextOnFocus: false,
          spellCheck: true,
          autoCorrect: false,
          autoComplete: 'off',
          autoCapitalize: 'sentences',
          // Enhanced web text selection and scrolling
          style: [
            ...baseProps.style,
            styles.textInputWeb,
            webScrollBehavior === 'smooth' && styles.textInputWebSmooth,
          ],
          // Web-specific performance optimizations are handled by handleOptimizedTextChange
        };
      }

      // iOS-specific optimizations
      if (isIOS) {
        return {
          ...baseProps,
          selectTextOnFocus: false,
          contextMenuHidden: false,
          automaticallyAdjustContentInsets: false,
          contentInsetAdjustmentBehavior: 'never' as const,
          keyboardDismissMode: 'interactive' as const,
          // Enhanced touch interactions for iOS
          ...(shouldOptimizeTouch && {
            keyboardAppearance: 'default' as const,
            returnKeyType: 'default' as const,
            enablesReturnKeyAutomatically: false,
            clearButtonMode: 'never' as const,
            // iOS-specific keyboard behavior for better text editing
            keyboardShouldPersistTaps: 'handled' as const,
            scrollEnabled: true,
            showsVerticalScrollIndicator: true,
            // Better cursor positioning
            caretHidden: false,
            // Improved text selection
            selectionColor: theme.colors.primary,
          }),
          style: [
            ...baseProps.style,
            shouldOptimizeTouch && styles.textInputTouchOptimized,
            styles.textInputIOS,
          ],
          // iOS-specific performance optimizations
          ...(isVeryLargeDocument && {
            scrollEventThrottle: 32, // Reduce scroll event frequency
          }),
        };
      }

      // Android-specific optimizations
      if (isAndroid) {
        return {
          ...baseProps,
          selectTextOnFocus: false,
          contextMenuHidden: false,
          underlineColorAndroid: 'transparent',
          importantForAutofill: 'no' as const,
          // Enhanced touch interactions for Android
          ...(shouldOptimizeTouch && {
            textBreakStrategy: 'balanced' as const,
            hyphenationFrequency: 'normal' as const,
            includeFontPadding: false,
            textAlignVertical: 'top' as const,
            // Better keyboard behavior on Android
            scrollEnabled: true,
            showsVerticalScrollIndicator: true,
            // Improved cursor and selection
            caretHidden: false,
            selectionColor: theme.colors.primary,
          }),
          style: [
            ...baseProps.style,
            shouldOptimizeTouch && styles.textInputTouchOptimized,
            styles.textInputAndroid,
          ],
          // Android-specific performance optimizations
          ...(isVeryLargeDocument && {
            scrollEventThrottle: 32, // Reduce scroll event frequency
            removeClippedSubviews: true, // Improve performance for large content
          }),
        };
      }

      return baseProps;
    };

    return (
      <PerformanceOptimizer 
        config={finalPerformanceConfig}
        onPerformanceWarning={onPerformanceWarning}
      >
        <KeyboardAvoidingView 
          style={[styles.container, style]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <TextInput {...getPlatformSpecificProps()} />
        </KeyboardAvoidingView>
      </PerformanceOptimizer>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    padding: theme.spacing.md,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
    textAlignVertical: 'top',
    // Remove minHeight to let content determine height naturally
    // This allows better scrolling behavior
  },
  textInputTablet: {
    fontSize: 17,
    lineHeight: 26,
    padding: theme.spacing.lg,
    maxWidth: 900, // Optimal writing width on tablets
    alignSelf: 'center',
    width: '100%',
  },
  textInputLargeScreen: {
    fontSize: 18,
    lineHeight: 28,
    padding: theme.spacing.xl,
    maxWidth: 1000, // Optimal writing width on large screens
    alignSelf: 'center',
    width: '100%',
  },
  textInputSmallScreen: {
    fontSize: 15,
    lineHeight: 22,
    padding: theme.spacing.sm,
  },
  textInputLandscape: {
    paddingHorizontal: theme.spacing.xl,
  },
  textInputLargeDocument: {
    // Optimizations for large documents
    fontSize: 15,
    lineHeight: 22,
  },
  textInputVeryLargeDocument: {
    // Additional optimizations for very large documents
    fontSize: 14,
    lineHeight: 20,
  },
  textInputExtremelyLargeDocument: {
    // Maximum optimizations for extremely large documents
    fontSize: 13,
    lineHeight: 18,
    // Reduce visual complexity
    ...(Platform.OS !== 'web' && {
      textShadowRadius: 0,
    }),
  },
  textInputWeb: {
    // Web-specific optimizations
    ...(Platform.OS === 'web' && {
      outline: 'none' as any,
      resize: 'none' as any,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      WebkitFontSmoothing: 'antialiased' as any,
      MozOsxFontSmoothing: 'grayscale' as any,
    }),
  },
  textInputWebSmooth: {
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific CSS property
      scrollBehavior: 'smooth',
    }),
  } as any,
  textInputIOS: {
    // iOS-specific optimizations
    ...(Platform.OS === 'ios' && {
      fontFamily: 'System',
    }),
  },
  textInputAndroid: {
    // Android-specific optimizations
    ...(Platform.OS === 'android' && {
      fontFamily: 'Roboto',
      includeFontPadding: false,
    }),
  },
  textInputTouchOptimized: {
    // Enhanced touch target size for mobile
    minHeight: 44, // iOS HIG minimum touch target
    paddingVertical: theme.spacing.sm,
    // Better keyboard interaction
    paddingBottom: theme.spacing.lg, // Extra bottom padding to avoid keyboard overlap
  },
  previewContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  previewPressable: {
    flex: 1,
  },
  previewContainerWebSmooth: {
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific CSS property
      scrollBehavior: 'smooth',
    }),
  } as any,
  previewContent: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  previewContentTablet: {
    padding: theme.spacing.lg,
    maxWidth: 800, // Optimal reading width on tablets
    alignSelf: 'center',
    width: '100%',
  },
  previewContentLargeScreen: {
    padding: theme.spacing.xl,
    maxWidth: 900, // Optimal reading width on large screens
    alignSelf: 'center',
    width: '100%',
  },
  previewContentSmallScreen: {
    padding: theme.spacing.sm,
  },
  previewContentLandscape: {
    paddingHorizontal: theme.spacing.xl,
  },
});

// Custom rules for highlight syntax
const customRules = {
  highlight: {
    match: (source: string, state: any, lookbehind: string) => {
      const regex = /^==([\s\S]+?)==/;
      const match = regex.exec(source);
      return match ? [match[0], match[1]] : null;
    },
    parse: (capture: any, nestedParse: any, state: any) => {
      return {
        content: capture[1],
      };
    },
    render: (node: any, children: any, parent: any, styles: any, inheritedStyles: any) => {
      return (
        <Text key={node.key} style={[inheritedStyles, styles.highlight]}>
          {node.content}
        </Text>
      );
    },
  },
};

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  strong: {
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  em: {
    fontStyle: 'italic',
    color: theme.colors.textPrimary,
  },
  blockquote: {
    backgroundColor: theme.colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    paddingLeft: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
    fontStyle: 'italic',
  },
  list_item: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  bullet_list: {
    marginVertical: theme.spacing.sm,
  },
  ordered_list: {
    marginVertical: theme.spacing.sm,
  },
  code_inline: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      web: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      default: 'monospace',
    }),
  },
  code_block: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    padding: theme.spacing.sm,
    borderRadius: 8,
    marginVertical: theme.spacing.sm,
    fontSize: 14,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      web: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      default: 'monospace',
    }),
  },
  hr: {
    backgroundColor: theme.colors.gray300,
    height: 1,
    marginVertical: theme.spacing.lg,
  },
  // Custom highlight style for ==text== syntax
  highlight: {
    backgroundColor: theme.colors.warning,
    color: theme.colors.textPrimary,
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 3,
  },
});