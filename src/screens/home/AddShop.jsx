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

export default function AddShop() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
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
      setError('Please name your shop and choose a shop type.');
      return;
    }
    setError(null);
    createShop.mutate(
      { name, address, phone, shopTypeCode, logoAsset },
      { onSuccess: () => navigation.goBack() }
    );
  }

  const submitError = error || (createShop.isError ? createShop.error?.response?.data?.message || 'Could not create shop. Are you online?' : null);

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Svg width={16} height={16} viewBox="0 0 16 16">
              <Path d="M10.5 3l-5 5 5 5" stroke={colors.ink.primary} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <Text style={[typography.h3, { color: colors.ink.primary }]}>Add Shop</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <TextField label="Shop name" value={name} onChangeText={setName} placeholder="Noor Hardware" />
          <TextField label="Address (optional)" value={address} onChangeText={setAddress} placeholder="Johar Town, Lahore" />
          <TextField label="Phone (optional)" value={phone} onChangeText={setPhone} placeholder="+92 300 1234567" keyboardType="phone-pad" />

          <Pressable onPress={pickLogo} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            {logoAsset ? (
              <Image source={{ uri: logoAsset.uri }} style={{ width: 48, height: 48, borderRadius: radii.md }} />
            ) : (
              <View style={{ width: 48, height: 48, borderRadius: radii.md, backgroundColor: colors.surface.border, alignItems: 'center', justifyContent: 'center' }} />
            )}
            <Text style={[typography.bodyMedium, { color: colors.brand.primary }]}>Add shop logo</Text>
          </Pressable>

          <Text style={[typography.label, { color: colors.ink.secondary, marginTop: spacing.xs }]}>Shop type</Text>
          {!shopTypesData ? (
            <ActivityIndicator color={colors.brand.primary} />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
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

          {submitError ? <Text style={[typography.caption, { color: colors.semantic.danger }]}>{submitError}</Text> : null}
        </ScrollView>

        <View style={{ padding: spacing.lg }}>
          <Button title="Save Shop" onPress={handleSubmit} loading={createShop.isPending} />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
