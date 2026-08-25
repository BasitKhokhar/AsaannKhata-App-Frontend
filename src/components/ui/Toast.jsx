import React, { useEffect } from 'react';
import { Text, Pressable } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useToastStore } from '../../store/toastStore';
import { haptics } from '../../utils/haptics';

function hapticFor(tone) {
  if (tone === 'success') return haptics.success;
  if (tone === 'danger') return haptics.error;
  if (tone === 'warning') return haptics.warning;
  return haptics.tap;
}

function toneColor(colors, tone) {
  if (tone === 'success') return colors.semantic.success;
  if (tone === 'warning') return colors.semantic.warning;
  if (tone === 'danger') return colors.semantic.danger;
  return colors.brand.primary;
}

// Mounted once near the app root (see App.jsx). Renders whatever
// useToastStore currently holds — screens never render this directly, they
// just call showToast() from src/store/toastStore.js.
export function Toast() {
  const { colors, typography, spacing, radii, elevation } = useTheme();
  const toast = useToastStore((s) => s.toast);
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    if (toast) hapticFor(toast.tone)();
  }, [toast?.id]);

  return (
    <SafeAreaView
      pointerEvents="box-none"
      edges={['top']}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.lg, zIndex: 999 }}
    >
      <AnimatePresence>
        {toast ? (
          <MotiView
            key={toast.id}
            from={{ opacity: 0, translateY: -12 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -12 }}
            transition={{ type: 'timing', duration: 220 }}
          >
            <Pressable
              onPress={dismiss}
              style={[
                {
                  marginTop: spacing.sm,
                  backgroundColor: colors.surface.raised,
                  borderRadius: radii.md,
                  borderLeftWidth: 4,
                  borderLeftColor: toneColor(colors, toast.tone),
                  padding: spacing.md,
                },
                elevation.lg,
              ]}
            >
              <Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{toast.message}</Text>
            </Pressable>
          </MotiView>
        ) : null}
      </AnimatePresence>
    </SafeAreaView>
  );
}
