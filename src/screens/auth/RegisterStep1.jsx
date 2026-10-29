import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Store, ShoppingBasket, Package, Wrench, Shirt, Smartphone, HeartPulse, Utensils, Scissors, Car } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { RegisterWizardHeader } from './RegisterWizardHeader';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { KeyboardAwareScrollView, KeyboardAwareView } from '../../components/ui/KeyboardAware';
import { useTheme } from '../../theme';
import { useRegisterStore } from '../../store/registerStore';
import { shopTypesApi } from '../../services/shopTypesApi';
import { useT, useIsUrdu } from '../../store/languageStore';

const iconForType = (code) => {
  if (/GROCERY|GENERAL/.test(code)) return ShoppingBasket;
  if (/PHARMACY|MEDIC/.test(code)) return HeartPulse;
  if (/HARDWARE|ELECTRIC|PIPE|CABLE/.test(code)) return Wrench;
  if (/CLOTH|FABRIC|FOOTWEAR/.test(code)) return Shirt;
  if (/MOBILE|ELECTRONIC/.test(code)) return Smartphone;
  if (/BAKERY|RESTAURANT|FOOD/.test(code)) return Utensils;
  if (/SALON|BEAUTY/.test(code)) return Scissors;
  if (/AUTO|PARTS/.test(code)) return Car;
  if (/TILE|WOOD|GLASS|MARBLE/.test(code)) return Package;
  return Store;
};

export default function RegisterStep1() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const shopTypeCode = useRegisterStore((s) => s.shopTypeCode);
  const setFields = useRegisterStore((s) => s.setFields);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['shopTypes'], queryFn: shopTypesApi.list });
  const types = Array.isArray(data) ? data : data?.shopTypes || [];
  const visible = useMemo(() => types.filter((type) => `${type.label} ${type.labelUrdu || ''} ${type.code}`.toLowerCase().includes(search.trim().toLowerCase())), [types, search]);

  function next() {
    if (!shopTypeCode) {
      setError(t('auth.register2.errorRequired'));
      return;
    }
    navigation.navigate('RegisterStep2');
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <RegisterWizardHeader step={0} />
        <KeyboardAwareView>
          <KeyboardAwareScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
            <TextField label={t('auth.register2.shopType')} value={search} onChangeText={setSearch} placeholder={t('auth.businessType.search')} />
            {isLoading ? <ActivityIndicator color={colors.brand.primary} /> : null}
            {isError ? <Button title={t('auth.businessType.retry')} variant="outline" onPress={refetch} /> : null}
            <View style={{ flexDirection: isUrdu ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {visible.map((type, index) => {
                const Icon = iconForType(type.code);
                const selected = type.code === shopTypeCode;
                const tint = [colors.brand.primary, colors.semantic.warning, colors.brand.accent, colors.semantic.success][index % 4];
                return (
                  <Pressable
                    key={type.code}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => { setFields({ shopTypeCode: type.code }); setError(null); }}
                    style={{ width: '31%', minWidth: 94, minHeight: 100, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderWidth: selected ? 2 : 1, borderColor: selected ? colors.brand.primary : colors.surface.border, backgroundColor: colors.surface.raised, borderRadius: radii.md, padding: spacing.xs }}
                  >
                    <View style={{ width: 42, height: 42, borderRadius: radii.md, backgroundColor: tint + '1A', alignItems: 'center', justifyContent: 'center' }}><Icon size={22} color={tint} strokeWidth={1.8} /></View>
                    <Text numberOfLines={2} style={[typography.label, { color: colors.ink.primary, textAlign: 'center', fontSize: 11 }]}>{(isUrdu && type.labelUrdu) || type.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {!isLoading && !isError && !visible.length ? <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: 'center' }]}>{t('auth.businessType.empty')}</Text> : null}
            {error ? <Text style={[typography.caption, { color: colors.semantic.danger }]}>{error}</Text> : null}
          </KeyboardAwareScrollView>
          <View style={{ padding: spacing.lg }}><Button title={t('common.next')} onPress={next} /></View>
        </KeyboardAwareView>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
