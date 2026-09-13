import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../theme';
import { useCreateShop } from '../../hooks/useShops';
import { shopTypesApi } from '../../services/shopTypesApi';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function AddShop() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [shopTypeCode, setShopTypeCode] = useState('');
  const [logoAsset, setLogoAsset] = useState(null);
  const [error, setError] = useState(null);
  const createShop = useCreateShop();

  const { data: shopTypesData } = useQuery({ queryKey: ['shopTypes'], queryFn: shopTypesApi.list });
  const shopTypes = Array.isArray(shopTypesData) ? shopTypesData : shopTypesData?.shopTypes || [];

  async function pickLogo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets?.[0]) setLogoAsset(result.assets[0]);
  }

  function handleSubmit() {
    if (!name || !shopTypeCode) {
      setError(t('auth.register2.errorRequired'));
      return;
    }
    setError(null);
    createShop.mutate(
      { name, address, phone, shopTypeCode, logoAsset },
      { onSuccess: () => navigation.goBack() }
    );
  }

  const submitError = error || (createShop.isError ? createShop.error?.response?.data?.message || t('home.addShop.genericError') : null);

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.sm, padding: spacing.lg }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Svg width={16} height={16} viewBox="0 0 16 16" style={isUrdu ? { transform: [{ scaleX: -1 }] } : undefined}>
              <Path d="M10.5 3l-5 5 5 5" stroke={colors.ink.primary} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <Text style={[typography.h3, { color: colors.ink.primary }]}>{t('home.addShop.title')}</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <TextField label={t('home.addShop.shopName')} value={name} onChangeText={setName} placeholder="Noor Hardware" style={{ textAlign }} />
          <TextField label={t('home.addShop.addressOptional')} value={address} onChangeText={setAddress} placeholder="Johar Town, Lahore" style={{ textAlign }} />
          <TextField label={t('home.addShop.phoneOptional')} value={phone} onChangeText={setPhone} placeholder="+92 300 1234567" keyboardType="phone-pad" style={{ textAlign }} />

          <Pressable onPress={pickLogo} style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.md }}>
            {logoAsset ? (
              <Image source={{ uri: logoAsset.uri }} style={{ width: 48, height: 48, borderRadius: radii.md }} />
            ) : (
              <View style={{ width: 48, height: 48, borderRadius: radii.md, backgroundColor: colors.surface.border, alignItems: 'center', justifyContent: 'center' }} />
            )}
            <Text style={[typography.bodyMedium, { color: colors.brand.primary }]}>{t('auth.register2.addLogo')}</Text>
          </Pressable>

          <Text style={[typography.label, { color: colors.ink.secondary, marginTop: spacing.xs, textAlign }]}>{t('auth.register2.shopType')}</Text>
          {!shopTypesData ? (
            <ActivityIndicator color={colors.brand.primary} />
          ) : (
            <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: spacing.sm }}>
              {shopTypes.map((type) => {
                const selected = type.code === shopTypeCode;
                return (
                  <Pressable
                    key={type.code}
                    onPress={() => setShopTypeCode(type.code)}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderRadius: radii.pill,
                      borderWidth: selected ? 1.5 : 1,
                      borderColor: selected ? colors.brand.primary : colors.surface.border,
                      backgroundColor: selected ? colors.brand.primary + '1F' : 'transparent',
                    }}
                  >
                    <Text style={[typography.caption, { color: selected ? colors.brand.primary : colors.ink.secondary, fontWeight: selected ? '700' : '400' }]}>
                      {type.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {submitError ? <Text style={[typography.caption, { color: colors.semantic.danger, textAlign }]}>{submitError}</Text> : null}
        </ScrollView>

        <View style={{ padding: spacing.lg }}>
          <Button title={t('home.addShop.saveShop')} onPress={handleSubmit} loading={createShop.isPending} />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
