import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProductsList from '../../screens/catalog/ProductsList';
import AddProduct from '../../screens/catalog/AddProduct';
// Lives in screens/stock now (conceptually Stock-domain) — also registered
// in StockStack.jsx as its own entry point from the Stock overview screen.
// ProductsList still navigates here directly by name within this stack.
import StockAdjustment from '../../screens/stock/StockAdjustment';

const Stack = createNativeStackNavigator();

export function CatalogStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductsList" component={ProductsList} />
      <Stack.Screen name="AddProduct" component={AddProduct} />
      <Stack.Screen name="StockAdjustment" component={StockAdjustment} />
    </Stack.Navigator>
  );
}
