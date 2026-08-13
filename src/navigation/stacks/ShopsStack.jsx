import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ShopsList from '../../screens/home/ShopsList';
import AddShop from '../../screens/home/AddShop';

const Stack = createNativeStackNavigator();

export function ShopsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ShopsList" component={ShopsList} />
      <Stack.Screen name="AddShop" component={AddShop} />
    </Stack.Navigator>
  );
}
