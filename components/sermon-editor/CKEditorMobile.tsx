import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { CKEditorWrapperProps } from './types';

export const CKEditorMobile: React.FC<CKEditorWrapperProps> = ({
  value,
  onChange,
  placeholder = 'Start writing your sermon...',
  onFocus,
  onBlur,
  onSelectionChange,
  style,
  testID,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isReady, setIsReady] = useState(false);
  const [lastSentValue, setLastSentValue] = useState(value);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [editorInitialized, setEditorInitialized] = useState(false);
  const isUserTypingRef = useRef(false);
  const lastChangeTimeRef = useRef(0);
  const onChangeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isEditorFocusedRef = useRef(false);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (onChangeDebounceRef.current) {
        clearTimeout(onChangeDebounceRef.current);
      }
    };
  }, []);

  const htmlContent = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>CKEditor Mobile</title>
      <script src="https://cdn.ckeditor.com/ckeditor5/40.2.0/super-build/ckeditor.js"></script>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #ffffff;
        }
        .ck-editor__editable {
          min-height: 300px;
          padding: 16px;
          font-size: 16px;
          line-height: 1.5;
        }
        .ck-toolbar {
          display: none;
        }
        .ck-content {
          border: none;
        }
        .ck-editor {
          border: none;
        }
        .ck-focused {
          border: none !important;
          box-shadow: none !important;
        }
        /* Ensure highlight marker is visible on mobile */
        .marker-yellow {
          background-color: #FFF59D !important;
        }
      </style>
    </head>
    <body>
      <div id="editor"></div>
      
      <script>
        let editor;
        window.isUpdatingFromParent = false;
        window.isUserTyping = false;
        
        function getEditorClass() {
          if (window.CKEDITOR && window.CKEDITOR.ClassicEditor) return window.CKEDITOR.ClassicEditor;
          if (window.ClassicEditor) return window.ClassicEditor;
          return null;
        }

        function initEditor(retries = 20) {
          const EditorClass = getEditorClass();
          if (!EditorClass) {
            if (retries > 0) {
              return setTimeout(() => initEditor(retries - 1), 150);
            }
            console.error('CKEditor not available on window after retries');
            return window.ReactNativeWebView && window.ReactNativeWebView.postMessage && window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              error: 'CKEditor failed to load'
            }));
          }

          EditorClass.create(document.querySelector('#editor'), {
            toolbar: false,
            heading: {
              options: [
                { model: 'paragraph', title: 'Paragraph' },
                { model: 'heading2', view: 'h2', title: 'Heading 2' },
                { model: 'heading3', view: 'h3', title: 'Heading 3' }
              ]
            },
            highlight: {
              options: [
                {
                  model: 'yellowMarker',
                  class: 'marker-yellow',
                  title: 'Yellow Marker',
                  color: '#FFF59D',
                  type: 'marker'
                }
              ]
            },
            placeholder: '${placeholder}',
            language: 'en',
            removePlugins: [
              'CKBox',
              'CKFinder',
              'EasyImage',
              'RealTimeCollaborativeComments',
              'RealTimeCollaborativeTrackChanges',
              'RealTimeCollaborativeRevisionHistory',
              'PresenceList',
              'Comments',
              'TrackChanges',
              'TrackChangesData',
              'RevisionHistory',
              'WProofreader',
              'MathType',
              'SlashCommand',
              'Template',
              'DocumentOutline',
              'FormatPainter',
              'TableOfContents',
              'PasteFromOfficeEnhanced',
              'Pagination',
              // AI-related plugins that expect configured adapters
              'AIAssistant',
              'AICommands',
              'AI',
              'OpenAIAdapter',
              'AzureOpenAIAdapter',
              'GenericAIAdapter'
            ]
          })
          .then(function(editorInstance) {
            editor = editorInstance;
            
            setTimeout(function() {
              if (editor) {
                window.editorInitialized = true;
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
              }
            }, 200);
            
            editor.model.document.on('change:data', function() {
              var data = editor.getData();
              if (!window.isUpdatingFromParent && !window.isUserTyping) {
                window.isUserTyping = true;
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'change', data: data }));
                setTimeout(function() { window.isUserTyping = false; }, 100);
              }
            });
            
            editor.editing.view.document.on('focus', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'focus' }));
            });
            
            editor.editing.view.document.on('blur', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'blur' }));
            });
            
            editor.model.document.selection.on('change', function() {
              var selection = editor.model.document.selection;
              var ranges = selection.getRanges();
              if (ranges.length > 0) {
                var range = ranges[0];
                var start = range.start.offset;
                var end = range.end.offset;
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'selectionChange', start: start, end: end }));
              }
            });
          })
          .catch(function(error) {
            console.error('CKEditor initialization error:', error);
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', error: error.message }));
          });
        }
        
        function updateContent(newContent) {
          if (editor) {
            window.isUpdatingFromParent = true;
            editor.setData(newContent);
            setTimeout(function() { window.isUpdatingFromParent = false; }, 100);
          }
        }
        
        function focusEditor() {
          if (editor) {
            editor.editing.view.focus();
          }
        }
        
        function blurEditor() {
          if (editor) {
            editor.editing.view.document.fire('blur');
          }
        }
        
        function executeCommand(command, value) {
          if (editor) {
            try {
              if (value !== undefined) {
                editor.execute(command, value);
              } else {
                editor.execute(command);
              }
              editor.editing.view.focus();
            } catch (e) {
              console.error('Execute command error:', e);
            }
          }
        }
        
        document.addEventListener('message', function(event) {
          var message = JSON.parse(event.data);
          switch (message.type) {
            case 'updateContent': updateContent(message.content); break;
            case 'focus': focusEditor(); break;
            case 'blur': blurEditor(); break;
            case 'exec': executeCommand(message.command, message.value); break;
          }
        });
        
        window.addEventListener('message', function(event) {
          var message = JSON.parse(event.data);
          switch (message.type) {
            case 'updateContent': updateContent(message.content); break;
            case 'focus': focusEditor(); break;
            case 'blur': blurEditor(); break;
            case 'exec': executeCommand(message.command, message.value); break;
          }
        });

        // Kick off editor init (with retry if script not ready yet)
        setTimeout(function(){ initEditor(); }, 50);
      </script>
    </body>
    </html>
  `, [placeholder]);

  const webViewSource = useMemo(() => ({ html: htmlContent }), [htmlContent]);

  const handleMessage = useCallback((event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'ready':
          console.log('CKEditor Mobile: Editor ready, value length:', value?.length || 0);
          setIsReady(true);
          setEditorInitialized(true);
          if (webViewRef.current && typeof value === 'string') {
            const message = JSON.stringify({ type: 'updateContent', content: value });
            webViewRef.current.postMessage(message);
            setLastSentValue(value);
          }
          break;
        case 'change':
          isUserTypingRef.current = true;
          lastChangeTimeRef.current = Date.now();
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
          }
          debounceTimeoutRef.current = setTimeout(() => {
            const timeSinceLastChange = Date.now() - lastChangeTimeRef.current;
            if (timeSinceLastChange >= 500 && message.data !== lastSentValue) {
              isUserTypingRef.current = false;
              setLastSentValue(message.data);
              if (onChangeDebounceRef.current) {
                clearTimeout(onChangeDebounceRef.current);
              }
              onChangeDebounceRef.current = setTimeout(() => {
                onChange(message.data);
              }, 100);
            }
          }, 500);
          break;
        case 'focus':
          isEditorFocusedRef.current = true;
          onFocus?.();
          break;
        case 'blur':
          isEditorFocusedRef.current = false;
          onBlur?.();
          break;
        case 'selectionChange':
          onSelectionChange?.({ start: message.start, end: message.end });
          break;
        case 'error':
          console.error('CKEditor Mobile error:', message.error);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  }, [onChange, onFocus, onBlur, onSelectionChange, lastSentValue, value]);

  React.useEffect(() => {
    console.log('CKEditor Mobile: Value effect triggered', {
      isReady,
      editorInitialized,
      hasWebView: !!webViewRef.current,
      valueLength: value?.length || 0,
      lastSentValueLength: lastSentValue?.length || 0,
      valuesEqual: value === lastSentValue,
      isUserTyping: isUserTypingRef.current
    });
    
    if (
      isReady &&
      editorInitialized &&
      webViewRef.current &&
      value !== lastSentValue &&
      !isUserTypingRef.current &&
      !isEditorFocusedRef.current
    ) {
      console.log('CKEditor Mobile: Sending content update to WebView');
      const message = JSON.stringify({
        type: 'updateContent',
        content: value
      });
      webViewRef.current.postMessage(message);
      setLastSentValue(value);
    }
  }, [value, isReady, editorInitialized, lastSentValue]);

  const sendExec = useCallback((command: string, valueParam?: any) => {
    if (!isReady || !webViewRef.current) return;
    const msg = JSON.stringify({ type: 'exec', command, value: valueParam });
    webViewRef.current.postMessage(msg);
  }, [isReady]);

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.toolbar}>
        <Pressable style={styles.toolButton} onPress={() => sendExec('heading', { value: 'paragraph' })}>
          <Text style={styles.toolText}>P</Text>
        </Pressable>
        <Pressable style={styles.toolButton} onPress={() => sendExec('heading', { value: 'heading2' })}>
          <Text style={styles.toolText}>H2</Text>
        </Pressable>
        <Pressable style={styles.toolButton} onPress={() => sendExec('heading', { value: 'heading3' })}>
          <Text style={styles.toolText}>H3</Text>
        </Pressable>
        <Pressable style={styles.toolButton} onPress={() => sendExec('bold')}>
          <Text style={styles.toolText}>B</Text>
        </Pressable>
        <Pressable style={styles.toolButton} onPress={() => sendExec('italic')}>
          <Text style={styles.toolText}>I</Text>
        </Pressable>
        <Pressable style={styles.toolButton} onPress={() => sendExec('blockQuote')}>
          <Text style={styles.toolText}>&gt;</Text>
        </Pressable>
        <Pressable style={styles.toolButton} onPress={() => sendExec('highlight', { value: 'yellowMarker' })}>
          <Text style={[styles.toolText, styles.highlightSwatch]}>HL</Text>
        </Pressable>
      </View>
      {!isReady && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading editor...</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={webViewSource}
        onMessage={handleMessage}
        style={[styles.webview, !isReady && styles.webviewHidden]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={false}
        scrollEnabled={true}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        keyboardDisplayRequiresUserAction={false}
        hideKeyboardAccessoryView={true}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error: ', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView HTTP error: ', nativeEvent);
        }}
        onLayout={() => {
          console.log('WebView layout changed');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 400,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
  },
  toolButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  toolText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  highlightSwatch: {
    backgroundColor: '#FFF59D',
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webviewHidden: {
    opacity: 0,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    zIndex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});
