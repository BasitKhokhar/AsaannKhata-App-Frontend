import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet } from '../ui/Sheet';
import { TextField } from '../ui/TextField';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { useTheme } from '../../theme';
import { useT } from '../../store/languageStore';
import { useShopStore } from '../../store/shopStore';
import { useProductPages } from '../../hooks/useProducts';
import { productRepository } from '../../db/repositories/productRepository';

export function BarcodeUnknown(props) { return props.code ? <Unknown key={props.code} {...props} /> : null; }
function Unknown({ code, onClose, onLinked }) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const shopId = useShopStore((s) => s.activeShopId);
  const { colors, typography, spacing } = useTheme();
  const t = useT();
  const [search, setSearch] = useState('');
  const [unit, setUnit] = useState('default');
  const [error, setError] = useState('');
  const { rows, hasNextPage, loadMore } = useProductPages({ search });
  function link(product) {
    try {
      const existing = productRepository.getById(product.id);
      if (!existing || existing.shopId !== shopId || existing.isDeleted) throw new Error('barcode.notFound');
      const field = unit === 'loose' && existing.stockType === 'PACK' ? 'looseBarcode' : 'barcode';
      if (existing[field]) throw new Error('barcode.alreadyLinked');
      productRepository.update(existing.id, { [field]: code });
      queryClient.invalidateQueries({ queryKey: ['products', shopId] });
      queryClient.invalidateQueries({ queryKey: ['product', shopId, existing.id] });
      onClose(); onLinked?.(code);
    } catch (cause) { setError(t(cause.message)); }
  }
  return <Sheet visible onClose={onClose} title={t('barcode.notFound')}>
    <Text style={[typography.body, { color: colors.ink.primary }]}>{code}</Text>
    <Button title={t('barcode.createProduct')} onPress={() => { onClose(); navigation.navigate('AddProduct', { barcode: code }); }} />
    <TextField label={t('barcode.linkExisting')} value={search} onChangeText={setSearch} maxLength={128} />
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <Chip label={t('barcode.defaultUnit')} selected={unit === 'default'} onPress={() => setUnit('default')} />
      <Chip label={t('barcode.loose')} selected={unit === 'loose'} onPress={() => setUnit('loose')} />
    </View>
    {error ? <Text style={{ color: colors.semantic.danger }}>{error}</Text> : null}
    {rows.slice(0, 20).map((product) => <Button key={product.id} title={product.name} variant="outline" onPress={() => link(product)} />)}
    {rows.length > 20 || hasNextPage ? <Text style={{ color: colors.ink.secondary }}>{t('barcode.refineSearch')}</Text> : null}
  </Sheet>;
}
