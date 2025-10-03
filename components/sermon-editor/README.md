# Sermon Editor - CKEditor Implementation

## Overview

The sermon editor has been completely revamped to use CKEditor 5, providing a robust, cross-platform rich text editing experience for web, iOS, and Android.

## Architecture

### Component Structure

```
CKEditorSermonEditor (Main Container)
├── Header (Cancel/Save buttons)
├── Title Input
├── Tabs (Content, Outline, Notes, Details)
└── Content Area
    ├── CKEditorWrapper (Platform Router)
    │   ├── CKEditorWeb (Web Implementation)
    │   └── CKEditorMobile (Native Implementation via WebView)
    └── Details Forms (Scripture, Series, Tags, Stats)
```

### Key Components

#### 1. **CKEditorSermonEditor** (`CKEditorSermonEditor.tsx`)
- Main container component
- Manages sermon state (title, content, outline, notes, metadata)
- Handles save/cancel operations
- Provides tab navigation
- Integrates series and Bible verse modals
- Theme-consistent styling

#### 2. **CKEditorWrapper** (`CKEditorWrapper.tsx`)
- Platform detection and routing
- Renders `CKEditorWeb` on web
- Renders `CKEditorMobile` on iOS/Android

#### 3. **CKEditorWeb** (`CKEditorWeb.tsx`)
- Web-specific implementation
- Uses `@ckeditor/ckeditor5-react` and `@ckeditor/ckeditor5-build-classic`
- Dynamic imports to prevent SSR issues
- Keyboard shortcuts support

#### 4. **CKEditorMobile** (`CKEditorMobile.tsx`)
- Mobile implementation using React Native WebView
- Loads CKEditor 5 Super-build from CDN
- Custom toolbar for mobile
- Advanced focus and typing management
- PostMessage communication between WebView and React Native

#### 5. **Types** (`types.ts`)
- TypeScript interfaces for all editor components
- Props definitions
- Configuration types

## Features

### Formatting Options
- **P**: Paragraph (normal text)
- **H2**: Heading level 2
- **H3**: Heading level 3
- **Bold**: Strong text emphasis
- **Italic**: Emphasized text
- **Quote**: Block quotes
- **Highlight**: Yellow text marker

### Cross-Platform Support
- ✅ Web (desktop and mobile browsers)
- ✅ iOS (native app)
- ✅ Android (native app)
- ✅ Responsive design for all screen sizes

### Mobile Optimizations
- Touch-optimized toolbar with large hit targets
- Native scrolling behavior
- Keyboard handling (auto-show/hide)
- Focus management to prevent typing interruptions
- Debounced updates for smooth typing
- Memoized components to prevent unnecessary re-renders

### Performance
- Lazy loading on web (dynamic imports)
- Efficient re-rendering strategies
- Optimized for long documents
- Memory-efficient WebView implementation

## Usage

### Basic Implementation

```typescript
import { CKEditorSermonEditor } from '@/components/sermon-editor/CKEditorSermonEditor';

<CKEditorSermonEditor
  sermon={existingSermon} // Optional
  onSave={handleSave}
  onCancel={handleCancel}
/>
```

### Props

**CKEditorSermonEditor**
- `sermon?: Sermon` - Optional existing sermon data
- `onSave: (sermonData: Partial<Sermon>) => Promise<void>` - Save handler
- `onCancel: () => void` - Cancel handler

**CKEditorWrapper**
- `value: string` - HTML content
- `onChange: (data: string) => void` - Change handler
- `placeholder?: string` - Placeholder text
- `onFocus?: () => void` - Focus handler
- `onBlur?: () => void` - Blur handler
- `style?: ViewStyle | React.CSSProperties` - Custom styles
- `testID?: string` - Test identifier

## Technical Details

### Web Implementation

#### SSR Handling
CKEditor is loaded dynamically to prevent server-side rendering issues:

```typescript
useEffect(() => {
  if (typeof window !== 'undefined') {
    const loadCKEditor = async () => {
      const [{ CKEditor }, { default: ClassicEditor }] = await Promise.all([
        import('@ckeditor/ckeditor5-react'),
        import('@ckeditor/ckeditor5-build-classic')
      ]);
      // Initialize editor...
    };
    loadCKEditor();
  }
}, []);
```

### Mobile Implementation

#### WebView Communication
React Native and WebView communicate via `postMessage`:

**From WebView → React Native:**
- `ready`: Editor initialized
- `change`: Content changed
- `focus`: Editor focused
- `blur`: Editor blurred
- `selectionChange`: Text selection changed
- `error`: Error occurred

**From React Native → WebView:**
- `updateContent`: Update editor content
- `exec`: Execute formatting command
- `focus`: Focus editor
- `blur`: Blur editor

#### Focus Management
To prevent typing interruptions:

```typescript
// Track user typing state
const isUserTypingRef = useRef(false);
const lastChangeTimeRef = useRef(0);
const isEditorFocusedRef = useRef(false);

// Only update content when user is not typing
if (!isUserTypingRef.current && !isEditorFocusedRef.current) {
  // Safe to update
}
```

#### Debouncing
Content changes are debounced (500ms) to reduce update frequency:

```typescript
debounceTimeoutRef.current = setTimeout(() => {
  const timeSinceLastChange = Date.now() - lastChangeTimeRef.current;
  if (timeSinceLastChange >= 500) {
    onChange(message.data);
  }
}, 500);
```

### Configuration

#### CKEditor Plugins
**Enabled:**
- Heading (P, H2, H3)
- Bold
- Italic
- BlockQuote
- Highlight

**Disabled:**
- All collaboration features
- AI features
- Cloud services
- Track changes
- Comments
- Revision history

## Styling

### Theme Integration
The editor uses the app's design system:

```typescript
import { theme } from '@/constants/Theme';

// Consistent colors
backgroundColor: theme.colors.surface
borderColor: theme.colors.gray200
textColor: theme.colors.textPrimary

// Consistent spacing
padding: theme.spacing.md
borderRadius: theme.borderRadius.lg

// Consistent typography
...theme.typography.h3
...theme.typography.body1
```

### Mobile Toolbar
Custom styled toolbar for touch interactions:

```css
.toolButton {
  paddingVertical: 10px;
  paddingHorizontal: 12px;
  minHeight: 44px; /* iOS touch target minimum */
}
```

## Troubleshooting

### Common Issues

#### 1. "window is not defined" on Web
**Cause:** CKEditor imported during SSR  
**Solution:** Already fixed via dynamic imports

#### 2. Focus Loss During Typing (Mobile)
**Cause:** Re-renders causing WebView remount  
**Solution:** Already fixed via:
- Memoized components
- Focus state tracking
- Debounced updates
- Update prevention during typing

#### 3. Editor Not Showing Content (Mobile)
**Cause:** Content set before editor ready  
**Solution:** Already fixed - content sent after `ready` event

#### 4. Scrolling Not Working (Mobile)
**Cause:** WebView `scrollEnabled` prop  
**Solution:** Set to `true` in WebView props

#### 5. Highlight Not Working (Mobile)
**Cause:** Missing super-build or CSS  
**Solution:** Use super-build CDN and include `.marker-yellow` CSS

## Testing

### Manual Testing Checklist

**Web:**
- [ ] Editor loads correctly
- [ ] All formatting buttons work
- [ ] Keyboard shortcuts work
- [ ] Content persists on save
- [ ] No SSR errors

**Mobile (iOS/Android):**
- [ ] Editor loads with content
- [ ] Continuous typing works
- [ ] No focus loss
- [ ] No cursor jumping
- [ ] Scrolling works for long content
- [ ] All toolbar buttons work
- [ ] Keyboard shows/hides properly
- [ ] Content persists on save

### Performance Testing
- [ ] Large documents (10k+ words)
- [ ] Rapid typing
- [ ] Quick formatting changes
- [ ] Memory usage stable
- [ ] No memory leaks

## Migration Notes

### From Old Editor

**Removed:**
- `WysiwygEditor.tsx`
- `MarkdownEditor.tsx`
- `EnhancedMarkdownEditor.tsx`
- `react-native-markdown-display` dependency
- `@ilz5753/rnmd` dependency

**Added:**
- `CKEditorWeb.tsx`
- `CKEditorMobile.tsx`
- `CKEditorWrapper.tsx`
- `CKEditorSermonEditor.tsx`
- `@ckeditor/ckeditor5-react`
- `@ckeditor/ckeditor5-build-classic`
- `react-native-webview`

### Content Format
- **Old:** Markdown text
- **New:** HTML content
- **Migration:** Content format already handled (HTML stored in DB)

## Future Enhancements

### Phase 3 (Completed)
- ✅ Mobile touch improvements
- ✅ Bug fixes and testing
- ✅ Theme consistency

### Phase 4 (Current)
- ✅ Cleanup unused code
- ✅ Documentation
- ⏳ Performance monitoring

### Future Considerations
- Auto-save implementation
- Real-time collaboration
- Offline editing support
- Advanced formatting options
- Custom plugins
- Image uploads
- Table support

## Resources

- [CKEditor 5 Documentation](https://ckeditor.com/docs/ckeditor5/latest/)
- [React Native WebView Docs](https://github.com/react-native-webview/react-native-webview)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)

## Support

For issues or questions:
1. Check this documentation
2. Review the troubleshooting section
3. Check component comments
4. Consult CKEditor documentation

## License

This implementation is part of the YouPreacher app project.

