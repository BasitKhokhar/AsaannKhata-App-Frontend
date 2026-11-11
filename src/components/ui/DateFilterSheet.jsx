import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { useTheme } from '../../theme';
import { useIsUrdu, useT } from '../../store/languageStore';
import { DATE_RANGE_PRESETS, dateRangeForPreset, normalizeCustomDateRange } from '../../utils/dateRanges';

const formatDate = (date) => date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export function DateFilterSheet({ visible, onClose, onSelect, showAllTime = false, value }) {
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const direction = isUrdu ? 'row-reverse' : 'row';
  const [startDate, setStartDate] = useState(() => value?.startDate ? new Date(value.startDate) : new Date());
  const [endDate, setEndDate] = useState(() => value?.endDate ? new Date(value.endDate) : new Date());
  const [pickerType, setPickerType] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setStartDate(value?.startDate ? new Date(value.startDate) : new Date());
    setEndDate(value?.endDate ? new Date(value.endDate) : new Date());
    setPickerType(null);
  }, [visible, value?.startDate, value?.endDate]);

  const select = (range, label) => {
    onSelect(range, label);
    onClose();
  };

  const selectPreset = (id) => select(dateRangeForPreset(id), id);
  const showCustomRange = () => {
    const range = normalizeCustomDateRange(startDate, endDate);
    if (range.startDate > range.endDate) return;
    select(range, 'customRange');
  };

  const rows = showAllTime ? [...DATE_RANGE_PRESETS, ['allTime']] : DATE_RANGE_PRESETS;
  const Arrow = isUrdu ? ArrowLeft : ArrowRight;

  return (
    <Sheet visible={visible} onClose={onClose} title={t('dateFilter.selectDateRange')}>
      <View style={{ flexDirection: direction, alignItems: 'center', gap: spacing.sm }}>
        <DateButton label={t('dateFilter.startDate')} value={formatDate(startDate)} onPress={() => setPickerType('start')} {...{ colors, radii, typography, spacing }} />
        <Arrow size={20} color={colors.ink.secondary} />
        <DateButton label={t('dateFilter.endDate')} value={formatDate(endDate)} onPress={() => setPickerType('end')} {...{ colors, radii, typography, spacing }} />
      </View>

      {startDate > endDate ? <Text style={[typography.caption, { color: colors.semantic.danger, textAlign: isUrdu ? 'right' : 'left' }]}>{t('dateFilter.invalidRange')}</Text> : null}
      <Button title={t('dateFilter.showReport')} onPress={showCustomRange} disabled={startDate > endDate} />

      <View style={{ gap: spacing.sm }}>
        {rows.map((row) => (
          <View key={row.join('-')} style={{ flexDirection: direction, gap: spacing.sm }}>
            {row.map((id) => (
              <Pressable
                key={id}
                onPress={() => selectPreset(id)}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 46,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: spacing.sm,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.surface.border,
                  backgroundColor: colors.surface.raised,
                  opacity: pressed ? 0.72 : 1,
                })}
              >
                <Text style={[typography.label, { color: colors.ink.primary, textAlign: 'center' }]}>{t(`dateFilter.${id}`)}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      {pickerType ? (
        <DateTimePicker
          value={pickerType === 'start' ? startDate : endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            if (Platform.OS !== 'ios') setPickerType(null);
            if (event.type === 'dismissed' || !selectedDate) return;
            if (pickerType === 'start') setStartDate(selectedDate);
            else setEndDate(selectedDate);
          }}
        />
      ) : null}
    </Sheet>
  );
}

function DateButton({ label, value, onPress, colors, radii, typography, spacing }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.surface.border, backgroundColor: colors.surface.raised, opacity: pressed ? 0.72 : 1 })}>
      <Text style={[typography.caption, { color: colors.ink.secondary, textTransform: 'uppercase' }]}>{label}</Text>
      <Text style={[typography.label, { color: colors.brand.primary, marginTop: 4 }]}>{value}</Text>
    </Pressable>
  );
}
