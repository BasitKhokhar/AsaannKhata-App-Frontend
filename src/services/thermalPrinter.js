import { PermissionsAndroid, Platform } from 'react-native';
import * as Print from 'expo-print';
import { File } from 'expo-file-system';
import { ThermalPrinter } from '../../modules/expo-usb-printer';
import { usePrinterStore } from '../store/printerStore';

export const thermalAvailable = () => Platform.OS === 'android' && !!ThermalPrinter;
export function printerDevices() {
  if (!thermalAvailable()) return { usb: [], bluetooth: [], state: null };
  return { usb: ThermalPrinter.getUsbDevices().filter((device) => device.isPrinter), bluetooth: ThermalPrinter.getBluetoothDevices(), state: ThermalPrinter.getState() };
}
export function onPrinterChange(listener) { return ThermalPrinter?.addListener('onPrinterStatus', listener) || { remove() {} }; }
export async function allowBluetooth() {
  if (Platform.OS !== 'android') return false;
  if (Number(Platform.Version) < 31) return true;
  return await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT) === PermissionsAndroid.RESULTS.GRANTED;
}
export async function scanBlePrinters() {
  if (!thermalAvailable()) throw new Error('printer.unavailable');
  if (!await allowBluetooth()) throw new Error('printer.permission');
  const permission = Number(Platform.Version) >= 31 ? PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN : PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  if (await PermissionsAndroid.request(permission) !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('printer.permission');
  return printerJob(() => ThermalPrinter.scanBle());
}
export async function bleChannels(address) {
  if (!await allowBluetooth()) throw new Error('printer.permission');
  return printerJob(() => ThermalPrinter.getBleChannels(address));
}
export function printerError(error) {
  if (error?.message?.startsWith('printer.')) return error.message;
  const code = String(error?.code || '');
  if (code.includes('PRINT_INTERRUPTED') || code.includes('WRITE_FAILED')) return 'printer.interrupted';
  if (code.includes('PERMISSION')) return 'printer.permission';
  if (code.includes('NOT_FOUND') || code.includes('NOT_CONNECTED')) return 'printer.notConnected';
  if (code.includes('RENDER')) return 'receipt.failed';
  return 'printer.failed';
}
export async function connectPrinter(target) {
  if (!thermalAvailable()) throw new Error('printer.unavailable');
  if (!target) throw new Error('printer.notConnected');
  if (target.kind === 'ble') {
    if (!await allowBluetooth()) throw new Error('printer.permission');
    return ThermalPrinter.connectBle(target.address, target.service, target.characteristic);
  }
  if (target.kind === 'bluetooth') {
    if (!await allowBluetooth()) throw new Error('printer.permission');
    return ThermalPrinter.connectBluetooth(target.address);
  }
  const matches = ThermalPrinter.getUsbDevices().filter((item) => item.isPrinter && item.vendorId === target.vendorId && item.productId === target.productId);
  const selected = matches.find((item) => item.deviceId === target.deviceId) || (matches.length === 1 ? matches[0] : null);
  if (!selected) throw new Error('printer.notConnected');
  if (!selected.hasPermission && !await ThermalPrinter.requestUsbPermission(selected.deviceId)) throw new Error('printer.permission');
  return ThermalPrinter.connectUsb(selected.deviceId);
}
// Reject concurrent taps across screens; never silently enqueue duplicate bills.
export async function printerJob(action) {
  if (usePrinterStore.getState().busy) throw new Error('printer.busy');
  usePrinterStore.setState({ busy: true });
  try { return await action(); }
  finally { usePrinterStore.setState({ busy: false }); }
}
export async function testPrinter() {
  const { target, widthDots, cut } = usePrinterStore.getState();
  return printerJob(async () => { await connectPrinter(target); await ThermalPrinter.printTest({ widthDots, cut, threshold: 180, dither: false, feedLines: 3 }); });
}
export async function printThermalDocument(makeDocument) {
  const profile = usePrinterStore.getState();
  return printerJob(async () => {
    await connectPrinter(profile.target);
    const document = await makeDocument(profile.paper);
    const { uri } = await Print.printToFileAsync(document);
    try {
      // No retry after bytes may have reached paper. The user decides whether
      // to reprint after checking for a partial or complete physical receipt.
      await ThermalPrinter.printPdf(uri, { widthDots: profile.widthDots, cut: profile.cut, feedLines: 3, threshold: 180, dither: false });
    } finally {
      // Cache cleanup must not hide an interrupted-print error or turn a
      // successful physical print into an apparent failure and duplicate retry.
      try { const file = new File(uri); if (file.exists) file.delete(); } catch {}
    }
  });
}
export function cancelPrint() { ThermalPrinter?.cancel(); }
