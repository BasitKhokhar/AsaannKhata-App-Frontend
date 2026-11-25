import React from 'react';
import { View, Text, Pressable, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { IconButton } from './IconButton';

// Generic modal shell: drag handle + header + scrollable
// keyboard-aware body + optional footer actions. Bottom placement remains the
// default, while centered placement supports capped-height pickers. Extracted from the sheets
// that used to be hand-rolled per-screen (NewBill's product picker,
// CustomerDetail's payment form) so every sheet in the app opens, closes,
// and looks the same.
export function Sheet({ visible, onClose, title, children, footer, scrollable = true, placement = 'bottom' }) {
  const { colors, radii, typography, spacing, elevation } = useTheme();
  const centered = placement === 'center';

  const Body = scrollable ? ScrollView : View;
  const bodyProps = scrollable
    ? {
      style: { flex: 1 },
      contentContainerStyle: { padding: spacing.lg, gap: spacing.md },
      keyboardShouldPersistTaps: 'handled',
      keyboardDismissMode: Platform.OS === 'ios' ? 'interactive' : 'on-drag',
      automaticallyAdjustKeyboardInsets: Platform.OS === 'ios',
    }
    : { style: { padding: spacing.lg, gap: spacing.md } };

  return (
    <Modal visible={visible} transparent animationType={centered ? 'fade' : 'slide'} onRequestClose={onClose}>
      <View style={centered ? { flex: 1, alignItems: 'center', justifyContent: 'center' } : { flex: 1 }}>
        <Pressable style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.surface.overlay }} onPress={onClose} />
        {/* The native Modal already overlays BottomNav. Footer safe-area padding
            protects actions from system UI without leaving a navigation-sized gap. */}
        <KeyboardAvoidingView
          // Android already resizes the modal window through
          // softwareKeyboardLayoutMode=resize. Applying a second `height`
          // adjustment here makes form sheets collapse when an input focuses.
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={centered
            ? { width: '100%', maxWidth: 520, height: '80%', maxHeight: '80%', paddingHorizontal: spacing.lg }
            : { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '88%' }}
        >
        <View
          style={[
            {
              backgroundColor: colors.surface.card,
              ...(centered
                ? { flex: 1, borderRadius: radii.xl }
                : { borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl }),
              overflow: 'hidden',
            },
            elevation.xl,
          ]}
        >
          <View style={{ alignItems: 'center', paddingTop: spacing.sm }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.surface.border }} />
          </View>
          {title ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.sm,
              }}
            >
              <Text style={[typography.h3, { color: colors.ink.primary }]}>{title}</Text>
              <IconButton icon={X} onPress={onClose} size={18} />
            </View>
          ) : null}
          <Body {...bodyProps}>{children}</Body>
          {footer ? (
            <SafeAreaView
              edges={['bottom']}
              style={{
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.sm,
                paddingBottom: spacing.sm,
                borderTopWidth: 1,
                borderTopColor: colors.surface.border,
              }}
            >
              {footer}
            </SafeAreaView>
          ) : null}
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
