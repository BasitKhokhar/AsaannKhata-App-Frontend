import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useIsUrdu, useLanguageStore, useT } from '../../store/languageStore';

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const sameDay = (left, right) => left && right && startOfDay(left).getTime() === startOfDay(right).getTime();
const beforeDay = (left, right) => startOfDay(left).getTime() < startOfDay(right).getTime();
const afterDay = (left, right) => startOfDay(left).getTime() > startOfDay(right).getTime();

function monthLabel(date, locale) {
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export function CalendarPicker({ value, onChange, minDate, maxDate = new Date(), rangeStart, rangeEnd }) {
  const { colors, radii, typography, spacing } = useTheme();
  const isUrdu = useIsUrdu();
  const lang = useLanguageStore((state) => state.lang);
  const t = useT();
  const locale = lang === 'ur' ? 'ur-PK' : lang === 'hi' ? 'hi-IN' : 'en-US';
  const [visibleMonth, setVisibleMonth] = React.useState(() => {
    const initial = startOfDay(value || rangeStart || new Date());
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });

  React.useEffect(() => {
    const next = value || rangeStart;
    if (next) setVisibleMonth(new Date(new Date(next).getFullYear(), new Date(next).getMonth(), 1));
  }, [value, rangeStart]);

  const days = useMemo(() => {
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => new Date(start.getTime() + index * DAY_MS));
  }, [visibleMonth]);

  const canGoPrevious = !minDate || new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1) > new Date(new Date(minDate).getFullYear(), new Date(minDate).getMonth(), 1);
  const canGoNext = !maxDate || new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1) <= new Date(new Date(maxDate).getFullYear(), new Date(maxDate).getMonth(), 1);
  const weekdays = Array.from({ length: 7 }, (_, index) => new Date(2024, 0, 7 + index).toLocaleDateString(locale, { weekday: 'short' }));
  const direction = isUrdu ? 'row-reverse' : 'row';

  function changeMonth(amount) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  function selectDay(day) {
    if ((minDate && beforeDay(day, minDate)) || (maxDate && afterDay(day, maxDate))) return;
    onChange?.(startOfDay(day));
  }

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: direction, alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.caption, { color: colors.ink.secondary, textTransform: 'uppercase', textAlign: isUrdu ? 'right' : 'left' }]}>{t('datePicker.chooseDate')}</Text>
          <Text style={[typography.h2, { color: colors.ink.primary, textAlign: isUrdu ? 'right' : 'left' }]}>{monthLabel(visibleMonth, locale)}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <MonthButton icon={isUrdu ? ChevronRight : ChevronLeft} disabled={!canGoPrevious} onPress={() => changeMonth(-1)} colors={colors} radii={radii} />
          <MonthButton icon={isUrdu ? ChevronLeft : ChevronRight} disabled={!canGoNext} onPress={() => changeMonth(1)} colors={colors} radii={radii} />
        </View>
      </View>

      <View style={{ flexDirection: direction, backgroundColor: colors.brand.accentLight, borderRadius: radii.lg, padding: spacing.sm }}>
        {weekdays.map((day) => <Text key={day} style={[typography.label, { flex: 1, color: colors.brand.primary, textAlign: 'center' }]}>{day}</Text>)}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {days.map((day) => {
          const inMonth = day.getMonth() === visibleMonth.getMonth();
          const disabled = (minDate && beforeDay(day, minDate)) || (maxDate && afterDay(day, maxDate));
          const selected = sameDay(day, value);
          const inRange = rangeStart && rangeEnd && !beforeDay(day, rangeStart) && !afterDay(day, rangeEnd);
          const rangeEdge = sameDay(day, rangeStart) || sameDay(day, rangeEnd);
          return (
            <Pressable
              key={day.toISOString()}
              accessibilityRole="button"
              accessibilityLabel={day.toLocaleDateString(locale, { dateStyle: 'full' })}
              disabled={disabled}
              onPress={() => selectDay(day)}
              style={({ pressed }) => ({
                width: `${100 / 7}%`,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: rangeEdge || selected ? radii.md : 0,
                backgroundColor: selected || rangeEdge ? colors.brand.primary : inRange ? colors.brand.accentLight : 'transparent',
                opacity: pressed ? 0.68 : disabled ? 0.28 : inMonth ? 1 : 0.38,
              })}
            >
              <Text style={[typography.bodyMedium, { color: selected || rangeEdge ? colors.ink.onBrand : colors.ink.primary }]}>{day.getDate()}</Text>
              {sameDay(day, new Date()) ? <View style={{ width: 4, height: 4, borderRadius: 2, marginTop: 2, backgroundColor: selected || rangeEdge ? colors.ink.onBrand : colors.brand.primary }} /> : <View style={{ height: 6 }} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MonthButton({ icon: Icon, disabled, onPress, colors, radii }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => ({ width: 38, height: 38, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface.raised, borderWidth: 1, borderColor: colors.surface.border, opacity: disabled ? 0.3 : pressed ? 0.65 : 1 })}><Icon size={18} color={colors.ink.primary} /></Pressable>;
}
