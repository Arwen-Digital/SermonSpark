import React from 'react';
import { Platform } from 'react-native';
import { CKEditorMobile } from './CKEditorMobile';
import { CKEditorWeb } from './CKEditorWeb';
import { CKEditorWrapperProps } from './types';

export const CKEditorWrapper: React.FC<CKEditorWrapperProps> = (props) => {
  // Use web implementation for web platform, mobile for native platforms
  if (Platform.OS === 'web') {
    return <CKEditorWeb {...props} />;
  }
  
  return <CKEditorMobile {...props} />;
};
