import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, findNodeHandle, Keyboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { KeyboardAwareContext } from './KeyboardAwareContext';

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

export const KeyboardAwareScrollView = React.forwardRef(function KeyboardAwareScrollView({ children, style, contentContainerStyle, ...props }, ref) {
  const scrollViewRef = useRef(null);
  const focusedInputRef = useRef(null);
  const scrollOffsetRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const keyboardTopRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  function setScrollViewRef(node) {
    scrollViewRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }

  function scrollFocusedInputIntoView() {
    const input = focusedInputRef.current;
    if (!input?.measureInWindow || !scrollViewRef.current) return;

    // Let RN's native scroll responder account for the current keyboard/window
    // inset first. This works immediately on focus, including before Android's
    // resize pass has completed; the measurement fallback below handles hosts
    // where the responder method is unavailable.
    const nativeHandle = findNodeHandle(input);
    const scrollResponder = scrollViewRef.current.scrollResponderScrollNativeHandleToKeyboard;
    if (nativeHandle && typeof scrollResponder === 'function') {
      scrollResponder.call(scrollViewRef.current, nativeHandle, 24, true);
      return;
    }

    input.measureInWindow((x, y, width, height) => {
      const keyboardTop = keyboardTopRef.current ?? (Dimensions.get('window').height - keyboardHeightRef.current);
      const bottomInset = Platform.OS === 'ios' ? 8 : 16;
      const overlap = y + height - (keyboardTop - bottomInset);
      if (overlap > 0) {
        scrollViewRef.current.scrollTo({
          y: Math.max(0, scrollOffsetRef.current + overlap),
          animated: true,
        });
      }
    });
  }

  function focusInput(input) {
    focusedInputRef.current = input;
    // The first pass handles an already-open keyboard; the later passes run
    // after Android has finished resizing the window for a newly opened one.
    requestAnimationFrame(scrollFocusedInputIntoView);
    setTimeout(scrollFocusedInputIntoView, 120);
    setTimeout(scrollFocusedInputIntoView, 300);
  }

  useEffect(() => {
    const eventName = Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const showSubscription = Keyboard.addListener(eventName, (event) => {
      const nextHeight = event.endCoordinates?.height || 0;
      keyboardHeightRef.current = nextHeight;
      keyboardTopRef.current = event.endCoordinates?.screenY ?? (Dimensions.get('window').height - nextHeight);
      setKeyboardHeight(nextHeight);
      setTimeout(scrollFocusedInputIntoView, 50);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      keyboardHeightRef.current = 0;
      keyboardTopRef.current = null;
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const contextValue = useMemo(() => ({ focusInput }), []);
  const handleScroll = (event) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
    props.onScroll?.(event);
  };

  return (
    <KeyboardAwareContext.Provider value={contextValue}>
      <ScrollView
        ref={setScrollViewRef}
        style={[{ flex: 1 }, style]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentContainerStyle={[{ flexGrow: 1, paddingBottom: 32 + (Platform.OS === 'android' ? keyboardHeight : 0) }, contentContainerStyle]}
        {...props}
        onScroll={handleScroll}
        scrollEventThrottle={props.scrollEventThrottle || 16}
      >
        {children}
      </ScrollView>
    </KeyboardAwareContext.Provider>
  );
});
