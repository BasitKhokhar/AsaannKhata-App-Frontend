import React, { useMemo, useState } from 'react';
import { View, Text, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Plus, Search, Pencil } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { StaggeredList } from '../../components/motion/StaggeredList';
import { EmptyState } from '../../components/ui/EmptyState';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { Header } from '../../components/ui/Header';
import { ListRow } from '../../components/ui/ListRow';
import { PulseFab } from '../../components/motion/PulseFab';
import { useTheme } from '../../theme';
import { useCustomers, useCreateCustomer, useUpdateCustomer } from '../../hooks/useCustomers';
import { joinCustomerName, splitCustomerName } from '../../utils/customerName';
import { showToast } from '../../store/toastStore';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function CreditCustomers() {
  const { colors, typography, spacing, radii, elevation } = useTheme();
  const { data: customers = [], isLoading, isRefetching, refetch } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [search, setSearch] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return customers;
    return customers.filter((customer) => `${customer.name} ${customer.phone || ''}`.toLocaleLowerCase().includes(query));
  }, [customers, search]);

  function resetForm() {
    setFirstName('');
    setLastName('');
    setPhone('');
    setEditingCustomer(null);
  }

  function openAdd() {
    resetForm();
    setFormOpen(true);
  }

  function openEdit(customer) {
    const parts = splitCustomerName(customer.name);
    setEditingCustomer(customer);
    setFirstName(parts.firstName);
    setLastName(parts.lastName);
    setPhone(customer.phone || '');
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    resetForm();
  }

  function saveCustomer() {
    const name = joinCustomerName(firstName, lastName);
    if (!name) {
      showToast(t('billing.creditCustomers.nameRequired'), 'error');
      return;
    }
    const onSuccess = () => {
      closeForm();
      showToast(t(editingCustomer ? 'billing.creditCustomers.customerUpdated' : 'billing.creditCustomers.customerAdded'), 'success');
    };
    const onError = (error) => showToast(t(error?.message || 'billing.creditCustomers.saveFailed'), 'error');
    if (editingCustomer) updateCustomer.mutate(editingCustomer.id, { name, phone }, { onSuccess, onError });
    else createCustomer.mutate({ name, phone }, { onSuccess, onError });
  }

  return (
    <AnimatedScreen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <Header title={t('nav.creditCustomers')} />
        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
          <TextField
            value={search}
            onChangeText={setSearch}
            placeholder={t('billing.creditCustomers.searchPlaceholder')}
            right={<Search size={16} color={colors.ink.secondary} />}
          />
        </View>

        {!isLoading && customers.length === 0 ? (
          <EmptyState
            icon={<Users size={32} color={colors.brand.primary} strokeWidth={1.6} />}
            title={t('billing.creditCustomers.emptyTitle')}
            description={t('billing.creditCustomers.emptyDescription')}
            actionLabel={t('billing.creditCustomers.addCustomer')}
            onAction={openAdd}
          />
        ) : (
          <StaggeredList
            data={visible}
            estimatedItemSize={72}
            keyExtractor={(item) => item.id}
            getItemType={() => 'customer'}
            refreshing={isRefetching}
            onRefresh={refetch}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 96 }}
            ListEmptyComponent={<Text style={[typography.caption, { color: colors.ink.secondary, textAlign, paddingVertical: spacing.xl }]}>{t('billing.creditCustomers.noSearchResults')}</Text>}
            renderItem={({ item }) => (
              <ListRow
                onPress={() => openEdit(item)}
                style={{ backgroundColor: colors.surface.card, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.surface.border, flexDirection: rowDirection, minHeight: 68 }}
                leading={
                  <LinearGradient colors={colors.gradient.primary} style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: colors.ink.onBrand, fontWeight: '700' }}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
                  </LinearGradient>
                }
                title={item.name}
                titleStyle={{ textAlign }}
                subtitle={item.phone || t('billing.creditCustomers.noPhone')}
                subtitleStyle={{ textAlign }}
                trailing={<Pencil size={17} color={colors.brand.primary} strokeWidth={1.8} />}
              />
            )}
          />
        )}

        <View style={{ position: 'absolute', bottom: spacing.lg, ...(isUrdu ? { left: spacing.lg } : { right: spacing.lg }) }}>
          <PulseFab onPress={openAdd} icon={<Plus size={22} color={colors.ink.onBrand} strokeWidth={2} />} />
        </View>
      </SafeAreaView>

      <Modal visible={formOpen} transparent animationType="fade" onRequestClose={closeForm}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
          <Pressable onPress={closeForm} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.surface.overlay }} />
          <View style={[{ width: '100%', maxWidth: 440, borderRadius: radii.xl, backgroundColor: colors.surface.card, padding: spacing.lg, gap: spacing.md }, elevation.xl]}>
            <Text style={[typography.h2, { color: colors.ink.primary, textAlign }]}>{t(editingCustomer ? 'billing.creditCustomers.editCustomer' : 'billing.creditCustomers.addCustomer')}</Text>
            <View style={{ flexDirection: rowDirection, gap: spacing.sm }}>
              <TextField style={{ flex: 1 }} label={t('billing.payment.firstName')} value={firstName} onChangeText={setFirstName} placeholder={t('billing.payment.firstNamePlaceholder')} textAlign={textAlign} />
              <TextField style={{ flex: 1 }} label={t('billing.payment.lastName')} value={lastName} onChangeText={setLastName} placeholder={t('billing.payment.lastNamePlaceholder')} textAlign={textAlign} />
            </View>
            <TextField label={t('billing.creditCustomers.phoneOptional')} value={phone} onChangeText={setPhone} placeholder="+92 300 1234567" keyboardType="phone-pad" textAlign={textAlign} />
            <Button title={t(editingCustomer ? 'billing.creditCustomers.updateCustomer' : 'billing.creditCustomers.saveCustomer')} onPress={saveCustomer} />
            <Button title={t('common.cancel')} variant="ghost" onPress={closeForm} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </AnimatedScreen>
  );
}
