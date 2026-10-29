import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { HomeStack } from './stacks/HomeStack';
import { CatalogStack } from './stacks/CatalogStack';
import { StockStack } from './stacks/StockStack';
import { BillingStack } from './stacks/BillingStack';
import { SettingsStack } from './stacks/SettingsStack';
import { ShopsStack } from './stacks/ShopsStack';
import SalesReport from '../screens/reports/SalesReport';
import Expenses from '../screens/expenses/Expenses';
import SubscriptionPlans from '../screens/subscription/SubscriptionPlans';
import EarnCoins from '../screens/subscription/EarnCoins';
import Notifications from '../screens/shared/Notifications';
import { RecordsStack } from './stacks/RecordsStack';
import { SidebarContent } from '../components/drawer/SidebarContent';

const Drawer = createDrawerNavigator();

// Mirrors the design's sidebar order: Dashboard / Billing / Products / Stock
// / Credit Customers / Reports / My Shops / Notifications / Subscription /
// Settings — rendered by the on-brand SidebarContent, not the default list.
export function AppDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: false, drawerType: 'front', overlayColor: 'rgba(0,0,0,0.4)' }}
      drawerContent={(props) => <SidebarContent {...props} />}
    >
      <Drawer.Screen name="HomeStack" component={HomeStack} />
      <Drawer.Screen name="BillingStack" component={BillingStack} />
      <Drawer.Screen name="Records" component={RecordsStack} />
      <Drawer.Screen name="CatalogStack" component={CatalogStack} />
      <Drawer.Screen name="StockStack" component={StockStack} />
      <Drawer.Screen name="ShopsStack" component={ShopsStack} />
      <Drawer.Screen name="SalesReport" component={SalesReport} />
      <Drawer.Screen name="Expenses" component={Expenses} />
      <Drawer.Screen name="Notifications" component={Notifications} />
      <Drawer.Screen name="SubscriptionPlans" component={SubscriptionPlans} />
      <Drawer.Screen name="EarnCoins" component={EarnCoins} />
      <Drawer.Screen name="SettingsStack" component={SettingsStack} />
    </Drawer.Navigator>
  );
}
