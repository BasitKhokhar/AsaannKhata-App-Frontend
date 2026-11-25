import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, ReceiptText, Store, Zap, Users, Truck, MoreHorizontal, Trash2, Pencil } from 'lucide-react-native';
import { Header } from '../../components/ui/Header';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { DataTable } from '../../components/ui/DataTable';
import { Chip } from '../../components/ui/Chip';
import { Sheet } from '../../components/ui/Sheet';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useTheme } from '../../theme';
import { useExpenses, useExpenseActions } from '../../hooks/useExpenses';
import { useT, useIsUrdu } from '../../store/languageStore';
import { formatCurrency } from '../../utils/money';
import { showToast } from '../../store/toastStore';
import { showConfirm } from '../../store/confirmStore';
import { DateFilterSection } from '../../components/ui/DateFilterSection';
import { DateFilterSheet } from '../../components/ui/DateFilterSheet';
import { DatePickerField, DatePickerSheet } from '../../components/ui/DatePickerSheet';
import { dateIsInRange, dateRangeForPreset, dateRangeLabel } from '../../utils/dateRanges';

const categories = [
  { key: 'RENT', icon: Store }, { key: 'UTILITIES', icon: Zap },
  { key: 'SALARY', icon: Users }, { key: 'TRANSPORT', icon: Truck },
  { key: 'OTHER', icon: MoreHorizontal },
];

function defaultDraft() {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return { id: null, category: 'OTHER', amount: '', note: '', date };
}

export default function Expenses() {
  const { colors, radii, typography, spacing, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const t = useT();
  const isUrdu = useIsUrdu();
  const { data: rows = [], isLoading } = useExpenses();
  const actions = useExpenseActions();
  const [dateRange, setDateRange] = useState(() => dateRangeForPreset('allTime'));
  const [dateRangeId, setDateRangeId] = useState('allTime');
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const visible = useMemo(() => {
    return rows.filter((row) => dateIsInRange(row.occurredAt, dateRange));
  }, [rows, dateRange]);
  const total = visible.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  const columns = [
    { key: 'expense', label: t('expenses.tableExpense'), width: 190, render: (row) => { const meta = categories.find((item) => item.key === row.category) || categories.at(-1); const Icon = meta.icon; return <View style={{ flexDirection: isUrdu ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing.sm }}><Icon size={16} color={colors.brand.primary} /><View style={{ flex: 1 }}><Text numberOfLines={1} style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: isUrdu ? 'right' : 'left' }]}>{t(`expenses.category.${meta.key}`)}</Text>{row.note ? <Text numberOfLines={1} style={[typography.caption, { color: colors.ink.secondary, textAlign: isUrdu ? 'right' : 'left' }]}>{row.note}</Text> : null}</View></View>; } },
    { key: 'date', label: t('expenses.tableDate'), width: 110, render: (row) => new Date(row.occurredAt).toLocaleDateString() },
    { key: 'amount', label: t('expenses.amount'), width: 105, align: 'right', render: (row) => <Text style={{ color: colors.semantic.danger }}>{formatCurrency(row.amount)}</Text> },
    { key: 'actions', label: '', width: 58, align: 'center', render: (row) => <Pencil size={16} color={colors.ink.secondary} /> },
  ];

  function edit(row) {
    const date = new Date(row.occurredAt);
    setDraft({ id: row.id, category: row.category, amount: String(row.amount), note: row.note || '', date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` });
    setError(null);
  }

  function save() {
    const amount = Number(draft.amount);
    const validFormat = /^\d{4}-\d{2}-\d{2}$/.test(draft.date);
    const [year, month, day] = draft.date.split('-').map(Number);
    const date = validFormat ? new Date(year, month - 1, day, 12) : new Date(NaN);
    if (!Number.isFinite(amount) || amount <= 0 || Number.isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      setError(t('expenses.invalidFields'));
      return;
    }
    try {
      const fields = { category: draft.category, amount, note: draft.note.trim() || null, occurredAt: date.toISOString() };
      if (draft.id) actions.update(draft.id, fields);
      else actions.create(fields);
      setDraft(null);
      showToast(t('expenses.saved'), 'success');
    } catch (saveError) {
      setError(saveError.message || t('expenses.saveFailed'));
    }
  }

  async function remove() {
    const confirmed = await showConfirm({ title: t('expenses.deleteTitle'), message: t('expenses.deleteMessage'), confirmLabel: t('expenses.delete'), cancelLabel: t('common.cancel'), isUrgent: true });
    if (confirmed) {
      actions.remove(draft.id);
      setDraft(null);
      showToast(t('expenses.deleted'), 'success');
    }
  }

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header title={t('nav.expenses')} />
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}><DateFilterSection selectedRange={dateRangeLabel(dateRange, dateRangeId, t)} onPress={() => setDateFilterOpen(true)} /><View style={{ marginTop: spacing.sm, flexDirection: isUrdu ? 'row-reverse' : 'row', alignItems: 'baseline', gap: spacing.sm }}><Text style={[typography.caption, { color: colors.ink.secondary }]}>{t('expenses.total')}</Text><Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{formatCurrency(total)}</Text><Text style={[typography.caption, { color: colors.ink.secondary }]}>{visible.length} {visible.length === 1 ? t('expenses.entry') : t('expenses.entries')}</Text></View></View>
        <View style={{ flex: 1, marginHorizontal: spacing.lg }}><DataTable columns={columns} data={isLoading ? [] : visible} keyExtractor={(item) => item.id} estimatedItemSize={62} onRowPress={edit} renderEmpty={isLoading ? null : <EmptyState icon={<ReceiptText size={32} color={colors.brand.primary} />} title={t('expenses.empty')} description={t('expenses.emptyDescription')} actionLabel={t('expenses.add')} onAction={() => setDraft(defaultDraft())} />} contentContainerStyle={{ paddingBottom: 104 + insets.bottom }} /></View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('expenses.add')} onPress={() => setDraft(defaultDraft())} style={{ position: 'absolute', right: spacing.lg, bottom: insets.bottom + spacing.lg, width: 58, height: 58, borderRadius: 29, backgroundColor: colors.brand.primary, alignItems: 'center', justifyContent: 'center', ...elevation.lg }}><Plus size={25} color={colors.ink.onBrand} /></Pressable>
      </SafeAreaView>
      <Sheet
        visible={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? t('expenses.edit') : t('expenses.add')}
        placement="bottom"
        footer={draft ? <View style={{ gap: spacing.sm }}><Button title={t('common.save')} onPress={save} /><>{draft.id ? <Button title={t('expenses.delete')} variant="danger" icon={<Trash2 size={17} color={colors.semantic.danger} />} onPress={remove} /> : null}</></View> : null}
      >
        {draft ? <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: isUrdu ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {categories.map((item) => <Chip key={item.key} label={t(`expenses.category.${item.key}`)} selected={draft.category === item.key} onPress={() => setDraft((value) => ({ ...value, category: item.key }))} />)}
          </View>
          <TextField label={t('expenses.amount')} value={draft.amount} onChangeText={(amount) => setDraft((value) => ({ ...value, amount }))} keyboardType="decimal-pad" />
          <DatePickerField label={t('expenses.date')} value={new Date(`${draft.date}T12:00:00`)} onPress={() => setDatePickerOpen(true)} />
          <TextField label={t('expenses.note')} value={draft.note} onChangeText={(note) => setDraft((value) => ({ ...value, note }))} maxLength={190} multiline />
          {error ? <Text style={[typography.caption, { color: colors.semantic.danger }]}>{error}</Text> : null}
        </View> : null}
      </Sheet>
      <DatePickerSheet
        visible={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        value={draft ? new Date(`${draft.date}T12:00:00`) : new Date()}
        title={t('expenses.date')}
        onChange={(date) => setDraft((value) => ({ ...value, date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }))}
      />
      <DateFilterSheet
        visible={dateFilterOpen}
        onClose={() => setDateFilterOpen(false)}
        value={dateRange}
        showAllTime
        onSelect={(range, label) => {
          setDateRange(range);
          setDateRangeId(label);
        }}
      />
    </AnimatedScreen>
  );
}
