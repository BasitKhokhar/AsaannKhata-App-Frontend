package expo.modules.usbprinter

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.ParcelFileDescriptor
import java.io.File
import kotlin.math.roundToInt

/** Stream one page at a time. Never retain all bitmap pages for a long bill. */
internal class PdfRasterizer {
  fun forEachPage(fileUri: String, widthDots: Int, consume: (Bitmap) -> Unit) {
    val uri = Uri.parse(fileUri)
    if (uri.scheme != null && uri.scheme != "file") throw PrinterRenderException("Only local PDF files are supported")
    val file = File(uri.path ?: fileUri)
    if (!file.isFile || file.length() == 0L) throw PrinterRenderException("The receipt PDF is missing")
    ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY).use { descriptor ->
      PdfRenderer(descriptor).use { renderer ->
        if (renderer.pageCount !in 1..200) throw PrinterRenderException("Receipt must contain 1 to 200 pages")
        var printed = false
        for (index in 0 until renderer.pageCount) {
          renderer.openPage(index).use { page ->
            if (page.width <= 0 || page.height <= 0) throw PrinterRenderException("Invalid PDF page size")
            val height = (page.height.toDouble() * widthDots / page.width).roundToInt()
            // Fail explicitly rather than silently shrinking or cropping a page.
            if (height !in 1..12000) throw PrinterRenderException("Receipt page is too tall")
            var bitmap = Bitmap.createBitmap(widthDots, height, Bitmap.Config.ARGB_8888)
            try {
              bitmap.eraseColor(Color.WHITE)
              page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_PRINT)
              val row = IntArray(bitmap.width)
              var first = 0
              while (first < bitmap.height && BitmapTools.isRowWhite(bitmap, row, first)) first++
              if (first < bitmap.height) {
                bitmap = BitmapTools.trimWhitespace(bitmap)
                consume(bitmap)
                printed = true
              }
            } finally { if (!bitmap.isRecycled) bitmap.recycle() }
          }
        }
        if (!printed) throw PrinterRenderException("Receipt rendered blank")
      }
    }
  }
}
