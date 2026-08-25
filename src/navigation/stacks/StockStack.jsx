import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StockOverview from '../../screens/stock/StockOverview';
import StockAdjustment from '../../screens/stock/StockAdjustment';

const Stack = createNativeStackNavigator();

// StockAdjustment is also registered in CatalogStack (reached by tapping a
// product row on the Products list) — registering it here too lets the
// Stock overview screen's own product-picker navigate to it without
// crossing into a sibling drawer stack.
export function StockStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StockOverview" component={StockOverview} />
      <Stack.Screen name="StockAdjustment" component={StockAdjustment} />
    </Stack.Navigator>
  );
}
