package expo.modules.usbprinter

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/** Android ESC/POS transports. All I/O and raster work runs off the UI thread. */
class UsbPrinterModule : Module() {
  class PrintOptions : Record {
    @Field var widthDots: Int = 576
    @Field var threshold: Int = 180
    @Field var dither: Boolean = false
    @Field var feedLines: Int = 3
    @Field var cut: Boolean = false
  }
  private val context: Context get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val usb by lazy { UsbPrinterService(context) }
  private val ble by lazy { BlePrinterService(context) }
  private val bluetooth by lazy { BluetoothPrinterService(context) }
  private val worker = Executors.newSingleThreadExecutor()
  private val timer = Executors.newSingleThreadScheduledExecutor()
  private val pending = mutableMapOf<Int, MutableList<Promise>>()
  private val jobs = mutableSetOf<Promise>()
  private val main = Handler(Looper.getMainLooper())
  @Volatile private var transport: String? = null
  @Volatile private var cancelled = false
  @Volatile private var destroyed = false
  private var registered = false
  private val permissionAction get() = "${context.packageName}.THERMAL_USB_PERMISSION"

  @Suppress("DEPRECATION")
  private fun deviceOf(intent: Intent): UsbDevice? = if (Build.VERSION.SDK_INT >= 33)
    intent.getParcelableExtra(UsbManager.EXTRA_DEVICE, UsbDevice::class.java)
    else intent.getParcelableExtra(UsbManager.EXTRA_DEVICE)

  private fun settlePermission(id: Int, granted: Boolean) {
    val promises = synchronized(pending) { pending.remove(id).orEmpty() }
    promises.forEach { it.resolve(granted) }
  }
  private val receiver = object : BroadcastReceiver() {
    override fun onReceive(ctx: Context?, intent: Intent?) {
      if (intent == null) return
      val device = deviceOf(intent)
      when (intent.action) {
        permissionAction -> if (device != null) settlePermission(device.deviceId, usb.hasPermission(device))
        UsbManager.ACTION_USB_DEVICE_DETACHED -> if (device != null) {
          usb.disconnectIfCurrent(device.deviceId)
          settlePermission(device.deviceId, false)
        }
      }
      if (!destroyed) sendEvent("onPrinterStatus", state())
    }
  }
  private fun state(): Map<String, Any?> = mapOf(
    "usbSupported" to usb.isSupported,
    "bluetoothSupported" to bluetooth.supported,
    "bluetoothPermission" to bluetooth.permitted,
    "bluetoothEnabled" to bluetooth.enabled,
    "transport" to transport,
    "deviceName" to when (transport) { "ble" -> ble.connectedName; "bluetooth" -> bluetooth.connectedName; "usb" -> usb.connectedDevice?.let { usb.label(it) }; else -> null },
    "deviceAddress" to when (transport) { "ble" -> ble.connectedAddress; "bluetooth" -> bluetooth.connectedAddress; else -> null },
    // Connected means the transport is open, not proof that paper was printed.
    "connected" to when (transport) { "ble" -> ble.connected; "bluetooth" -> bluetooth.connected; "usb" -> usb.isConnected; else -> false },
  )
  private fun job(promise: Promise, action: () -> Any?) {
    if (destroyed) { promise.reject("ERR_PRINTER_CLOSED", "Printer module was closed", null); return }
    synchronized(jobs) { jobs.add(promise) }
    try {
      worker.execute {
        try {
          if (!destroyed) { val result = action(); if (synchronized(jobs) { jobs.remove(promise) }) promise.resolve(result) }
        }
        catch (error: CodedException) { if (synchronized(jobs) { jobs.remove(promise) }) promise.reject(error) }
        catch (error: Throwable) { if (synchronized(jobs) { jobs.remove(promise) }) promise.reject("ERR_PRINTER_FAILED", error.message, error) }
        finally {
          synchronized(jobs) { jobs.remove(promise) }
          if (!destroyed) runCatching { sendEvent("onPrinterStatus", state()) }
        }
      }
    } catch (error: Throwable) { synchronized(jobs) { jobs.remove(promise) }; promise.reject("ERR_PRINTER_CLOSED", error.message, error) }
  }
  private fun write(data: ByteArray) {
    if (cancelled || destroyed) throw PrinterWriteException("Printing was cancelled")
    if (transport == "ble") ble.write(data) else if (transport == "bluetooth") bluetooth.write(data) else if (transport == "usb") usb.write(data)
    else throw PrinterNotConnectedException()
  }
  private fun printPdf(uri: String, options: PrintOptions) {
    cancelled = false
    if (options.widthDots !in listOf(320, 360, 384, 576, 512)) throw PrinterRenderException("Unsupported print head width")
    var emitted = false
    val deadline = timer.schedule({ cancelled = true; usb.disconnect(); bluetooth.disconnect(); ble.disconnect() }, 180, TimeUnit.SECONDS)
    try {
      write(EscPos.initialise())
      PdfRasterizer().forEachPage(uri, options.widthDots) { bitmap ->
        val data = EscPos.raster(bitmap, options.threshold.coerceIn(100, 220), options.dither)
        emitted = true // Even a partial write may have reached the printer.
        write(data)
      }
      write(EscPos.feed(options.feedLines.coerceIn(1, 8)))
      if (options.cut) write(EscPos.cut(0))
    } catch (error: Throwable) {
      usb.disconnect(); bluetooth.disconnect(); ble.disconnect()
      if (emitted) throw CodedException("ERR_PRINT_INTERRUPTED", "Receipt may be partly printed. Check the paper before reprinting.", error)
      throw error
    } finally { deadline.cancel(false) }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoUsbPrinter")
    Events("onPrinterStatus")
    OnCreate {
      val filter = IntentFilter().apply {
        addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED)
        addAction(UsbManager.ACTION_USB_DEVICE_DETACHED)
        addAction(permissionAction)
      }
      if (Build.VERSION.SDK_INT >= 33) context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
      else { @Suppress("UnspecifiedRegisterReceiverFlag") context.registerReceiver(receiver, filter) }
      registered = true
    }
    OnDestroy {
      destroyed = true; cancelled = true
      if (registered) runCatching { context.unregisterReceiver(receiver) }
      usb.disconnect(); bluetooth.destroy(); ble.disconnect()
      val waiters = synchronized(pending) { pending.values.flatten().also { pending.clear() } }
      waiters.forEach { it.resolve(false) }
      val unfinished = synchronized(jobs) { jobs.toList().also { jobs.clear() } }
      unfinished.forEach { it.reject("ERR_PRINTER_CLOSED", "Printer module was closed", null) }
      main.removeCallbacksAndMessages(null)
      worker.shutdownNow(); timer.shutdownNow()
    }
    Function("getState") { state() }
    Function("getUsbDevices") { usb.listDevices() }
    Function("getBluetoothDevices") { bluetooth.devices() }
    Function("cancel") { cancelled = true; usb.disconnect(); bluetooth.disconnect(); ble.disconnect() }
    AsyncFunction("requestUsbPermission") { deviceId: Int, promise: Promise ->
      val device = usb.findDevice(deviceId) ?: throw PrinterNotFoundException()
      if (usb.hasPermission(device)) promise.resolve(true)
      else {
        val alreadyWaiting = synchronized(pending) {
          val waiting = pending.getOrPut(deviceId) { mutableListOf() }
          val result = waiting.isNotEmpty(); waiting.add(promise); result
        }
        if (!alreadyWaiting) {
          // Android may revoke USB grants on detach. Never assume a permanent grant.
          val flags = PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= 31) PendingIntent.FLAG_MUTABLE else 0
          val intent = Intent(permissionAction).setPackage(context.packageName)
          val permission = PendingIntent.getBroadcast(context, deviceId, intent, flags)
          main.postDelayed({ settlePermission(deviceId, false) }, 45000)
          try { (context.getSystemService(Context.USB_SERVICE) as UsbManager).requestPermission(device, permission) }
          catch (error: Throwable) { settlePermission(deviceId, false) }
        }
      }
    }
    AsyncFunction("connectUsb") { id: Int, promise: Promise -> job(promise) {
      ble.disconnect(); bluetooth.disconnect(); usb.connect(id); transport = "usb"; state()
    } }
    AsyncFunction("connectBluetooth") { address: String, promise: Promise -> job(promise) {
      ble.disconnect(); usb.disconnect(); bluetooth.connect(address); transport = "bluetooth"; state()
    } }
    AsyncFunction("scanBle") { promise: Promise -> job(promise) { ble.scan() } }
    AsyncFunction("getBleChannels") { address: String, promise: Promise -> job(promise) { ble.channels(address) } }
    AsyncFunction("connectBle") { address: String, service: String, characteristic: String, promise: Promise -> job(promise) {
      usb.disconnect(); bluetooth.disconnect(); ble.connect(address, service, characteristic); transport = "ble"; state()
    } }
    AsyncFunction("printPdf") { uri: String, options: PrintOptions, promise: Promise -> job(promise) { printPdf(uri, options); true } }
    AsyncFunction("printTest") { options: PrintOptions, promise: Promise -> job(promise) {
      cancelled = false
      val label = when (transport) {
        "bluetooth" -> bluetooth.connectedName ?: "Bluetooth Classic printer"
        "ble" -> ble.connectedName ?: "Bluetooth LE printer"
        else -> usb.connectedDevice?.let { usb.label(it) } ?: "USB printer"
      }
      write(EscPos.selfTest(label, options.widthDots, options.cut))
      true
    } }
  }
}
