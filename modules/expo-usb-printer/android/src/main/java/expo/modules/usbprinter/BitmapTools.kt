package expo.modules.usbprinter

import android.graphics.Bitmap

/** White-space detection and trimming for rasterized receipt pages. */
internal object BitmapTools {

  /** Luminance at or above which a pixel counts as bare paper. */
  const val WHITE_CUTOFF = 240

  /** Rows of paper kept below the last printed dot, before the cut feed. */
  private const val BOTTOM_MARGIN_PX = 16

  fun luminance(argb: Int): Int {
    val alpha = (argb ushr 24) and 0xFF
    if (alpha == 0) return 255 // transparent composites onto white paper
    val red = (argb shr 16) and 0xFF
    val green = (argb shr 8) and 0xFF
    val blue = argb and 0xFF
    return (0.299 * red + 0.587 * green + 0.114 * blue).toInt()
  }

  fun isRowWhite(bitmap: Bitmap, buffer: IntArray, y: Int): Boolean {
    bitmap.getPixels(buffer, 0, bitmap.width, 0, y, bitmap.width, 1)
    for (pixel in buffer) {
      if (luminance(pixel) < WHITE_CUTOFF) return false
    }
    return true
  }

  /**
   * Crops the leading and trailing white bands.
   *
   * This does real work on every print: a PDF page is a fixed height, so a short
   * receipt on a tall page is mostly empty — without trimming, the printer would
   * feed all that blank paper before the cut. It also absorbs an over-estimated
   * HTML content height instead of printing the overshoot.
   *
   * Recycles the source bitmap when a smaller copy is returned.
   */
  fun trimWhitespace(bitmap: Bitmap): Bitmap {
    val width = bitmap.width
    val height = bitmap.height
    if (width <= 0 || height <= 0) return bitmap
    val row = IntArray(width)

    var top = 0
    while (top < height && isRowWhite(bitmap, row, top)) top++
    if (top >= height) return bitmap // entirely blank; callers detect that separately

    var bottom = height - 1
    while (bottom > top && isRowWhite(bitmap, row, bottom)) bottom--

    val end = minOf(height - 1, bottom + BOTTOM_MARGIN_PX)
    val trimmedHeight = end - top + 1
    if (trimmedHeight >= height) return bitmap

    val trimmed = Bitmap.createBitmap(bitmap, 0, top, width, trimmedHeight)
    if (trimmed != bitmap) bitmap.recycle()
    return trimmed
  }
}
