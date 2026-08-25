import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Plus } from 'lucide-react-native';
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

export default function CreditCustomers() {
  const navigation = useNavigation();
  const { colors, typography, spacing } = useTheme();
  const activeShopId = useShopStore((s) => s.activeShopId);
  const { data: customers = [], isLoading, isRefetching, refetch } = useCustomers();
  const createCustomer = useCreateCustomer();
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const totalOutstanding = activeShopId ? customerRepository.totalOutstanding(activeShopId) : 0;
  const owing = customers.filter((c) => c.balance > 0);

  function handleAdd() {
    if (!name) return;
    createCustomer.mutate(
      { name, phone },
      {
        onSuccess: () => {
          setAddOpen(false);
          setName('');
          setPhone('');
          showToast('Customer added', 'success');
        },
      }
    );
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <Text style={[typography.h1, { color: colors.ink.primary, padding: spacing.lg, paddingBottom: spacing.sm }]}>Credit Customers</Text>

        <View style={{ marginHorizontal: spacing.lg, marginBottom: spacing.sm }}>
          <StatCard
            icon={<Users size={18} color={colors.semantic.danger} strokeWidth={1.8} />}
            value={formatCurrency(totalOutstanding)}
            label="Total credit outstanding"
            tone="danger"
          />
        </View>

        {!isLoading && customers.length === 0 ? (
          <EmptyState
            icon={<Users size={32} color={colors.brand.primary} strokeWidth={1.6} />}
            title="No credit customers yet"
            description="Add a customer to start tracking their khata balance."
            actionLabel="Add Customer"
            onAction={() => setAddOpen(true)}
          />
        ) : (
          <StaggeredList
            data={owing.length ? owing : customers}
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
                subtitle={`Last: ${formatRelativeTime(item.updatedAt)}`}
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

      <Sheet visible={addOpen} onClose={() => setAddOpen(false)} title="Add Customer">
        <TextField label="Name" value={name} onChangeText={setName} placeholder="Sana K." />
        <TextField label="Phone (optional)" value={phone} onChangeText={setPhone} placeholder="+92 300 1234567" keyboardType="phone-pad" />
        <Button title="Save Customer" onPress={handleAdd} loading={createCustomer.isPending} />
        <Button title="Cancel" variant="ghost" onPress={() => setAddOpen(false)} />
      </Sheet>
    </AnimatedScreen>
  );
}
