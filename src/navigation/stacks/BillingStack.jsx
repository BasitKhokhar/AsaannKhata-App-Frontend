import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NewBill from '../../screens/billing/NewBill';
import Payment from '../../screens/billing/Payment';
import BillDetail from '../../screens/billing/BillDetail';
import CreditCustomers from '../../screens/billing/CreditCustomers';
import CustomerDetail from '../../screens/billing/CustomerDetail';
import RecordDetail from '../../screens/billing/RecordDetail';
import RecordPayment from '../../screens/billing/RecordPayment';
import AddProduct from '../../screens/catalog/AddProduct';

const Stack = createNativeStackNavigator();

export function BillingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NewBill" component={NewBill} />
      <Stack.Screen name="Payment" component={Payment} />
      <Stack.Screen name="BillDetail" component={BillDetail} />
      <Stack.Screen name="CreditCustomers" component={CreditCustomers} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetail} />
      <Stack.Screen name="RecordDetail" component={RecordDetail} />
      <Stack.Screen name="RecordPayment" component={RecordPayment} />
      <Stack.Screen name="AddProduct" component={AddProduct} />
    </Stack.Navigator>
  );
}
