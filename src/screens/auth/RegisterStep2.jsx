import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Store } from 'lucide-react-native';
import { AnimatedScreen } from '../../components/motion/AnimatedScreen';
import { RegisterWizardHeader } from './RegisterWizardHeader';
import { TextField } from '../../components/ui/TextField';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useTheme } from '../../theme';
import { useRegisterStore } from '../../store/registerStore';
import { shopTypesApi } from '../../services/shopTypesApi';
import { useT, useIsUrdu } from '../../store/languageStore';

export default function RegisterStep2() {
  const navigation = useNavigation();
  const { colors, radii, typography, spacing } = useTheme();
  const store = useRegisterStore();
  const t = useT();
  const isUrdu = useIsUrdu();
  const rowDirection = isUrdu ? 'row-reverse' : 'row';
  const textAlign = isUrdu ? 'right' : 'left';
  const [shopName, setShopName] = useState(store.shopName);
  const [shopTypeCode, setShopTypeCode] = useState(store.shopTypeCode);
  const [logoAsset, setLogoAsset] = useState(store.logoAsset);
  const [error, setError] = useState(null);

  const { data: shopTypesData, isLoading } = useQuery({
    queryKey: ['shopTypes'],
    queryFn: shopTypesApi.list,
  });
  const shopTypes = Array.isArray(shopTypesData) ? shopTypesData : shopTypesData?.shopTypes || [];

  async function pickLogo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets?.[0]) {
      setLogoAsset(result.assets[0]);
    }
  }

  function handleContinue() {
    if (!shopName || !shopTypeCode) {
      setError(t('auth.register2.errorRequired'));
      return;
    }
    setError(null);
    store.setFields({ shopName, shopTypeCode, logoAsset });
    navigation.navigate('RegisterStep3');
  }

  return (
    <AnimatedScreen>
      <SafeAreaView style={{ flex: 1 }}>
        <RegisterWizardHeader step={1} />
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <TextField label={t('auth.register2.shopName')} value={shopName} onChangeText={setShopName} placeholder="Noor Medical Store" />

          <Pressable onPress={pickLogo} style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.md }}>
            {logoAsset ? (
              <Image source={{ uri: logoAsset.uri }} style={{ width: 56, height: 56, borderRadius: radii.md }} />
            ) : (
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: radii.md,
                  backgroundColor: colors.brand.primary + '26',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera size={22} color={colors.brand.primary} strokeWidth={1.6} />
              </View>
            )}
            <View>
              <Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign }]}>{t('auth.register2.addLogo')}</Text>
              <Text style={[typography.caption, { color: colors.ink.secondary, textAlign }]}>{t('auth.register2.addLogoOptional')}</Text>
            </View>
          </Pressable>

          <Text style={[typography.label, { color: colors.ink.secondary, marginTop: spacing.xs, textAlign }]}>{t('auth.register2.shopType')}</Text>

          {isLoading ? (
            <ActivityIndicator color={colors.brand.primary} />
          ) : (
            <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: spacing.sm }}>
              {shopTypes.map((type) => {
                const selected = type.code === shopTypeCode;
                return (
                  <Card
                    key={type.code}
                    onPress={() => setShopTypeCode(type.code)}
                    level={selected ? 'sm' : 'none'}
                    bordered={false}
                    style={{
                      width: '30%',
                      borderRadius: radii.md,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: 0,
                      alignItems: 'center',
                      borderWidth: selected ? 1.5 : 1,
                      borderColor: selected ? colors.brand.primary : colors.surface.border,
                      backgroundColor: selected ? colors.brand.primary + '1F' : 'transparent',
                    }}
                  >
                    <Store size={20} color={selected ? colors.brand.primary : colors.ink.secondary} strokeWidth={1.6} />
                    <Text
                      numberOfLines={1}
                      style={[typography.caption, { color: selected ? colors.brand.primary : colors.ink.secondary, marginTop: 4, fontWeight: selected ? '700' : '400' }]}
                    >
                      {type.label}
                    </Text>
                  </Card>
                );
              })}
            </View>
          )}

          {error ? <Text style={[typography.caption, { color: colors.semantic.danger, textAlign }]}>{error}</Text> : null}
        </ScrollView>
        <View style={{ padding: spacing.lg }}>
          <Button title={t('auth.register2.continue')} onPress={handleContinue} />
        </View>
      </SafeAreaView>
    </AnimatedScreen>
  );
}
