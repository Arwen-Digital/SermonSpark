import { theme } from '@/constants/Theme';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Dimensions, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

interface WysiwygEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectionChange?: (event: any) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  style?: any;
  viewMode?: 'markup' | 'formatted';
}

export interface WysiwygEditorHandle {
  focus: () => void;
  setSelection: (start: number, end: number) => void;
  getTextInputRef: () => React.RefObject<TextInput>;
  setContentAndSelection: (content: string, selectionStart: number, selectionEnd: number) => void;
}

interface ParsedSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  highlight?: boolean;
  heading?: number;
  quote?: boolean;
  listItem?: boolean;
  numberedList?: boolean;
}

export const WysiwygEditor = forwardRef<WysiwygEditorHandle, WysiwygEditorProps>(
  (
    {
      value,
      onChangeText,
      onSelectionChange,
      placeholder,
      placeholderTextColor,
      style,
      viewMode = 'formatted',
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [selection, setSelection] = useState({ start: 0, end: 0 });
    const [scrollY, setScrollY] = useState(0);
    const [hasSelection, setHasSelection] = useState(false);
    const textInputRef = useRef<TextInput>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const containerRef = useRef<View>(null);
    
    // Get screen dimensions
    const screenHeight = Dimensions.get('window').height;

    // Keyboard event listeners
    useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      });
      
      const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardHeight(0);
      });
      
      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }, []);

    const scrollToKeepCursorVisible = useCallback(() => {
      if (!containerRef.current || !textInputRef.current || keyboardHeight === 0) {
        return;
      }
      
      // Calculate approximate cursor position based on text length and selection
      const lineHeight = 24;
      const padding = 16;
      const textBeforeCursor = value.substring(0, selection.start);
      const lines = textBeforeCursor.split('\n').length;
      const approximateCursorY = (lines - 1) * lineHeight + padding;
      
      // Calculate available space above keyboard (conservative estimate)
      const headerHeight = 120; // Approximate header height
      const toolbarHeight = 50; // Formatting toolbar height
      const safetyMargin = 80; // Extra margin for safety
      const availableHeight = screenHeight - keyboardHeight - headerHeight - toolbarHeight - safetyMargin;
      
      // Calculate cursor screen position relative to current scroll
      const cursorScreenPosition = approximateCursorY - scrollY;
      
      // If cursor is below the visible area or too close to keyboard
      if (cursorScreenPosition > availableHeight || cursorScreenPosition < 0) {
        const targetScrollY = Math.max(0, approximateCursorY - availableHeight + 50);
        scrollViewRef.current?.scrollTo({
          y: targetScrollY,
          animated: true,
        });
        setScrollY(targetScrollY);
      }
    }, [keyboardHeight, selection, value, screenHeight, scrollY]);
    
    // Auto-scroll when selection changes and keyboard is visible
    useEffect(() => {
      if (isFocused && keyboardHeight > 0 && textInputRef.current) {
        // Delay to ensure layout has updated
        setTimeout(() => {
          scrollToKeepCursorVisible();
        }, 100);
      }
    }, [selection, isFocused, keyboardHeight, scrollToKeepCursorVisible]);

    // Auto-focus/blur when switching view modes
    useEffect(() => {
      if (viewMode === 'markup') {
        // Switching TO markup mode - focus the TextInput
        setIsFocused(true);
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 50);
      } else if (viewMode === 'formatted') {
        // Switching TO preview mode - blur the TextInput to show formatted view
        setIsFocused(false);
        setTimeout(() => {
          textInputRef.current?.blur();
        }, 50);
      }
    }, [viewMode]);

    // Expose methods to parent component
    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          setIsFocused(true);
          // Small delay to ensure component re-renders with TextInput
          setTimeout(() => {
            textInputRef.current?.focus();
          }, 10);
        },
        setSelection: (start: number, end: number) => {
          setSelection({ start, end });
          setHasSelection(start !== end);
          // Ensure we're in editing mode to apply selection
          if (!isFocused) {
            setIsFocused(true);
          }
          // Apply selection after a short delay to ensure TextInput is rendered
          setTimeout(() => {
            if (textInputRef.current) {
              textInputRef.current.setSelection?.(start, end);
            }
          }, 50);
        },
        getTextInputRef: () => textInputRef,
        setContentAndSelection: (content: string, selectionStart: number, selectionEnd: number) => {
          // Ensure we're in editing mode
          setIsFocused(true);
          
          if (textInputRef.current) {
            // Update internal state first
            setSelection({ start: selectionStart, end: selectionEnd });
            setHasSelection(selectionStart !== selectionEnd);
            
            // Call onChangeText to update parent state immediately
            onChangeText(content);
            
            // For both web and mobile, use a coordinated approach
            // Set selection in the next microtask to ensure content is updated
            Promise.resolve().then(() => {
              if (textInputRef.current && textInputRef.current.setSelection) {
                textInputRef.current.setSelection(selectionStart, selectionEnd);
              }
            });
          }
        },
      }),
      [isFocused, onChangeText]
    );

    const parseMarkdown = (text: string): ParsedSegment[] => {
      if (!text) return [];

      const lines = text.split('\n');
      const segments: ParsedSegment[] = [];

      lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) {
          segments.push({ text: '\n' });
        }

        if (line.trim() === '') {
          segments.push({ text: '' });
          return;
        }

        // Handle headings
        if (line.startsWith('### ')) {
          const headingText = line.substring(4);
          if (headingText.trim()) {
            segments.push({ text: headingText, heading: 3 });
          }
          return;
        }
        if (line.startsWith('## ')) {
          const headingText = line.substring(3);
          if (headingText.trim()) {
            segments.push({ text: headingText, heading: 2 });
          }
          return;
        }

        // Handle quotes
        if (line.startsWith('> ')) {
          const quoteText = line.substring(2);
          segments.push({ text: quoteText, quote: true });
          return;
        }

        // Handle numbered lists
        const numberedMatch = line.match(/^(\d+\. )(.*)/);
        if (numberedMatch) {
          segments.push({ text: numberedMatch[1], numberedList: true });
          if (numberedMatch[2]) {
            segments.push(...parseInlineMarkdown(numberedMatch[2]));
          }
          return;
        }

        // Handle bullet lists
        if (line.startsWith('- ')) {
          segments.push({ text: '• ', listItem: true });
          const remainingText = line.substring(2);
          if (remainingText) {
            segments.push(...parseInlineMarkdown(remainingText));
          }
          return;
        }

        segments.push(...parseInlineMarkdown(line));
      });

      return segments;
    };

    const parseInlineMarkdown = (text: string): ParsedSegment[] => {
      const segments: ParsedSegment[] = [];
      let processedText = text;

      // Process bold, italic, and highlight
      processedText = processedText.replace(/\*\*(.*?)\*\*/g, '__BOLD_START__$1__BOLD_END__');
      processedText = processedText.replace(/==(.*?)==/g, '__HIGHLIGHT_START__$1__HIGHLIGHT_END__');
      processedText = processedText.replace(/\*([^*]+?)\*/g, '__ITALIC_START__$1__ITALIC_END__');

      const markers = [
        { start: '__BOLD_START__', end: '__BOLD_END__', type: 'bold' },
        { start: '__ITALIC_START__', end: '__ITALIC_END__', type: 'italic' },
        { start: '__HIGHLIGHT_START__', end: '__HIGHLIGHT_END__', type: 'highlight' },
      ];

      let currentIndex = 0;
      while (currentIndex < processedText.length) {
        let nearestMarker: typeof markers[0] | null = null;
        let nearestIndex = processedText.length;

        markers.forEach((marker) => {
          const startIndex = processedText.indexOf(marker.start, currentIndex);
          if (startIndex !== -1 && startIndex < nearestIndex) {
            nearestIndex = startIndex;
            nearestMarker = marker;
          }
        });

        if (nearestMarker) {
          if (nearestIndex > currentIndex) {
            const plainText = processedText.substring(currentIndex, nearestIndex);
            if (plainText) {
              segments.push({ text: plainText });
            }
          }

          const endMarkerIndex = processedText.indexOf(
            nearestMarker.end,
            nearestIndex + nearestMarker.start.length
          );
          if (endMarkerIndex !== -1) {
            const content = processedText.substring(
              nearestIndex + nearestMarker.start.length,
              endMarkerIndex
            );

            const formatProps: any = {};
            formatProps[nearestMarker.type] = true;
            segments.push({ text: content, ...formatProps });

            currentIndex = endMarkerIndex + nearestMarker.end.length;
          } else {
            segments.push({ text: processedText.substring(currentIndex) });
            break;
          }
        } else {
          const remainingText = processedText.substring(currentIndex);
          if (remainingText) {
            segments.push({ text: remainingText });
          }
          break;
        }
      }

      return segments;
    };

    const getSegmentStyle = (segment: ParsedSegment) => {
      const styles = [wysiwygStyles.baseText];

      if (segment.bold) styles.push(wysiwygStyles.boldText);
      if (segment.italic) styles.push(wysiwygStyles.italicText);
      if (segment.highlight) styles.push(wysiwygStyles.highlightText);
      if (segment.heading === 2) styles.push(wysiwygStyles.heading2);
      if (segment.heading === 3) styles.push(wysiwygStyles.heading3);
      if (segment.quote) styles.push(wysiwygStyles.quoteText);
      if (segment.listItem || segment.numberedList) styles.push(wysiwygStyles.listText);

      return styles;
    };

    const handleFocus = () => {
      setIsFocused(true);
      // Small delay to ensure keyboard animation starts
      setTimeout(() => {
        scrollToKeepCursorVisible();
      }, 300);
    };

    const handleBlur = () => {
      // In markup mode, stay focused (always editing)
      // In preview mode, blur if no selection (return to formatted view)
      if (viewMode === 'formatted' && !hasSelection) {
        setIsFocused(false);
      }
    };

    const handleSelectionChange = (event: any) => {
      const { start, end } = event.nativeEvent.selection;
      setSelection({ start, end });
      setHasSelection(start !== end);
      onSelectionChange?.(event);
      
      // Ensure cursor stays visible when selection changes
      if (isFocused && keyboardHeight > 0) {
        setTimeout(() => {
          scrollToKeepCursorVisible();
        }, 100);
      }
    };
    
    const handleTextChange = (text: string) => {
      onChangeText(text);
      
      // Only clear selection state for user-initiated text changes
      // Don't clear for programmatic changes (like formatting operations)
      if (!text || text !== value) {
        setHasSelection(false);
      }
      
      // Ensure cursor stays visible when text changes
      if (isFocused && keyboardHeight > 0) {
        setTimeout(() => {
          scrollToKeepCursorVisible();
        }, 150);
      }
    };

    const segments = parseMarkdown(value);

    return (
      <View ref={containerRef} style={[styles.container, style]}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 20}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            onScroll={({ nativeEvent }) => {
              setScrollY(nativeEvent.contentOffset.y);
            }}
            scrollEventThrottle={16}
            onContentSizeChange={() => {
              // Auto-scroll to keep cursor visible when content grows and keyboard is visible
              if (isFocused && keyboardHeight > 0) {
                setTimeout(() => {
                  scrollToKeepCursorVisible();
                }, 50);
              }
            }}
          >
            <View style={styles.textContainer}>
              {/* Show different views based on viewMode - simplified logic */}
              {viewMode === 'markup' ? (
                /* MARKUP MODE: Always show raw text editor */
                <TextInput
                  ref={textInputRef}
                  value={value}
                  onChangeText={handleTextChange}
                  onSelectionChange={handleSelectionChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  multiline
                  placeholder={placeholder}
                  placeholderTextColor={placeholderTextColor}
                  textAlignVertical="top"
                  selectionColor={theme.colors.primary}
                  scrollEnabled={false}
                  style={styles.textInput}
                  blurOnSubmit={false}
                  onKeyPress={({ nativeEvent }) => {
                    // Auto-scroll when user is typing to keep cursor visible
                    if (nativeEvent.key !== 'Backspace' && keyboardHeight > 0) {
                      setTimeout(() => {
                        scrollToKeepCursorVisible();
                      }, 50);
                    }
                  }}
                />
              ) : (
                /* PREVIEW MODE: Show formatted view or editor when editing */
                <>
                  {(isFocused || hasSelection || !value) ? (
                    /* Show TextInput when actively editing */
                    <TextInput
                      ref={textInputRef}
                      value={value}
                      onChangeText={handleTextChange}
                      onSelectionChange={handleSelectionChange}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      multiline
                      placeholder={placeholder}
                      placeholderTextColor={placeholderTextColor}
                      textAlignVertical="top"
                      selectionColor={theme.colors.primary}
                      scrollEnabled={false}
                      style={styles.textInput}
                      blurOnSubmit={false}
                      onKeyPress={({ nativeEvent }) => {
                        // Auto-scroll when user is typing to keep cursor visible
                        if (nativeEvent.key !== 'Backspace' && keyboardHeight > 0) {
                          setTimeout(() => {
                            scrollToKeepCursorVisible();
                          }, 50);
                        }
                      }}
                    />
                  ) : (
                    /* Show formatted preview */
                    <Pressable
                      style={styles.renderContainer}
                      onPress={() => {
                        setIsFocused(true);
                        textInputRef.current?.focus();
                      }}
                    >
                      <Text style={styles.renderedText}>
                        {segments.map((segment, index) => (
                          <Text key={index} style={getSegmentStyle(segment)}>
                            {segment.text}
                          </Text>
                        ))}
                      </Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }
);

WysiwygEditor.displayName = 'WysiwygEditor';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Extra padding at bottom for keyboard space
  },
  textContainer: {
    flex: 1,
    minHeight: 300,
  },
  renderContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  renderedText: {
    fontSize: 16,
    lineHeight: 24,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    padding: theme.spacing.md,
    textAlignVertical: 'top',
    color: theme.colors.textPrimary,
    minHeight: 400,
  },
});

const wysiwygStyles = StyleSheet.create({
  baseText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.textPrimary,
  },
  boldText: {
    fontWeight: '700',
  },
  italicText: {
    fontStyle: 'italic',
  },
  highlightText: {
    backgroundColor: theme.colors.warning + '40',
    color: theme.colors.textPrimary,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: theme.colors.textPrimary,
    marginVertical: 4,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    color: theme.colors.textPrimary,
    marginVertical: 2,
  },
  quoteText: {
    fontStyle: 'italic',
    color: theme.colors.textSecondary,
    paddingLeft: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    backgroundColor: theme.colors.backgroundSecondary,
    paddingVertical: 4,
    paddingRight: 8,
  },
  listText: {
    color: theme.colors.textPrimary,
    paddingLeft: 8,
  },
});