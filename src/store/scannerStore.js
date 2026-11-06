import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hardware preference belongs to this device, never to the cloud shop profile.
export const useScannerStore = create(persist((set) => ({
  external: false,
  setExternal: (external) => set({ external }),
}), { name: 'asaankhata-scanner', storage: createJSONStorage(() => AsyncStorage) }));
