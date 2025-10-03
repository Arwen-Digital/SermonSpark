import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CKEditorConfig, CKEditorWrapperProps } from './types';

export const CKEditorWeb: React.FC<CKEditorWrapperProps> = ({
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
  const [CKEditor, setCKEditor] = useState<any>(null);
  const [ClassicEditor, setClassicEditor] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const config: CKEditorConfig = {
    toolbar: [
      'heading',
      '|',
      'bold',
      'italic',
      '|',
      'blockQuote',
      'highlight',
    ],
    heading: {
      options: [
        { model: 'heading2', view: 'h2', title: 'Heading 2' },
        { model: 'heading3', view: 'h3', title: 'Heading 3' },
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
  };

  // Dynamically import CKEditor only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadCKEditor = async () => {
        try {
          const [{ CKEditor: CKEditorComponent }, { default: ClassicEditorClass }] = await Promise.all([
            import('@ckeditor/ckeditor5-react'),
            import('@ckeditor/ckeditor5-build-classic')
          ]);
          
          setCKEditor(() => CKEditorComponent);
          setClassicEditor(() => ClassicEditorClass);
          setIsLoaded(true);
        } catch (error) {
          console.error('Failed to load CKEditor:', error);
        }
      };
      
      loadCKEditor();
    }
  }, []);

  const handleReady = useCallback((editor: any) => {
    editorRef.current = editor;
    console.log('CKEditor Web is ready to use!', editor);
  }, []);

  const handleChange = useCallback((event: any, editor: any) => {
    const data = editor.getData();
    onChange(data);
  }, [onChange]);

  const handleFocus = useCallback((event: any, editor: any) => {
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback((event: any, editor: any) => {
    onBlur?.();
  }, [onBlur]);

  const handleSelectionChange = useCallback((event: any, editor: any) => {
    if (onSelectionChange) {
      const selection = editor.model.document.selection;
      const ranges = selection.getRanges();
      if (ranges.length > 0) {
        const range = ranges[0];
        const start = range.start.offset;
        const end = range.end.offset;
        onSelectionChange({ start, end });
      }
    }
  }, [onSelectionChange]);

  // Expose editor methods for external use
  useEffect(() => {
    if (editorRef.current) {
      // Focus method
      (window as any).focusEditor = () => {
        editorRef.current?.focus();
      };
      
      // Blur method
      (window as any).blurEditor = () => {
        editorRef.current?.blur();
      };
    }
  }, []);

  const containerStyle = {
    minHeight: '400px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    ...style 
  };

  const loadingStyle = {
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '400px',
    color: '#666'
  };

  // Show loading state while CKEditor is being loaded
  if (!isLoaded || !CKEditor || !ClassicEditor) {
    return (
      <div 
        style={containerStyle}
        data-testid={testID}
      >
        <div style={loadingStyle}>
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div 
      style={containerStyle}
      data-testid={testID}
    >
      <CKEditor
        editor={ClassicEditor}
        config={config}
        data={value}
        onReady={handleReady}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSelectionChange={handleSelectionChange}
      />
    </div>
  );
};