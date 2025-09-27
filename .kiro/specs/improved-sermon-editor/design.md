# Design Document

## Overview

This design addresses the critical usability issues in the current sermon editor by implementing a more robust and responsive markdown editing solution. The approach focuses on replacing the problematic custom WYSIWYG editor with a proven third-party solution while maintaining the existing UI/UX patterns that users expect.

Based on analysis of the current implementation, the main issues stem from:
1. Complex custom scrolling logic that interferes with natural scroll behavior
2. Fragmented text input handling across multiple components
3. Timing issues with text selection and cursor positioning
4. Performance problems with large documents

The solution will leverage `react-native-markdown-editor` as the core editing component, which provides battle-tested markdown editing capabilities with proper text selection, scrolling, and performance optimization.

## Architecture

### Component Structure

```
SermonEditor (existing container)
├── Header (unchanged)
├── TitleInput (unchanged)  
├── Tabs (unchanged)
├── Content Area
│   ├── MarkdownEditor (new - replaces WysiwygEditor)
│   │   ├── Toolbar (enhanced)
│   │   └── TextEditor (react-native-markdown-editor)
│   ├── OutlineEditor (unchanged)
│   ├── NotesEditor (unchanged)
│   └── DetailsForm (unchanged)
└── Modals (unchanged)
```

### Key Architectural Changes

1. **Replace WysiwygEditor**: Remove the complex custom implementation and replace with `react-native-markdown-editor`
2. **Simplify Scrolling**: Let the library handle scroll behavior natively
3. **Streamline Text Selection**: Use the library's built-in selection handling
4. **Maintain Formatting Toolbar**: Adapt the existing toolbar to work with the new editor
5. **Preserve View Modes**: Keep markup/preview toggle functionality

## Components and Interfaces

### MarkdownEditor Component

```typescript
interface MarkdownEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectionChange?: (selection: {start: number, end: number}) => void;
  placeholder?: string;
  viewMode: 'markup' | 'formatted';
  style?: ViewStyle;
}

interface MarkdownEditorHandle {
  focus: () => void;
  blur: () => void;
  insertText: (text: string) => void;
  wrapSelection: (before: string, after: string) => void;
  getSelection: () => {start: number, end: number};
}
```

### Enhanced Toolbar Component

```typescript
interface ToolbarProps {
  onFormatPress: (format: FormatType) => void;
  hasSelection: boolean;
  viewMode: 'markup' | 'formatted';
  onViewModeToggle: () => void;
  onBibleVersePress: () => void;
}

type FormatType = 'bold' | 'italic' | 'heading2' | 'heading3' | 'list' | 'numberedList' | 'quote' | 'highlight';
```

### Integration Interface

The new MarkdownEditor will integrate with the existing SermonEditor through:

```typescript
// In SermonEditor component
const markdownEditorRef = useRef<MarkdownEditorHandle>(null);

const handleFormatting = (format: FormatType) => {
  markdownEditorRef.current?.wrapSelection(
    getFormatMarkdown(format).before,
    getFormatMarkdown(format).after
  );
};
```

## Data Models

### Format Configuration

```typescript
interface FormatConfig {
  before: string;
  after: string;
  placeholder?: string;
  requiresSelection?: boolean;
}

const FORMAT_CONFIGS: Record<FormatType, FormatConfig> = {
  bold: { before: '**', after: '**', placeholder: 'bold text' },
  italic: { before: '*', after: '*', placeholder: 'italic text' },
  heading2: { before: '## ', after: '', requiresSelection: false },
  heading3: { before: '### ', after: '', requiresSelection: false },
  list: { before: '- ', after: '', requiresSelection: false },
  numberedList: { before: '1. ', after: '', requiresSelection: false },
  quote: { before: '> ', after: '', requiresSelection: false },
  highlight: { before: '==', after: '==', placeholder: 'highlighted text' }
};
```

### Editor State

```typescript
interface EditorState {
  content: string;
  selection: {start: number, end: number};
  viewMode: 'markup' | 'formatted';
  hasUnsavedChanges: boolean;
  isLoading: boolean;
}
```

## Error Handling

### Library Integration Errors

1. **Fallback Strategy**: If `react-native-markdown-editor` fails to load or has compatibility issues, fall back to a simplified TextInput with basic markdown support
2. **Platform Compatibility**: Handle platform-specific issues with conditional rendering
3. **Performance Monitoring**: Track editor performance and switch to fallback if performance degrades

### User Input Errors

1. **Invalid Markdown**: Gracefully handle malformed markdown syntax
2. **Large Document Handling**: Implement progressive loading for very large documents
3. **Memory Management**: Monitor memory usage and implement cleanup for long editing sessions

### Error Recovery

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  errorType: 'library' | 'performance' | 'memory' | 'unknown';
  fallbackMode: boolean;
}

const ErrorRecoveryComponent: React.FC = () => {
  // Provides fallback TextInput when main editor fails
  // Maintains basic functionality while preserving user content
};
```

## Testing Strategy

### Unit Tests

1. **MarkdownEditor Component**
   - Text input and output
   - Formatting operations
   - Selection handling
   - View mode switching

2. **Toolbar Component**
   - Button interactions
   - Format application
   - State management

3. **Integration Layer**
   - SermonEditor integration
   - Data persistence
   - Auto-save functionality

### Integration Tests

1. **User Workflows**
   - Complete sermon writing session
   - Formatting operations
   - Mode switching
   - Save/load operations

2. **Performance Tests**
   - Large document handling (10k+ words)
   - Rapid text input
   - Scroll performance
   - Memory usage

3. **Platform Tests**
   - iOS native behavior
   - Android native behavior  
   - Web platform compatibility
   - Tablet/desktop layouts

### Manual Testing Scenarios

1. **Scrolling Behavior**
   - Natural scroll feel
   - Keyboard appearance handling
   - Cursor visibility maintenance
   - Manual vs automatic scrolling

2. **Text Selection**
   - Tap-to-place cursor
   - Drag selection
   - Double-tap word selection
   - Selection stability during formatting

3. **Formatting Operations**
   - Toolbar button responsiveness
   - Markdown syntax insertion
   - Preview mode rendering
   - Undo/redo functionality

### Performance Benchmarks

1. **Response Time Targets**
   - Text input response: < 16ms (60fps)
   - Formatting application: < 100ms
   - Mode switching: < 200ms
   - Scroll response: < 16ms

2. **Memory Usage Targets**
   - Base memory: < 50MB
   - Large document (10k words): < 100MB
   - Memory growth rate: < 1MB per 1000 words

3. **Battery Impact**
   - Minimal CPU usage during idle
   - Efficient rendering updates
   - Optimized scroll handling

## Implementation Phases

### Phase 1: Library Integration
- Add `react-native-markdown-editor` dependency
- Create basic MarkdownEditor wrapper component
- Implement core text editing functionality
- Basic toolbar integration

### Phase 2: Feature Parity
- Implement all existing formatting options
- Add view mode switching
- Integrate with existing SermonEditor container
- Preserve all current functionality

### Phase 3: Enhancement & Polish
- Optimize performance for large documents
- Add advanced formatting features
- Improve mobile touch interactions
- Comprehensive testing and bug fixes

### Phase 4: Migration & Cleanup
- Replace WysiwygEditor completely
- Remove unused code and dependencies
- Update documentation
- Performance monitoring and optimization