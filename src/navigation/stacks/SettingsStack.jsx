import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Settings from '../../screens/settings/Settings';
import SyncStatus from '../../screens/settings/SyncStatus';
import Profile from '../../screens/settings/Profile';
import HelpSupport from '../../screens/settings/HelpSupport';
import About from '../../screens/settings/About';
import StaffManagement from '../../screens/settings/StaffManagement';
import Notifications from '../../screens/shared/Notifications';

const Stack = createNativeStackNavigator();

export function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Settings" component={Settings} />
      <Stack.Screen name="SyncStatus" component={SyncStatus} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="HelpSupport" component={HelpSupport} />
      <Stack.Screen name="About" component={About} />
      <Stack.Screen name="StaffManagement" component={StaffManagement} />
    </Stack.Navigator>
  );
}
