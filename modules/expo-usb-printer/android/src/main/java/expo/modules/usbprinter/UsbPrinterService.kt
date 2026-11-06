package expo.modules.usbprinter

import android.content.Context
import android.content.pm.PackageManager
import android.hardware.usb.UsbConstants
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbDeviceConnection
import android.hardware.usb.UsbEndpoint
import android.hardware.usb.UsbInterface
import android.hardware.usb.UsbManager

/**
 * Owns the USB side of printing: which attached device is a printer, whether we
 * are allowed to talk to it, and pushing bytes down its bulk-OUT endpoint.
 *
 * Deliberately model-agnostic. Printers are matched by USB *interface class*
 * rather than a vendor/product allowlist, because that is what makes an
 * arbitrary XPrinter / POS-58 / Rongta / Gprinter work without a code change:
 *   class 7    — the USB printer class, what most 80mm units report
 *   class 0xFF — vendor-specific, what many cheap clones report instead
 * Anything without a bulk-OUT endpoint on one of those is reported to JS as
 * "attached but not a supported printer" rather than being written to blindly.
 */
internal class UsbPrinterService(private val context: Context) {

  /** A resolved, writable printer: the device plus the interface/endpoint to use. */
  class Target(
    val device: UsbDevice,
    val usbInterface: UsbInterface,
    val endpoint: UsbEndpoint,
    val connection: UsbDeviceConnection,
  )

  companion object {
    /** Bytes per bulk transfer. Comfortably inside every printer's input buffer. */
    private const val CHUNK_SIZE = 4096
    private const val WRITE_TIMEOUT_MS = 8000
  }

  private val usbManager: UsbManager
    get() = context.getSystemService(Context.USB_SERVICE) as UsbManager

  /**
   * Two locks on purpose. `stateLock` only ever guards fast operations on the
   * `target` reference, while `writeLock` serialises the (potentially
   * multi-second) push of a long receipt. Sharing one lock would let a cable
   * pulled mid-print block the main thread — the detach broadcast arrives there —
   * for as long as the write takes to time out, which is an ANR.
   */
  private val stateLock = Any()
  private val writeLock = Any()
  private var target: Target? = null

  val isSupported: Boolean
    get() = context.packageManager.hasSystemFeature(PackageManager.FEATURE_USB_HOST)

  val isConnected: Boolean
    get() = synchronized(stateLock) { target != null }

  val connectedDevice: UsbDevice?
    get() = synchronized(stateLock) { target?.device }

  // ── Discovery ─────────────────────────────────────────────────────────────

  /** Every attached USB device, annotated with whether we can print to it. */
  fun listDevices(): List<Map<String, Any?>> =
    usbManager.deviceList.values.map { describe(it) }

  /** The device we would print to: an attached, printable one. Permission aside. */
  fun findPrinter(): UsbDevice? =
    usbManager.deviceList.values.firstOrNull { findPrintableInterface(it) != null }

  fun findDevice(deviceId: Int): UsbDevice? =
    usbManager.deviceList.values.firstOrNull { it.deviceId == deviceId }

  fun hasPermission(device: UsbDevice): Boolean = usbManager.hasPermission(device)

  fun describe(device: UsbDevice): Map<String, Any?> {
    val printable = findPrintableInterface(device)
    return mapOf(
      "deviceId" to device.deviceId,
      "vendorId" to device.vendorId,
      "productId" to device.productId,
      "name" to label(device),
      "manufacturer" to safeManufacturer(device),
      "interfaceClass" to (printable?.first?.interfaceClass ?: device.deviceClass),
      "isPrinter" to (printable != null),
      "hasPermission" to usbManager.hasPermission(device),
    )
  }

  /** Human-readable name for the UI; falls back through to a VID:PID pair. */
  fun label(device: UsbDevice): String {
    val product = try {
      device.productName?.trim()
    } catch (_: Throwable) {
      null
    }
    if (!product.isNullOrEmpty()) return product

    val manufacturer = safeManufacturer(device)
    if (!manufacturer.isNullOrEmpty()) return "$manufacturer printer"

    return String.format("USB printer %04X:%04X", device.vendorId, device.productId)
  }

  private fun safeManufacturer(device: UsbDevice): String? = try {
    device.manufacturerName?.trim()
  } catch (_: Throwable) {
    null
  }

  /**
   * Printer class first, vendor-specific second — so a device exposing both a
   * proper printer interface and a vendor one always uses the standard path.
   */
  private fun findPrintableInterface(device: UsbDevice): Pair<UsbInterface, UsbEndpoint>? {
    val preference = intArrayOf(UsbConstants.USB_CLASS_PRINTER, UsbConstants.USB_CLASS_VENDOR_SPEC)
    for (wantedClass in preference) {
      for (index in 0 until device.interfaceCount) {
        val candidate = device.getInterface(index)
        if (candidate.interfaceClass != wantedClass) continue
        val endpoint = bulkOutEndpoint(candidate) ?: continue
        return candidate to endpoint
      }
    }
    return null
  }

  private fun bulkOutEndpoint(usbInterface: UsbInterface): UsbEndpoint? {
    for (index in 0 until usbInterface.endpointCount) {
      val endpoint = usbInterface.getEndpoint(index)
      if (endpoint.type == UsbConstants.USB_ENDPOINT_XFER_BULK &&
        endpoint.direction == UsbConstants.USB_DIR_OUT
      ) {
        return endpoint
      }
    }
    return null
  }

  // ── Connection ────────────────────────────────────────────────────────────

  /**
   * Opens and claims the printer. Passing a `deviceId` pins a specific unit;
   * null means "whichever printer is attached", which is what auto-connect uses.
   */
  fun connect(deviceId: Int?): UsbDevice {
    if (!isSupported) throw UsbUnsupportedException()

    val device = (if (deviceId != null) findDevice(deviceId) else findPrinter())
      ?: throw PrinterNotFoundException()

    val printable = findPrintableInterface(device)
      ?: throw PrinterNotSupportedException(label(device))

    if (!usbManager.hasPermission(device)) throw PrinterPermissionException()

    synchronized(stateLock) {
      // Reconnecting to the same unit is a no-op, so repeated attach events and
      // a manual Connect tap can't stack up claimed interfaces.
      target?.let { existing ->
        if (existing.device.deviceId == device.deviceId) return existing.device
        close(existing)
        target = null
      }

      val connection = usbManager.openDevice(device)
        ?: throw PrinterOpenException("the device could not be opened (is it in use?)")

      if (!connection.claimInterface(printable.first, true)) {
        connection.close()
        throw PrinterOpenException("the printer interface is already claimed")
      }

      target = Target(device, printable.first, printable.second, connection)
      return device
    }
  }

  fun disconnect() {
    synchronized(stateLock) {
      target?.let { close(it) }
      target = null
    }
  }

  private fun close(t: Target) {
    try {
      t.connection.releaseInterface(t.usbInterface)
    } catch (_: Throwable) {
      /* the cable may already be gone */
    }
    try {
      t.connection.close()
    } catch (_: Throwable) {
      /* ditto */
    }
  }

  /**
   * Drops the connection if the named device is the one we hold. Called from the
   * detach broadcast on the main thread, so it must never wait on a write:
   * closing the connection underneath an in-flight bulkTransfer makes that
   * transfer fail immediately, which is exactly the desired cable-pull outcome.
   */
  fun disconnectIfCurrent(deviceId: Int): Boolean {
    synchronized(stateLock) {
      val current = target ?: return false
      if (current.device.deviceId != deviceId) return false
      close(current)
      target = null
      return true
    }
  }

  // ── Writing ───────────────────────────────────────────────────────────────

  /**
   * Pushes bytes to the printer in chunks. USB bulk transfers are flow-
   * controlled by the device (it NAKs until its buffer drains), so chunking plus
   * a generous timeout is what paces a long receipt correctly.
   */
  fun write(bytes: ByteArray) {
    synchronized(writeLock) {
      val current = synchronized(stateLock) { target } ?: throw PrinterNotConnectedException()

      var offset = 0
      while (offset < bytes.size) {
        val length = minOf(CHUNK_SIZE, bytes.size - offset)
        val sent = try {
          current.connection.bulkTransfer(current.endpoint, bytes, offset, length, WRITE_TIMEOUT_MS)
        } catch (error: Throwable) {
          throw PrinterWriteException(error.message ?: "the connection was lost", error)
        }

        if (sent < 0) {
          throw PrinterWriteException("the printer stopped accepting data at byte $offset")
        }
        if (sent == 0) {
          throw PrinterWriteException("the printer is not responding (out of paper, or powered off?)")
        }
        offset += sent
      }
    }
  }
}
