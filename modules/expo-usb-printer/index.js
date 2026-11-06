import { requireOptionalNativeModule } from 'expo-modules-core';

// Optional so Expo Go / iOS can keep using system printing without crashing.
export const ThermalPrinter = requireOptionalNativeModule('ExpoUsbPrinter');
