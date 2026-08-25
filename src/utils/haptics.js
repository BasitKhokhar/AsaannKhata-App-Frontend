import * as Haptics from 'expo-haptics';

// Centralized haptic feedback so call sites don't scatter Haptics.* calls
// with inconsistent styles. Fails silently — haptics are unsupported on some
// Android devices/emulators and should never throw into the calling flow.
function safe(fn) {
  try {
    fn();
  } catch (err) {
    // no-op
  }
}

export const haptics = {
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
