package expo.modules.usbprinter

import expo.modules.kotlin.exception.CodedException

/**
 * Every failure JS can observe, with a stable `code`. src/services/thermalPrinter.js
 * maps these codes to the wording the user actually reads, so the copy lives in
 * one place instead of being duplicated per screen.
 */

internal class UsbUnsupportedException :
  CodedException("ERR_USB_UNSUPPORTED", "This device does not support USB host (OTG) mode.", null)

internal class PrinterNotFoundException :
  CodedException("ERR_PRINTER_NOT_FOUND", "No USB thermal printer is attached.", null)

internal class PrinterNotSupportedException(label: String) :
  CodedException(
    "ERR_PRINTER_NOT_SUPPORTED",
    "\"$label\" is attached but does not expose a supported USB bulk output interface.",
    null,
  )

internal class PrinterPermissionException :
  CodedException("ERR_PERMISSION_DENIED", "USB permission for the printer was not granted.", null)

internal class PrinterNotConnectedException :
  CodedException("ERR_NOT_CONNECTED", "The printer is not connected.", null)

internal class PrinterOpenException(reason: String) :
  CodedException("ERR_OPEN_FAILED", "Could not open the printer: $reason", null)

internal class PrinterWriteException(reason: String, cause: Throwable? = null) :
  CodedException("ERR_WRITE_FAILED", "Sending data to the printer failed: $reason", cause)

/** A previously opened USB connection is no longer usable. */
internal class PrinterStaleConnectionException(cause: Throwable? = null) :
  CodedException(
    "ERR_STALE_CONNECTION",
    "The printer connection is no longer valid.",
    cause,
  )

internal class PrinterRenderException(reason: String, cause: Throwable? = null) :
  CodedException("ERR_RENDER_FAILED", reason, cause)
