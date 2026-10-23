import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Plus, Search } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { StaggeredList } from '../../components/motion/StaggeredList';
import { EmptyState } from '../../components/ui/EmptyState';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { StatCard } from '../../components/ui/StatCard';
import { ListRow } from '../../components/ui/ListRow';
import { Sheet } from '../../components/ui/Sheet';
import { PulseFab } from '../../components/motion/PulseFab';
import { useTheme } from '../../theme';
import { useCustomers, useCreateCustomer } from '../../hooks/useCustomers';
import { customerRepository } from '../../db/repositories/customerRepository';
import { useShopStore } from '../../store/shopStore';
import { formatCurrency } from '../../utils/money';
import { formatRelativeTime } from '../../utils/dates';
import { showToast } from '../../store/toastStore';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function CreditCustomers() {
  const navigation = useNavigation();
  const { colors, typography, spacing } = useTheme();
  const activeShopId = useShopStore((s) => s.activeShopId);
  const { data: customers = [], isLoading, isRefetching, refetch } = useCustomers();
  const createCustomer = useCreateCustomer();
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const t = useT();
  const isUrdu = useIsUrdu();
  const textAlign = isUrdu ? 'right' : 'left';

  const totalOutstanding = activeShopId ? customerRepository.totalOutstanding(activeShopId) : 0;
  const visible = customers.filter((customer) => `${customer.name} ${customer.phone || ''}`.toLowerCase().includes(search.trim().toLowerCase()));

  function handleAdd() {
    if (!name) return;
    createCustomer.mutate(
      { name, phone },
      {
        onSuccess: () => {
          setAddOpen(false);
          setName('');
          setPhone('');
          showToast(t('billing.creditCustomers.customerAdded'), 'success');
        },
      }
    );
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <Text style={[typography.h1, { color: colors.ink.primary, padding: spacing.lg, paddingBottom: spacing.sm, textAlign }]}>{t('nav.creditCustomers')}</Text>

        <View style={{ marginHorizontal: spacing.lg, marginBottom: spacing.sm }}>
          <StatCard
            icon={<Users size={18} color={colors.semantic.danger} strokeWidth={1.8} />}
            value={formatCurrency(totalOutstanding)}
            label={t('billing.creditCustomers.totalOutstanding')}
            tone="danger"
          />
        </View>

        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          <TextField value={search} onChangeText={setSearch} placeholder={t('billing.creditCustomers.searchPlaceholder')} right={<Search size={16} color={colors.ink.secondary} />} />
        </View>

        {!isLoading && customers.length === 0 ? (
          <EmptyState
            icon={<Users size={32} color={colors.brand.primary} strokeWidth={1.6} />}
            title={t('billing.creditCustomers.emptyTitle')}
            description={t('billing.creditCustomers.emptyDescription')}
            actionLabel={t('billing.creditCustomers.addCustomer')}
            onAction={() => setAddOpen(true)}
          />
        ) : (
          <StaggeredList
            data={visible}
            estimatedItemSize={68}
            refreshing={isRefetching}
            onRefresh={refetch}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 96 }}
            renderItem={({ item }) => (
              <ListRow
                onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
                style={{ backgroundColor: colors.surface.card, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.surface.border }}
                leading={
                  <LinearGradient
                    colors={colors.gradient.primary}
                    style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: colors.ink.onBrand, fontWeight: '700' }}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
                  </LinearGradient>
                }
                title={item.name}
                subtitle={t('billing.creditCustomers.lastActivity').replace('{time}', formatRelativeTime(item.updatedAt))}
                trailing={
                  <Text style={[typography.bodyMedium, { color: item.balance > 0 ? colors.semantic.danger : colors.semantic.success }]}>
                    {formatCurrency(item.balance)}
                  </Text>
                }
              />
            )}
          />
        )}

        <View style={{ position: 'absolute', bottom: spacing.xl, right: spacing.lg }}>
          <PulseFab onPress={() => setAddOpen(true)} icon={<Plus size={22} color={colors.ink.primary} strokeWidth={2} />} />
        </View>
      </SafeAreaView>

      <Sheet visible={addOpen} onClose={() => setAddOpen(false)} title={t('billing.creditCustomers.addCustomer')}>
        <TextField label={t('billing.creditCustomers.name')} value={name} onChangeText={setName} placeholder="Sana K." style={{ textAlign }} />
        <TextField label={t('billing.creditCustomers.phoneOptional')} value={phone} onChangeText={setPhone} placeholder="+92 300 1234567" keyboardType="phone-pad" style={{ textAlign }} />
        <Button title={t('billing.creditCustomers.saveCustomer')} onPress={handleAdd} loading={createCustomer.isPending} />
        <Button title={t('common.cancel')} variant="ghost" onPress={() => setAddOpen(false)} />
      </Sheet>
    </AnimatedScreen>
  );
}
