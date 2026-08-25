import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../theme';
import { useConfirmStore } from '../../store/confirmStore';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { haptics } from '../../utils/haptics';

// Mounted once near the app root (see App.jsx). Renders whatever
// useConfirmStore currently holds — screens never render this directly,
// they call showConfirm() from src/store/confirmStore.js and await the
// boolean result.
export function ConfirmDialog() {
  const { colors, typography, spacing } = useTheme();
  const request = useConfirmStore((s) => s.request);
  const resolve = useConfirmStore((s) => s.resolve);

  useEffect(() => {
    if (request) (request.isUrgent ? haptics.warning : haptics.tap)();
  }, [request]);

  return (
    <Sheet
      visible={!!request}
      onClose={() => resolve(false)}
      title={request?.title}
      scrollable={false}
      footer={
        <View style={{ flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.sm }}>
          <Button title={request?.cancelLabel} variant="outline" onPress={() => resolve(false)} style={{ flex: 1 }} />
          <Button
            title={request?.confirmLabel}
            variant={request?.isUrgent ? 'danger' : 'primary'}
            onPress={() => resolve(true)}
            style={{ flex: 1 }}
          />
        </View>
      }
    >
      <Text style={[typography.body, { color: colors.ink.secondary }]}>{request?.message}</Text>
    </Sheet>
  );
}
