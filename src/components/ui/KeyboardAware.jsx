import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

// Keep form content visible on both platforms. Android uses `height` in
// addition to the app's resize window mode because RN recommends setting a
// behavior explicitly on both iOS and Android.
export function KeyboardAwareView({ children, style, ...props }) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[{ flex: 1 }, style]}
      {...props}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

export function KeyboardAwareScrollView({ children, style, ...props }) {
  return (
    <ScrollView
      style={style}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      {...props}
    >
      {children}
    </ScrollView>
  );
}
