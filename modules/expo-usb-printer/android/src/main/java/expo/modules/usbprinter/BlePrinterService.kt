package expo.modules.usbprinter

import android.Manifest
import android.bluetooth.*
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import expo.modules.kotlin.exception.CodedException
import java.util.UUID
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** Generic writable GATT channel for ESC/POS BLE printers, chosen explicitly by the user.
 * Calls are serialized by the module worker; callbacks only signal bounded waits.
 */
@Suppress("MissingPermission", "DEPRECATION")
internal class BlePrinterService(private val context: Context) {
  private val adapter get() = (context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager).adapter
  @Volatile private var gatt: BluetoothGatt? = null
  @Volatile private var ready = false
  @Volatile private var channel: BluetoothGattCharacteristic? = null
  @Volatile private var waiter: CountDownLatch? = null
  @Volatile private var scanCallback: ScanCallback? = null
  @Volatile private var status = -1
  @Volatile private var mtu = 23
  val connected get() = ready && gatt != null && channel != null
  val connectedName get() = gatt?.device?.name
  val connectedAddress get() = gatt?.device?.address

  private fun permission(scan: Boolean = false) {
    val permissions = if (Build.VERSION.SDK_INT >= 31) listOfNotNull(Manifest.permission.BLUETOOTH_CONNECT, if (scan) Manifest.permission.BLUETOOTH_SCAN else null)
      else if (scan) listOf(Manifest.permission.ACCESS_FINE_LOCATION) else emptyList()
    if (permissions.any { context.checkSelfPermission(it) != PackageManager.PERMISSION_GRANTED })
      throw CodedException("ERR_BLUETOOTH_PERMISSION", "Bluetooth permission is required", null)
    if (adapter?.isEnabled != true) throw PrinterOpenException("Enable Bluetooth first")
  }
  fun scan(): List<Map<String, String>> {
    permission(true)
    val scanner = adapter?.bluetoothLeScanner ?: throw PrinterOpenException("BLE scanning is unavailable")
    val found = linkedMapOf<String, Map<String, String>>()
    val done = CountDownLatch(1)
    var failure = 0
    val callback = object : ScanCallback() {
      override fun onScanResult(callbackType: Int, result: ScanResult) {
        synchronized(found) { found[result.device.address] = mapOf("address" to result.device.address, "name" to (result.scanRecord?.deviceName ?: result.device.name ?: result.device.address)) }
      }
      override fun onScanFailed(errorCode: Int) { failure = errorCode; done.countDown() }
    }
    scanCallback = callback; waiter = done
    try {
      scanner.startScan(null, ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build(), callback)
      done.await(7, TimeUnit.SECONDS)
      if (failure != 0) throw PrinterOpenException("BLE scan failed ($failure)")
      return synchronized(found) { found.values.toList() }
    } finally { scanner.stopScan(callback); scanCallback = null; waiter = null }
  }
  private fun signal(result: Int) { status = result; waiter?.countDown() }
  private val callback = object : BluetoothGattCallback() {
    override fun onConnectionStateChange(client: BluetoothGatt, result: Int, state: Int) {
      if (client !== gatt) return
      if (result == BluetoothGatt.GATT_SUCCESS && state == BluetoothProfile.STATE_CONNECTED) {
        if (!client.discoverServices()) signal(-1)
      } else { ready = false; signal(if (result == 0) -1 else result) }
    }
    override fun onServicesDiscovered(client: BluetoothGatt, result: Int) {
      if (client !== gatt) return
      ready = result == BluetoothGatt.GATT_SUCCESS; signal(result)
    }
    override fun onMtuChanged(client: BluetoothGatt, value: Int, result: Int) {
      if (client === gatt && result == BluetoothGatt.GATT_SUCCESS) mtu = value.coerceIn(23, 185)
    }
    override fun onCharacteristicWrite(client: BluetoothGatt, characteristic: BluetoothGattCharacteristic, result: Int) {
      if (client === gatt && characteristic.uuid == channel?.uuid) signal(result)
    }
  }
  private fun open(address: String) {
    permission()
    if (ready && gatt?.device?.address == address) return
    disconnect()
    val done = CountDownLatch(1); waiter = done; status = -1; mtu = 23
    try {
      gatt = adapter!!.getRemoteDevice(address).connectGatt(context, false, callback, BluetoothDevice.TRANSPORT_LE)
      if (!done.await(12, TimeUnit.SECONDS) || status != BluetoothGatt.GATT_SUCCESS || !ready)
        throw PrinterOpenException("BLE connection or service discovery failed")
      // Keep the default 20-byte payload: works without an MTU negotiation race
      // and avoids printer firmware that advertises more than its receive buffer.
    } catch (error: Throwable) { disconnect(); throw error }
    finally { waiter = null }
  }
  fun channels(address: String): List<Map<String, String>> {
    open(address)
    return gatt!!.services.flatMap { service -> service.characteristics.filter {
      it.properties and (BluetoothGattCharacteristic.PROPERTY_WRITE or BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE) != 0
    }.map { mapOf("service" to service.uuid.toString(), "characteristic" to it.uuid.toString()) } }
  }
  fun connect(address: String, service: String, characteristic: String) {
    open(address)
    val selected = gatt?.getService(UUID.fromString(service))?.getCharacteristic(UUID.fromString(characteristic))
      ?: throw PrinterOpenException("Selected BLE print channel is unavailable")
    if (selected.properties and (BluetoothGattCharacteristic.PROPERTY_WRITE or BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE) == 0)
      throw PrinterOpenException("BLE channel does not accept writes")
    channel = selected
  }
  fun write(bytes: ByteArray) {
    val client = gatt ?: throw PrinterNotConnectedException()
    val characteristic = channel ?: throw PrinterNotConnectedException()
    val type = if (characteristic.properties and BluetoothGattCharacteristic.PROPERTY_WRITE != 0) BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT else BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
    for (offset in bytes.indices step (mtu - 3)) {
      if (!connected || client !== gatt) throw PrinterNotConnectedException()
      val part = bytes.copyOfRange(offset, minOf(offset + mtu - 3, bytes.size))
      val done = CountDownLatch(1); waiter = done; status = -1
      try {
        val accepted = if (Build.VERSION.SDK_INT >= 33) client.writeCharacteristic(characteristic, part, type) == BluetoothStatusCodes.SUCCESS
          else { characteristic.writeType = type; characteristic.value = part; client.writeCharacteristic(characteristic) }
        if (!accepted || !done.await(5, TimeUnit.SECONDS) || status != BluetoothGatt.GATT_SUCCESS)
          throw PrinterWriteException("BLE packet was not acknowledged")
        if (type == BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE) Thread.sleep(8)
      } finally { waiter = null }
    }
  }
  fun disconnect() {
    ready = false; channel = null
    val previous = gatt; gatt = null
    status = -1; waiter?.countDown()
    runCatching { scanCallback?.let { adapter?.bluetoothLeScanner?.stopScan(it) } }
    runCatching { previous?.disconnect() }; runCatching { previous?.close() }
  }
}
