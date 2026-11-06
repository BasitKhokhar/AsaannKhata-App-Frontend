import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, Linking, Platform, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Bluetooth, CheckCircle2, CircleDashed, Printer, RefreshCw, Usb } from 'lucide-react-native';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { ListRow } from '../../components/ui/ListRow';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useTheme } from '../../theme';
import { useIsUrdu, useT } from '../../store/languageStore';
import { usePrinterStore } from '../../store/printerStore';
import {
  allowBluetooth, bleChannels, cancelPrint, onPrinterChange, printerDevices,
  printerError, scanBlePrinters, testPrinter, thermalAvailable,
} from '../../services/thermalPrinter';
import { showToast } from '../../store/toastStore';

const PAPER_WIDTHS = ['50', '55', '58', '80'];
const DEFAULT_DOTS = { 50: 320, 55: 360, 58: 384, 80: 576 };

function sameTransport(state, target) {
  return !!state?.connected && !!target && state.transport === target.kind;
}

export default function PrinterSettings() {
  const { colors, radii, typography, spacing } = useTheme();
  const t = useT();
  const isUrdu = useIsUrdu();
  const direction = isUrdu ? 'row-reverse' : 'row';
  const align = isUrdu ? 'right' : 'left';
  const { target, paper, widthDots, cut, select, configure, busy } = usePrinterStore();
  const [devices, setDevices] = useState({ usb: [], bluetooth: [], state: null });
  const [nearby, setNearby] = useState([]);
  const [channels, setChannels] = useState(null);

  const refresh = useCallback(() => {
    try { setDevices(printerDevices()); }
    catch (error) { showToast(t(printerError(error)), 'error'); }
  }, [t]);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  useEffect(() => {
    const nativeSubscription = onPrinterChange(refresh);
    const appSubscription = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => { nativeSubscription.remove(); appSubscription.remove(); };
  }, [refresh]);

  const selectedDevice = useMemo(() => {
    if (!target) return null;
    if (target.kind === 'usb') {
      return devices.usb.find((device) => device.deviceId === target.deviceId)
        || devices.usb.find((device) => device.vendorId === target.vendorId && device.productId === target.productId)
        || null;
    }
    if (target.kind === 'bluetooth') return devices.bluetooth.find((device) => device.address === target.address) || null;
    return nearby.find((device) => device.address === target.address) || target;
  }, [devices, nearby, target]);

  const connected = sameTransport(devices.state, target);
  const status = connected
    ? { label: t('printer.connected'), color: colors.semantic.success, background: colors.semantic.successBg }
    : selectedDevice
      ? { label: t(target?.kind === 'bluetooth' ? 'printer.paired' : target?.kind === 'ble' ? 'printer.saved' : 'printer.detected'), color: colors.semantic.warning, background: colors.semantic.warningBg }
      : { label: t(target ? 'printer.notDetected' : 'printer.noneSelected'), color: colors.ink.secondary, background: colors.surface.card };

  async function runTest() {
    try { await testPrinter(); showToast(t('printer.testSent'), 'success'); }
    catch (error) { showToast(t(printerError(error)), 'error'); }
    finally { refresh(); }
  }

  async function requestBluetooth() {
    try { if (!await allowBluetooth()) showToast(t('printer.permission'), 'error'); refresh(); }
    catch (error) { showToast(t(printerError(error)), 'error'); }
  }

  async function scanBle() {
    try { setChannels(null); setNearby(await scanBlePrinters()); }
    catch (error) { showToast(t(printerError(error)), 'error'); }
  }

  async function inspectBle(device) {
    try {
      const found = await bleChannels(device.address);
      setChannels({ device, found });
      if (!found.length) showToast(t('printer.noChannel'), 'error');
    } catch (error) { showToast(t(printerError(error)), 'error'); }
  }

  const transportLabel = target?.kind === 'usb' ? t('printer.usb')
    : target?.kind === 'bluetooth' ? t('printer.classic')
      : target?.kind === 'ble' ? t('printer.ble') : t('printer.system');

  return <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.surface.bg }}>
    <Header title={t('printer.settings')} />
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl * 2 }}>
      <Card style={{ gap: spacing.md }}>
        <View style={{ flexDirection: direction, alignItems: 'center', gap: spacing.md }}>
          <View style={{ width: 52, height: 52, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: status.background }}>
            {connected ? <CheckCircle2 size={27} color={status.color} /> : <Printer size={27} color={status.color} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.h3, { color: colors.ink.primary, textAlign: align }]}>{target?.name || t('printer.noneSelected')}</Text>
            <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{transportLabel}</Text>
          </View>
          <View style={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.pill, backgroundColor: status.background }}>
            <Text style={[typography.caption, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        {target ? <View style={{ gap: spacing.xs }}>
          <Detail label={t('printer.transport')} value={transportLabel} direction={direction} />
          <Detail label={t('receipt.paper')} value={`${paper} mm · ${widthDots} ${t('printer.dots')}`} direction={direction} />
          {target.address ? <Detail label={t('printer.deviceAddress')} value={target.address} direction={direction} /> : null}
          {selectedDevice?.manufacturer ? <Detail label={t('printer.manufacturer')} value={selectedDevice.manufacturer} direction={direction} /> : null}
          {target.kind === 'usb' ? <Detail label={t('printer.usbId')} value={`${target.vendorId}:${target.productId}`} direction={direction} /> : null}
        </View> : <Text style={[typography.body, { color: colors.ink.secondary, textAlign: align }]}>{t('printer.selectHelp')}</Text>}
      </Card>

      {target ? <Card style={{ gap: spacing.sm, borderColor: colors.brand.primary }}>
        <Text style={[typography.h3, { color: colors.ink.primary, textAlign: align }]}>{t('printer.testReceipt')}</Text>
        <Text style={[typography.body, { color: colors.ink.secondary, textAlign: align }]}>{t('printer.testHelp')}</Text>
        <Button title={t('printer.test')} onPress={runTest} loading={busy} disabled={!thermalAvailable()} icon={<Printer size={18} color={colors.ink.inverse} />} />
        {busy ? <Button title={t('common.cancel')} variant="outline" onPress={cancelPrint} /> : null}
      </Card> : null}

      <View>
        <SectionHeader title={t('printer.choosePrinter')} actionLabel={t('printer.refresh')} onAction={refresh} style={{ flexDirection: direction }} />
        <Card bordered={false} style={{ padding: spacing.xs }}>
          <ListRow leading={<Printer size={20} color={colors.brand.primary} />} title={t('printer.system')} subtitle={t('printer.systemHelp')}
            trailing={!target ? <SelectedMark t={t} colors={colors} typography={typography} /> : null} onPress={busy ? undefined : () => select(null)}
            style={{ flexDirection: direction }} titleStyle={{ textAlign: align }} subtitleStyle={{ textAlign: align }} />
        </Card>
      </View>

      {!thermalAvailable() ? <Card><Text style={[typography.body, { color: colors.ink.secondary, textAlign: align }]}>{t('printer.unavailable')}</Text></Card> : <>
        <PrinterSection icon={Usb} title={t('printer.usb')} help={t('printer.usbHelp')} direction={direction} align={align}>
          {devices.usb.length === 0 ? <EmptyState text={t('printer.noUsb')} /> : devices.usb.map((device) => {
            const selected = target?.kind === 'usb' && target.vendorId === device.vendorId && target.productId === device.productId;
            const subtitle = `${device.manufacturer || t('printer.unknownMaker')} · ${device.vendorId}:${device.productId} · ${t(device.hasPermission ? 'printer.usbPermissionReady' : 'printer.usbPermissionNeeded')}`;
            return <ListRow key={device.deviceId} leading={<Usb size={19} color={selected ? colors.brand.primary : colors.ink.secondary} />} title={device.name} subtitle={subtitle}
              trailing={selected ? <SelectedMark t={t} colors={colors} typography={typography} /> : null}
              onPress={busy ? undefined : () => select({ kind: 'usb', key: `usb:${device.vendorId}:${device.productId}`, deviceId: device.deviceId, vendorId: device.vendorId, productId: device.productId, name: device.name })}
              style={{ flexDirection: direction }} titleStyle={{ textAlign: align }} subtitleStyle={{ textAlign: align }} />;
          })}
        </PrinterSection>

        <PrinterSection icon={Bluetooth} title={t('printer.classic')} help={t('printer.bluetoothHelp')} direction={direction} align={align}
          actions={<View style={{ flexDirection: direction, flexWrap: 'wrap', gap: spacing.sm }}><Button title={t('printer.allowBluetooth')} variant="outline" onPress={requestBluetooth} style={{ flex: 1 }} /><Button title={t('printer.pair')} variant="ghost" onPress={() => { if (Platform.OS === 'android') Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS').catch(() => Linking.openSettings()); }} style={{ flex: 1 }} /></View>}>
          {devices.bluetooth.length === 0 ? <EmptyState text={t('printer.noBluetooth')} /> : devices.bluetooth.map((device) => {
            const selected = target?.kind === 'bluetooth' && target.address === device.address;
            return <ListRow key={device.address} leading={<Bluetooth size={19} color={selected ? colors.brand.primary : colors.ink.secondary} />} title={device.name} subtitle={device.address}
              trailing={selected ? <SelectedMark t={t} colors={colors} typography={typography} /> : null}
              onPress={busy ? undefined : () => select({ kind: 'bluetooth', key: `bt:${device.address}`, ...device })}
              style={{ flexDirection: direction }} titleStyle={{ textAlign: align }} subtitleStyle={{ textAlign: align }} />;
          })}
        </PrinterSection>

        <PrinterSection icon={Bluetooth} title={t('printer.ble')} help={t('printer.bleHelp')} direction={direction} align={align}
          actions={<Button title={t('printer.scanBle')} variant="outline" disabled={busy} loading={busy} onPress={scanBle} icon={<RefreshCw size={17} color={colors.brand.primary} />} />}>
          {nearby.length === 0 ? <EmptyState text={t('printer.noBleScan')} /> : nearby.map((device) => {
            const selected = target?.kind === 'ble' && target.address === device.address;
            return <ListRow key={device.address} leading={<Bluetooth size={19} color={selected ? colors.brand.primary : colors.ink.secondary} />} title={device.name} subtitle={device.address}
              trailing={selected ? <SelectedMark t={t} colors={colors} typography={typography} /> : null}
              onPress={busy ? undefined : () => inspectBle(device)} showChevron={!selected}
              style={{ flexDirection: direction }} titleStyle={{ textAlign: align }} subtitleStyle={{ textAlign: align }} />;
          })}
          {channels?.found.length ? <View style={{ gap: spacing.xs, paddingTop: spacing.sm }}>
            <Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: align }]}>{t('printer.chooseChannel')}</Text>
            {channels.found.map((item) => <ListRow key={`${item.service}:${item.characteristic}`} title={item.characteristic} subtitle={item.service} showChevron
              onPress={busy ? undefined : () => { select({ kind: 'ble', key: `ble:${channels.device.address}:${item.characteristic}`, ...channels.device, ...item }); setChannels(null); }}
              style={{ flexDirection: direction }} titleStyle={{ textAlign: align }} subtitleStyle={{ textAlign: align }} />)}
          </View> : null}
        </PrinterSection>
      </>}

      {target ? <View>
        <SectionHeader title={t('printer.printSetup')} style={{ flexDirection: direction }} />
        <Card style={{ gap: spacing.md }}>
          <Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: align }]}>{t('receipt.paper')}</Text>
          <View style={{ flexDirection: direction, flexWrap: 'wrap', gap: spacing.sm }}>{PAPER_WIDTHS.map((value) => <Chip key={value} label={`${value} mm`} selected={paper === value} onPress={() => { if (!busy) configure({ paper: value, widthDots: DEFAULT_DOTS[value] }); }} />)}</View>
          <Text style={[typography.bodyMedium, { color: colors.ink.primary, textAlign: align }]}>{t('printer.printHeadWidth')}</Text>
          <View style={{ flexDirection: direction, flexWrap: 'wrap', gap: spacing.sm }}>{(paper === '80' ? [576, 512] : [320, 360, 384]).map((dots) => <Chip key={dots} label={`${dots} ${t('printer.dots')}`} selected={widthDots === dots} onPress={() => { if (!busy) configure({ widthDots: dots }); }} />)}</View>
          <View style={{ flexDirection: direction, alignItems: 'center', gap: spacing.sm }}><Text style={[typography.body, { flex: 1, color: colors.ink.primary, textAlign: align }]}>{t('printer.cut')}</Text><Switch accessibilityLabel={t('printer.cut')} value={cut} disabled={busy} onValueChange={(value) => configure({ cut: value })} /></View>
        </Card>
      </View> : null}

      <Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{t('printer.compatibility')}</Text>
    </ScrollView>
  </SafeAreaView>;
}

function Detail({ label, value, direction }) {
  const { colors, typography } = useTheme();
  return <View style={{ flexDirection: direction, justifyContent: 'space-between', gap: 12 }}><Text style={[typography.caption, { color: colors.ink.secondary }]}>{label}</Text><Text selectable style={[typography.caption, { flex: 1, color: colors.ink.primary, textAlign: direction === 'row-reverse' ? 'left' : 'right' }]} numberOfLines={1}>{value}</Text></View>;
}

function PrinterSection({ icon: Icon, title, help, actions, children, direction, align }) {
  const { colors, radii, typography, spacing } = useTheme();
  return <View style={{ gap: spacing.sm }}><View style={{ flexDirection: direction, alignItems: 'center', gap: spacing.sm }}><View style={{ width: 36, height: 36, borderRadius: radii.md, backgroundColor: colors.brand.primary + '1A', alignItems: 'center', justifyContent: 'center' }}><Icon size={19} color={colors.brand.primary} /></View><Text style={[typography.h3, { color: colors.ink.primary, textAlign: align }]}>{title}</Text></View><Text style={[typography.caption, { color: colors.ink.secondary, textAlign: align }]}>{help}</Text>{actions}<Card bordered={false} style={{ padding: spacing.xs }}>{children}</Card></View>;
}

function EmptyState({ text }) {
  const { colors, typography } = useTheme();
  return <View style={{ padding: 16, alignItems: 'center', gap: 8 }}><CircleDashed size={22} color={colors.ink.secondary} /><Text style={[typography.caption, { color: colors.ink.secondary, textAlign: 'center' }]}>{text}</Text></View>;
}

function SelectedMark({ t, colors, typography }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><CheckCircle2 size={16} color={colors.semantic.success} /><Text style={[typography.caption, { color: colors.semantic.success }]}>{t('printer.selected')}</Text></View>;
}
