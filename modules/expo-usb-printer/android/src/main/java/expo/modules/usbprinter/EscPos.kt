package expo.modules.usbprinter

import android.graphics.Bitmap
import java.io.ByteArrayOutputStream

/** ESC/POS raster encoder shared by USB, Classic SPP and BLE transports.
 * Receipts use GS v 0 bitmap bands to preserve logos and multilingual text.
 * The diagnostic slip uses ASCII. Firmware support must be checked by a test print.
 */
internal object EscPos {
  private const val ESC: Byte = 0x1B
  private const val GS: Byte = 0x1D
  private const val LF: Byte = 0x0A

  /**
   * Rows of dots emitted per `GS v 0` command. Small bands keep each USB
   * transfer well inside the printer's input buffer (a 576-dot band is 72 bytes
   * per row, so 64 rows = 4608 bytes) which is what stops long receipts from
   * tearing or dropping mid-print on cheap firmware.
   */
  private const val DEFAULT_BAND_HEIGHT = 64

  fun initialise(): ByteArray = byteArrayOf(ESC, 0x40)

  fun feed(lines: Int): ByteArray = byteArrayOf(ESC, 0x64, lines.coerceIn(0, 255).toByte())

  /** Feed `lines` then full-cut. Enable only for printers with a compatible cutter. */
  fun cut(lines: Int = 3): ByteArray =
    byteArrayOf(GS, 0x56, 0x42, lines.coerceIn(0, 255).toByte())

  fun align(mode: Int): ByteArray = byteArrayOf(ESC, 0x61, mode.coerceIn(0, 2).toByte())

  fun bold(on: Boolean): ByteArray = byteArrayOf(ESC, 0x45, if (on) 1 else 0)

  /** `scale` 1..4 — applied to both width and height. */
  fun size(scale: Int): ByteArray {
    val s = (scale.coerceIn(1, 4) - 1)
    return byteArrayOf(GS, 0x21, ((s shl 4) or s).toByte())
  }

  /**
   * CP437 is the factory default codepage on essentially every ESC/POS clone,
   * so the self-test slip is restricted to ASCII and encoded as such. Real
   * receipts never take this path (they are rasterised), which is why no
   * codepage switching is implemented here.
   */
  fun line(text: String): ByteArray =
    text.replace(Regex("[^\\x20-\\x7E]"), "?").toByteArray(Charsets.US_ASCII) + LF

  /**
   * Encodes a bitmap as a sequence of `GS v 0` raster bands.
   *
   * @param threshold luminance (0..255) at or below which a pixel becomes a dot.
   * @param dither Floyd–Steinberg error diffusion. Off by default: diffusion makes
   *   small text on a 203dpi head look noisy, while a hard threshold keeps the
   *   glyph edges clean. Worth turning on for photographic logos.
   */
  fun raster(
    bitmap: Bitmap,
    threshold: Int = 180,
    dither: Boolean = false,
    bandHeight: Int = DEFAULT_BAND_HEIGHT,
  ): ByteArray {
    val width = bitmap.width
    val height = bitmap.height
    if (width <= 0 || height <= 0) return ByteArray(0)

    val bytesPerRow = (width + 7) / 8
    val band = bandHeight.coerceIn(1, 255)
    val out = ByteArrayOutputStream(bytesPerRow * height + 64)

    val pixelRow = IntArray(width)
    // Error diffusion only ever reaches the next row, so two rolling buffers are
    // enough and the whole image never has to be held as floats.
    var errCurrent = DoubleArray(width + 2)
    var errNext = DoubleArray(width + 2)

    var y = 0
    while (y < height) {
      val rows = minOf(band, height - y)
      val payload = ByteArray(bytesPerRow * rows)

      for (r in 0 until rows) {
        bitmap.getPixels(pixelRow, 0, width, 0, y + r, width, 1)
        java.util.Arrays.fill(errNext, 0.0)

        for (x in 0 until width) {
          val argb = pixelRow[x]
          val alpha = (argb ushr 24) and 0xFF
          val red = (argb shr 16) and 0xFF
          val green = (argb shr 8) and 0xFF
          val blue = argb and 0xFF

          // Composite onto white: a transparent pixel must print as paper, not
          // as a black block (WebView backgrounds can come through as alpha 0).
          val luminance = if (alpha == 0) {
            255.0
          } else {
            val l = 0.299 * red + 0.587 * green + 0.114 * blue
            if (alpha == 255) l else (l * alpha + 255.0 * (255 - alpha)) / 255.0
          }

          val value = if (dither) luminance + errCurrent[x + 1] else luminance
          val isDot = value <= threshold

          if (dither) {
            val quantised = if (isDot) 0.0 else 255.0
            val error = value - quantised
            errCurrent[x + 2] += error * 7.0 / 16.0
            errNext[x] += error * 3.0 / 16.0
            errNext[x + 1] += error * 5.0 / 16.0
            errNext[x + 2] += error * 1.0 / 16.0
          }

          if (isDot) {
            val index = r * bytesPerRow + (x shr 3)
            payload[index] = (payload[index].toInt() or (0x80 shr (x and 7))).toByte()
          }
        }

        if (dither) {
          val swap = errCurrent
          errCurrent = errNext
          errNext = swap
        }
      }

      out.write(
        byteArrayOf(
          GS, 0x76, 0x30, 0x00,
          (bytesPerRow and 0xFF).toByte(), ((bytesPerRow shr 8) and 0xFF).toByte(),
          (rows and 0xFF).toByte(), ((rows shr 8) and 0xFF).toByte(),
        )
      )
      out.write(payload)
      y += rows
    }

    return out.toByteArray()
  }

  /**
   * Self-test slip. Deliberately text-mode and ASCII-only so it exercises just
   * the USB write path — if this prints but an HTML receipt does not, the fault
   * is in rasterising, not in the connection.
   */
  fun selfTest(deviceLabel: String, widthDots: Int, cutPaper: Boolean = false): ByteArray {
    val out = ByteArrayOutputStream()
    out.write(initialise())
    out.write(align(1))
    out.write(size(2))
    out.write(bold(true))
    out.write(line("ASAANKHATA"))
    out.write(bold(false))
    out.write(size(1))
    out.write(line("Printer Test Page"))
    out.write(line("--------------------------------"))
    out.write(align(0))
    out.write(line("Printer : $deviceLabel"))
    out.write(line("Width   : $widthDots dots"))
    out.write(line("Mode    : ESC/POS"))
    out.write(line("Time    : " + java.text.SimpleDateFormat("dd MMM yyyy HH:mm:ss", java.util.Locale.UK).format(java.util.Date())))
    out.write(line("--------------------------------"))
    out.write(line("1234567890 ABCDEFGHIJKLMNOPQRSTU"))
    out.write(line("abcdefghijklmnopqrstuvwxyz !@#\$%"))
    out.write(align(1))
    out.write(line(""))
    out.write(line("If you can read this, the"))
    out.write(line("printer is connected correctly."))
    out.write(feed(3))
    if (cutPaper) out.write(cut(0))
    return out.toByteArray()
  }
}
