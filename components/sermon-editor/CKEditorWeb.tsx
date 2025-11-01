import React, { useEffect, useRef, useState } from 'react';
import { CKEditorWrapperProps } from './types';

declare global {
  interface Window {
    CKEDITOR?: any;
  }
}

const CKEditorWebComponent: React.FC<CKEditorWrapperProps> = ({
  value,
  onChange,
  placeholder = 'Start writing your sermon...',
  onFocus,
  onBlur,
  onSelectionChange,
  style,
  testID,
}) => {
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const scriptLoadedRef = useRef(false);
  const lastSentDataRef = useRef<string>('');
  const changeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load CKEditor from local file
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already loaded
    if (window.CKEDITOR && window.CKEDITOR.ClassicEditor) {
      console.log('CKEditor already available');
      scriptLoadedRef.current = true;
      setIsLoaded(true);
      return;
    }

    if (scriptLoadedRef.current) return;

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src*="ckeditor"]');
    if (existingScript) {
      console.log('CKEditor script already in DOM, waiting for load...');
      const checkInterval = setInterval(() => {
        if (window.CKEDITOR && window.CKEDITOR.ClassicEditor) {
          console.log('CKEditor loaded from existing script');
          scriptLoadedRef.current = true;
          setIsLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      
      setTimeout(() => clearInterval(checkInterval), 10000); // Stop after 10s
      return;
    }

    const script = document.createElement('script');
    script.src = '/assets/js/ckeditor.js';
    script.async = false; // Load synchronously to ensure proper initialization
    
    script.onload = () => {
      console.log('CKEditor local script loaded successfully');
      // Wait a bit for CKEDITOR to be available
      setTimeout(() => {
        if (window.CKEDITOR && window.CKEDITOR.ClassicEditor) {
          scriptLoadedRef.current = true;
          setIsLoaded(true);
        } else {
          console.error('CKEditor script loaded but CKEDITOR not available');
        }
      }, 100);
    };

    script.onerror = (error) => {
      console.error('Failed to load CKEditor from local file:', error);
      console.error('Script src:', script.src);
      setLoadError('Failed to load editor from local file. The editor may not be available.');
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove the script on cleanup to allow reuse
      // if (document.head.contains(script)) {
      //   document.head.removeChild(script);
      // }
    };
  }, []);

  // Initialize editor once CDN is loaded
  useEffect(() => {
    if (!isLoaded || !containerRef.current || isEditorReady || editorRef.current) return;

    const initEditor = async () => {
      try {
        if (!window.CKEDITOR || !window.CKEDITOR.ClassicEditor) {
          console.error('CKEDITOR not available on window object');
          return;
        }

        const { ClassicEditor } = window.CKEDITOR;

        const editor = await ClassicEditor.create(containerRef.current, {
          toolbar: ['heading', '|', 'bold', 'italic', '|', 'blockQuote', 'highlight'],
          heading: {
            options: [
              { model: 'paragraph', view: 'p', title: 'Paragraph', class: 'ck-heading_paragraph' },
              { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
              { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
            ],
          },
          highlight: {
            options: [
              {
                model: 'yellowMarker',
                class: 'marker-yellow',
                title: 'Yellow Marker',
                color: '#FFF59D',
                type: 'marker',
              },
            ],
          },
          placeholder,
          language: 'en',
          // Disable plugins we don't need (must match mobile; also remove CKBox image edit plugins)
          removePlugins: [
            'CKBox',
            'CKBoxUtils',
            'CKBoxImageEdit',
            'CKBoxImageEditEditing',
            'CKBoxImageEditUI',
            'CloudServices',
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
            'ExportPdf',
            'ExportWord',
            'AIAssistant',
            'AICommands',
            'AI',
            'OpenAIAdapter',
            'AzureOpenAIAdapter',
            'GenericAIAdapter',
          ],
        });

        editorRef.current = editor;
        setIsEditorReady(true);

        // Set initial content
        if (value) {
          editor.setData(value);
          lastSentDataRef.current = value;
        }

        // Listen for changes
        editor.model.document.on('change:data', () => {
          const data = editor.getData();
          // Debounce and prevent sending accidental clears
          if (changeDebounceRef.current) {
            clearTimeout(changeDebounceRef.current);
          }
          changeDebounceRef.current = setTimeout(() => {
            const trimmed = (data || '').trim();
            const lastTrimmed = (lastSentDataRef.current || '').trim();
            // Ignore no-op changes
            if (trimmed === lastTrimmed) return;
            // Ignore accidental full clears when we previously had content
            if (lastTrimmed.length > 0 && trimmed.length === 0) return;
            lastSentDataRef.current = data;
            onChange(data);
          }, 200);
        });

        // Listen for focus
        editor.editing.view.document.on('focus', () => {
          onFocus?.();
        });

        // Listen for blur
        editor.editing.view.document.on('blur', () => {
          onBlur?.();
        });

        // Listen for selection changes
        if (onSelectionChange) {
          editor.model.document.selection.on('change', () => {
            const selection = editor.model.document.selection;
            const ranges = Array.from(selection.getRanges());
            if (ranges.length > 0) {
              const range: any = ranges[0];
              const start = range.start.offset;
              const end = range.end.offset;
              onSelectionChange({ start, end });
            }
          });
        }

        console.log('CKEditor Web initialized successfully');
      } catch (error) {
        console.error('Failed to initialize CKEditor:', error);
      }
    };

    initEditor();

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy().catch((error: any) => {
          console.error('Error destroying editor:', error);
        });
        editorRef.current = null;
        setIsEditorReady(false);
      }
    };
  }, [isLoaded, placeholder, onFocus, onBlur, onSelectionChange, onChange, value]);

  // Note: Avoid syncing parent value back into the editor to prevent resets during typing/highlighting

  const containerStyle = {
    minHeight: '400px',
    maxHeight: '600px',
    overflow: 'auto',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    ...style
  };

  const loadingStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    color: '#666',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  };

  return (
    <div style={containerStyle} data-testid={testID}>
      <style>{`
        .ck-editor__editable {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          max-height: 500px !important;
          overflow-y: auto !important;
        }
        .ck-content {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }
        .ck-editor__editable p,
        .ck-editor__editable h1,
        .ck-editor__editable h2,
        .ck-editor__editable h3,
        .ck-editor__editable h4,
        .ck-editor__editable h5,
        .ck-editor__editable h6 {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }
        .ck-editor__main {
          overflow: visible !important;
        }
        .ck-editor {
          overflow: visible !important;
        }
        .marker-yellow {
          background-color: #FFF59D !important;
        }
      `}</style>
      {loadError && (
        <div style={{...loadingStyle, color: '#d32f2f'}}>
          {loadError}
        </div>
      )}
      {!isLoaded && !loadError && (
        <div style={loadingStyle}>
          Loading editor...
        </div>
      )}
      <div ref={containerRef}></div>
    </div>
  );
};

// Prevent React from re-rendering this component after the first mount.
// This avoids React reconciling the container div and wiping CKEditor DOM.
export const CKEditorWeb = React.memo(CKEditorWebComponent, () => true);
