import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProductsList from '../../screens/catalog/ProductsList';
import AddProduct from '../../screens/catalog/AddProduct';
import StockAdjustment from '../../screens/catalog/StockAdjustment';

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
