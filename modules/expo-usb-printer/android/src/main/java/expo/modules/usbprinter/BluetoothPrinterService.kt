package expo.modules.usbprinter

import android.Manifest
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import java.util.UUID
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/** Paired Bluetooth Classic SPP printers only. BLE GATT is a different protocol. */
internal class BluetoothPrinterService(private val context: Context) {
  private val adapter get() = (context.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager)?.adapter
  @Volatile private var socket: BluetoothSocket? = null
  private val timer = Executors.newSingleThreadScheduledExecutor()
  private val spp = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
  val permitted get() = Build.VERSION.SDK_INT < 31 || context.checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED
  val supported get() = context.packageManager.hasSystemFeature(PackageManager.FEATURE_BLUETOOTH)
  val enabled get() = permitted && adapter?.isEnabled == true
  val connected get() = socket?.isConnected == true
  val connectedName get() = socket?.remoteDevice?.name
  val connectedAddress get() = socket?.remoteDevice?.address

  fun devices(): List<Map<String, Any?>> {
    if (!permitted) return emptyList()
    return adapter?.bondedDevices?.filter { it.type != BluetoothDevice.DEVICE_TYPE_LE }?.map {
      mapOf("address" to it.address, "name" to (it.name ?: it.address))
    } ?: emptyList()
  }

  fun connect(address: String) {
    if (!permitted) throw PrinterPermissionException()
    val radio = adapter ?: throw PrinterOpenException("Bluetooth unavailable")
    if (!radio.isEnabled) throw PrinterOpenException("Bluetooth is disabled")
    if (!android.bluetooth.BluetoothAdapter.checkBluetoothAddress(address)) throw PrinterOpenException("Invalid Bluetooth address")
    val device = radio.bondedDevices.firstOrNull { it.address == address }
      ?: throw PrinterOpenException("Pair this printer in Android Bluetooth settings first")
    if (device.type == BluetoothDevice.DEVICE_TYPE_LE) throw PrinterOpenException("This device uses BLE, not Bluetooth Classic SPP")
    if (socket?.isConnected == true && socket?.remoteDevice?.address == address) return
    disconnect()
    val candidate = device.createRfcommSocketToServiceRecord(spp)
    socket = candidate
    // Closing the socket interrupts a blocked RFCOMM connect/write.
    val timeout = timer.schedule({ runCatching { candidate.close() } }, 12, TimeUnit.SECONDS)
    try { candidate.connect() }
    catch (error: Throwable) { disconnect(); throw PrinterOpenException(error.message ?: "Bluetooth connection timed out") }
    finally { timeout.cancel(false) }
  }

  fun write(bytes: ByteArray) {
    val current = socket ?: throw PrinterNotConnectedException()
    val timeout = timer.schedule({ runCatching { current.close() } }, 15, TimeUnit.SECONDS)
    try {
      var offset = 0
      while (offset < bytes.size) {
        val count = minOf(1024, bytes.size - offset)
        current.outputStream.write(bytes, offset, count)
        offset += count
        // Small buffers on portable printers need pacing even when RFCOMM
        // accepts bytes faster than the head can print.
        if (offset < bytes.size) Thread.sleep(8)
      }
      current.outputStream.flush()
    } catch (error: Throwable) { disconnect(); throw PrinterWriteException(error.message ?: "Bluetooth write failed", error) }
    finally { timeout.cancel(false) }
  }

  fun disconnect() { val old = socket; socket = null; runCatching { old?.close() } }
  fun destroy() { disconnect(); timer.shutdownNow() }
}
