import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, ReceiptText, Store, Zap, Users, Truck, MoreHorizontal, Trash2 } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { Card } from '../../components/ui/Card';
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
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const { data: rows = [], isLoading } = useExpenses();
  const actions = useExpenseActions();
  const [filter, setFilter] = useState('all');
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState(null);
  const visible = useMemo(() => {
    const now = new Date();
    return rows.filter((row) => {
      const date = new Date(row.occurredAt);
      if (filter === 'today') return date.toDateString() === now.toDateString();
      if (filter === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      return true;
    });
  }, [rows, filter]);
  const total = visible.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

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
      <SafeAreaView style={{ flex: 1 }}>
        <Text style={[typography.h1, { color: colors.ink.primary, padding: spacing.lg, paddingBottom: spacing.sm, textAlign: isUrdu ? 'right' : 'left' }]}>{t('nav.expenses')}</Text>
        <View style={{ flexDirection: isUrdu ? 'row-reverse' : 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
          {['all', 'today', 'month'].map((key) => <Chip key={key} label={t(`expenses.filter.${key}`)} selected={filter === key} onPress={() => setFilter(key)} />)}
        </View>
        <Card style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.xs }}>
          <Text style={[typography.caption, { color: colors.ink.secondary }]}>{t('expenses.total')}</Text>
          <Text style={[typography.numericLarge, { color: colors.ink.primary }]}>{formatCurrency(total)}</Text>
        </Card>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 90, gap: spacing.sm }}>
          {!isLoading && !visible.length ? <EmptyState icon={<ReceiptText size={32} color={colors.brand.primary} />} title={t('expenses.empty')} description={t('expenses.emptyDescription')} actionLabel={t('expenses.add')} onAction={() => setDraft(defaultDraft())} /> : null}
          {visible.map((row) => {
            const meta = categories.find((item) => item.key === row.category) || categories.at(-1);
            const Icon = meta.icon;
            return (
              <Pressable key={row.id} onPress={() => edit(row)} style={{ flexDirection: isUrdu ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: colors.surface.raised, borderRadius: radii.md, borderWidth: 1, borderColor: colors.surface.border }}>
                <View style={{ width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.brand.primary + '16', alignItems: 'center', justifyContent: 'center' }}><Icon size={19} color={colors.brand.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: isUrdu ? 'right' : 'left' }]}>{t(`expenses.category.${meta.key}`)}</Text>
                  <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: isUrdu ? 'right' : 'left' }]}>{new Date(row.occurredAt).toLocaleDateString()} {row.note ? `· ${row.note}` : ''}</Text>
                </View>
                <Text style={[typography.bodyMedium, { color: colors.semantic.danger }]}>{formatCurrency(row.amount)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Pressable accessibilityRole="button" accessibilityLabel={t('expenses.add')} onPress={() => setDraft(defaultDraft())} style={{ position: 'absolute', right: spacing.lg, bottom: spacing.xl, width: 52, height: 52, borderRadius: 26, backgroundColor: colors.brand.primary, alignItems: 'center', justifyContent: 'center' }}><Plus size={24} color={colors.ink.onBrand} /></Pressable>
      </SafeAreaView>
      <Sheet visible={!!draft} onClose={() => setDraft(null)} title={draft?.id ? t('expenses.edit') : t('expenses.add')}>
        {draft ? <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: isUrdu ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {categories.map((item) => <Chip key={item.key} label={t(`expenses.category.${item.key}`)} selected={draft.category === item.key} onPress={() => setDraft((value) => ({ ...value, category: item.key }))} />)}
          </View>
          <TextField label={t('expenses.amount')} value={draft.amount} onChangeText={(amount) => setDraft((value) => ({ ...value, amount }))} keyboardType="decimal-pad" />
          <TextField label={t('expenses.date')} value={draft.date} onChangeText={(date) => setDraft((value) => ({ ...value, date }))} placeholder="YYYY-MM-DD" />
          <TextField label={t('expenses.note')} value={draft.note} onChangeText={(note) => setDraft((value) => ({ ...value, note }))} maxLength={190} multiline />
          {error ? <Text style={[typography.caption, { color: colors.semantic.danger }]}>{error}</Text> : null}
          <Button title={t('common.save')} onPress={save} />
          {draft.id ? <Button title={t('expenses.delete')} variant="danger" icon={<Trash2 size={17} color={colors.semantic.danger} />} onPress={remove} /> : null}
        </View> : null}
      </Sheet>
    </AnimatedScreen>
  );
}
