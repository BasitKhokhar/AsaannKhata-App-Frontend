import React from 'react';
import { View, Text, Pressable, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { IconButton } from './IconButton';

// Generic bottom-sheet shell: drag handle + header + scrollable
// keyboard-aware body + optional footer actions. Extracted from the sheets
// that used to be hand-rolled per-screen (NewBill's product picker,
// CustomerDetail's payment form) so every sheet in the app opens, closes,
// and looks the same.
export function Sheet({ visible, onClose, title, children, footer, scrollable = true }) {
  const { colors, radii, typography, spacing, elevation } = useTheme();

  const Body = scrollable ? ScrollView : View;
  const bodyProps = scrollable
    ? {
        contentContainerStyle: { padding: spacing.lg, gap: spacing.md },
        keyboardShouldPersistTaps: 'handled',
      }
    : { style: { padding: spacing.lg, gap: spacing.md } };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: colors.surface.overlay }} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '88%' }}
      >
        <View
          style={[
            {
              backgroundColor: colors.surface.card,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
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
    </Modal>
  );
}
