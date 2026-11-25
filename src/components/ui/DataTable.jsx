import React from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { useIsUrdu } from '../../store/languageStore';

// Shared dense table for operational lists. Columns own their width and cell
// renderer, so Records, Stock and Expenses can share the same alignment and
// horizontal-overflow behavior without sharing domain-specific row markup.
export function DataTable({
  columns,
  data,
  keyExtractor,
  renderEmpty,
  renderHeader,
  renderFooter,
  refreshing,
  onRefresh,
  onEndReached,
  onEndReachedThreshold = 0.6,
  estimatedItemSize = 64,
  onRowPress,
  contentContainerStyle,
}) {
  const { colors, typography, spacing } = useTheme();
  const isUrdu = useIsUrdu();
  const direction = isUrdu ? 'row-reverse' : 'row';
  const tableWidth = columns.reduce((sum, column) => sum + column.width, 0);
  const cellStyle = (column, header = false) => ({
    width: column.width,
    paddingHorizontal: spacing.xs,
    textAlign: column.align || (isUrdu ? 'right' : 'left'),
    color: header ? colors.ink.secondary : colors.ink.primary,
    ...(header ? typography.caption : typography.body),
  });

  const row = ({ item }) => {
    const content = <View style={{ flexDirection: direction, alignItems: 'center', minHeight: estimatedItemSize, paddingHorizontal: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.surface.border }}>
      {columns.map((column) => { const value = column.render ? column.render(item) : item[column.key]; return <View key={column.key} style={{ width: column.width, paddingHorizontal: spacing.xs, alignItems: column.align === 'center' ? 'center' : column.align === 'right' ? 'flex-end' : 'flex-start' }}>{typeof value === 'string' || typeof value === 'number' ? <Text numberOfLines={column.numberOfLines || 1} style={cellStyle(column)}>{value}</Text> : value}</View>; })}
    </View>;
    return onRowPress ? <Pressable accessibilityRole="button" onPress={() => onRowPress(item)}>{content}</Pressable> : content;
  };

  return <View style={{ flex: 1, borderWidth: 1, borderColor: colors.surface.border, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surface.card }}>
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: tableWidth }}>
      <View style={{ width: tableWidth, flex: 1 }}>
        {renderHeader || <View style={{ flexDirection: direction, alignItems: 'center', minHeight: 38, paddingHorizontal: spacing.sm, backgroundColor: colors.surface.raised, borderBottomWidth: 1, borderBottomColor: colors.surface.border }}>{columns.map((column) => <Text key={column.key} style={cellStyle(column, true)}>{column.label}</Text>)}</View>}
        <FlatList data={data} keyExtractor={keyExtractor} renderItem={row} refreshing={refreshing} onRefresh={onRefresh} onEndReached={onEndReached} onEndReachedThreshold={onEndReachedThreshold} estimatedItemSize={estimatedItemSize} ListEmptyComponent={renderEmpty} ListFooterComponent={renderFooter} contentContainerStyle={contentContainerStyle} />
      </View>
    </ScrollView>
  </View>;
}
