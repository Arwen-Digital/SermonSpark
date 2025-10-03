import { Sermon } from '@/types';

export interface CKEditorSermonEditorProps {
  sermon?: Partial<Sermon>;
  onSave: (sermonData: Partial<Sermon>) => Promise<void>;
  onCancel: () => void;
}

export interface CKEditorWrapperProps {
  value: string;
  onChange: (data: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onSelectionChange?: (selection: { start: number; end: number }) => void;
  style?: any;
  testID?: string;
}

export interface CKEditorConfig {
  toolbar: string[];
  heading?: {
    options: {
      model: string;
      view: string;
      title: string;
      class?: string;
    }[];
  };
  highlight?: {
    options: {
      model: string;
      class: string;
      title: string;
      color: string;
      type: string;
    }[];
  };
  placeholder?: string;
  language?: string;
}

export interface EditorState {
  content: string;
  wordCount: number;
  readingTime: number;
  hasUnsavedChanges: boolean;
  isFocused: boolean;
}

export interface EditorActions {
  save: () => Promise<void>;
  cancel: () => void;
  focus: () => void;
  blur: () => void;
  clear: () => void;
}

export type PlatformType = 'web' | 'ios' | 'android';

export interface PlatformConfig {
  platform: PlatformType;
  isWeb: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}
