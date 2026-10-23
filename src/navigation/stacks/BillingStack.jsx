import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NewBill from '../../screens/billing/NewBill';
import Payment from '../../screens/billing/Payment';
import BillDetail from '../../screens/billing/BillDetail';
import CreditCustomers from '../../screens/billing/CreditCustomers';
import CustomerDetail from '../../screens/billing/CustomerDetail';

const Stack = createNativeStackNavigator();

export function BillingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NewBill" component={NewBill} />
      <Stack.Screen name="Payment" component={Payment} />
      <Stack.Screen name="BillDetail" component={BillDetail} />
      <Stack.Screen name="CreditCustomers" component={CreditCustomers} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetail} />
    </Stack.Navigator>
  );
}
