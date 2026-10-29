import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Records from '../../screens/billing/Records';
import RecordDetail from '../../screens/billing/RecordDetail';
import RecordPayment from '../../screens/billing/RecordPayment';

const Stack = createNativeStackNavigator();

export function RecordsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RecordsList" component={Records} />
      <Stack.Screen name="RecordDetail" component={RecordDetail} />
      <Stack.Screen name="RecordPayment" component={RecordPayment} />
    </Stack.Navigator>
  );
}
