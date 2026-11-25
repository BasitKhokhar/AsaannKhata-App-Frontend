import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { CalendarPicker } from './CalendarPicker';
import { useTheme } from '../../theme';
import { useIsUrdu, useT } from '../../store/languageStore';

export const formatPickerDate = (value) => new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export function DatePickerField({ label, value, onPress, style }) {
  const { colors, radii, typography, spacing } = useTheme();
  const isUrdu = useIsUrdu();
  return <Pressable accessibilityRole="button" onPress={onPress} style={[{ minHeight: 56, borderRadius: radii.md, borderWidth: 1, borderColor: colors.surface.border, backgroundColor: colors.surface.raised, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: isUrdu ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing.sm }, style]}><CalendarDays size={19} color={colors.brand.primary} /><View style={{ flex: 1 }}><Text style={[typography.caption, { color: colors.ink.secondary, textAlign: isUrdu ? 'right' : 'left' }]}>{label}</Text><Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: isUrdu ? 'right' : 'left' }]}>{formatPickerDate(value)}</Text></View></Pressable>;
}

export function DatePickerSheet({ visible, onClose, value, onChange, maximumDate = new Date(), title }) {
  const { spacing } = useTheme();
  const t = useT();
  const [draft, setDraft] = useState(value ? new Date(value) : new Date());
  useEffect(() => { if (visible) setDraft(value ? new Date(value) : new Date()); }, [visible, value]);
  return <Sheet visible={visible} onClose={onClose} title={title || t('datePicker.selectDate')} footer={<Button title={t('common.done')} onPress={() => { onChange?.(draft); onClose(); }} />}><View style={{ paddingBottom: spacing.md }}><CalendarPicker value={draft} onChange={setDraft} maximumDate={maximumDate} /></View></Sheet>;
}
