import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { StaggeredList } from '../../components/motion/StaggeredList';
import { EmptyState } from '../../components/ui/EmptyState';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { PulseFab } from '../../components/motion/PulseFab';
import { useTheme } from '../../theme';
import { useCustomers, useCreateCustomer } from '../../hooks/useCustomers';
import { customerRepository } from '../../db/repositories/customerRepository';
import { useShopStore } from '../../store/shopStore';
import { formatCurrency } from '../../utils/money';
import { formatRelativeTime } from '../../utils/dates';

export default function CreditCustomers() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const activeShopId = useShopStore((s) => s.activeShopId);
  const { data: customers = [], isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const totalOutstanding = activeShopId ? customerRepository.totalOutstanding(activeShopId) : 0;
  const owing = customers.filter((c) => c.balance > 0);

  function handleAdd() {
    if (!name) return;
    createCustomer.mutate({ name, phone }, { onSuccess: () => { setAddOpen(false); setName(''); setPhone(''); } });
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <Text style={[typography.h1, { color: colors.ink.primary, padding: spacing.lg, paddingBottom: spacing.sm }]}>Credit Customers</Text>

        <View style={{ marginHorizontal: spacing.lg, marginBottom: spacing.sm }}>
          <View
            style={{
              backgroundColor: colors.semantic.dangerBg,
              borderRadius: radii.md,
              padding: spacing.md,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={[typography.caption, { color: colors.ink.secondary }]}>Total credit outstanding</Text>
            <Text style={[typography.h3, { color: colors.semantic.danger }]}>{formatCurrency(totalOutstanding)}</Text>
          </View>
        </View>

        {!isLoading && customers.length === 0 ? (
          <EmptyState
            icon={
              <Svg width={40} height={40} viewBox="0 0 24 24">
                <Path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z" fill="none" stroke={colors.brand.primary} strokeWidth={1.6} />
              </Svg>
            }
            title="No credit customers yet"
            description="Add a customer to start tracking their khata balance."
            actionLabel="Add Customer"
            onAction={() => setAddOpen(true)}
          />
        ) : (
          <StaggeredList
            data={owing.length ? owing : customers}
            estimatedItemSize={68}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 96 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.surface.border, borderRadius: radii.md, padding: spacing.sm, marginBottom: spacing.sm }}
              >
                <LinearGradient
                  colors={colors.gradient.primary}
                  style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#FAF9F6', fontWeight: '700' }}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyMedium, { color: colors.ink.primary }]}>{item.name}</Text>
                  <Text style={[typography.caption, { color: colors.ink.secondary }]}>Last: {formatRelativeTime(item.updatedAt)}</Text>
                </View>
                <Text style={[typography.bodyMedium, { color: item.balance > 0 ? colors.semantic.danger : colors.semantic.success }]}>
                  {formatCurrency(item.balance)}
                </Text>
              </Pressable>
            )}
          />
        )}

        <View style={{ position: 'absolute', bottom: spacing.xl, right: spacing.lg }}>
          <PulseFab
            onPress={() => setAddOpen(true)}
            icon={
              <Svg width={22} height={22} viewBox="0 0 16 16">
                <Path d="M8 2v12M2 8h12" stroke={colors.ink.primary} strokeWidth={1.8} strokeLinecap="round" />
              </Svg>
            }
          />
        </View>
      </SafeAreaView>

      <Modal visible={addOpen} transparent animationType="fade" onRequestClose={() => setAddOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface.bg, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg, gap: spacing.md }}>
            <Text style={[typography.h2, { color: colors.ink.primary }]}>Add Customer</Text>
            <TextField label="Name" value={name} onChangeText={setName} placeholder="Sana K." />
            <TextField label="Phone (optional)" value={phone} onChangeText={setPhone} placeholder="+92 300 1234567" keyboardType="phone-pad" />
            <Button title="Save Customer" onPress={handleAdd} />
            <Button title="Cancel" variant="ghost" onPress={() => setAddOpen(false)} />
          </View>
        </View>
      </Modal>
    </AnimatedScreen>
  );
}
