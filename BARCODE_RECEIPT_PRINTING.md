# Barcode, receipt, and thermal printing integration

## Setup and rollout

1. Deploy the matching backend migration `20261106000000_barcode_receipts` with the normal backup/migration workflow, regenerate Prisma Client, then deploy the backend code. No database migration has been run by this implementation. The `/sync/receipt-profile` capability response prevents new product/receipt fields being silently pushed to an old server.
2. Build a new Android development/release binary. Expo Go and an OTA-only update cannot add the camera, SQLite FTS configuration, or local native printer module. Use `npx expo prebuild --platform android` and the normal EAS/local native build workflow.
3. In Settings, configure Barcode scanner, Receipt design, and Receipt printers. Branding defaults to the active shop; receipt templates sync per shop. Printer connections and scanner preferences belong to the phone. The printer screen shows whether a unit is attached, paired, saved, or actively connected, along with its connection details.
4. Select the exact printer and paper/head width, then use **Connect & test print**. Print an actual receipt as a final check before using a printer for customer transactions.

## Supported paths and limits

| Path | Setup | Compatibility boundary |
| --- | --- | --- |
| Android USB/OTG | Attach a powered printer via a data-capable OTG adapter, select it and grant USB access | USB printer class or vendor interface with bulk OUT, using ESC/POS raster commands. An interface is not proof of command compatibility. |
| Android Bluetooth Classic | Pair in Android settings, allow Nearby devices, select the paired printer | SPP/RFCOMM printers accepting ESC/POS |
| Android BLE | Allow scan permission, scan nearby devices, select the printer and its documented writable GATT channel | ESC/POS stream over that channel. Proprietary protocols, authentication, or flow-control extensions require an adapter. |
| System printing / PDF sharing | Select System printing; use a compatible installed print service or share PDF | Available through the platform; direct Android transports are not implemented on iOS |

50, 55, 58 and 80 mm paper profiles are available; the print-head width is independently selectable (320/360/384 dots for small paper, 512/576 for 80 mm). The defaults are starting points, not model specifications. Choose the width from the printer's documentation. Cutter commands are opt-in; portable printers often have no cutter. A4 is available for system/PDF receipts.

There is no universal “all Bluetooth printers” command protocol. ESC/POS raster support must be confirmed. CPCL, TSPL, ZPL, proprietary photo/label printers, MFi drivers, Wi-Fi/network sockets, and proprietary BLE framing are not implemented by the direct-print module. Use a manufacturer print service where available.

Android 12+ uses Nearby devices permissions. Android 11 and earlier require location permission for BLE discovery (some devices also require location services enabled). USB permission is checked on every connection and may be revoked after unplugging. No permanent-grant assumption is made.

## Implementation

- `product_barcodes` has a unique `(shop_id, code)` index across normal/loose pack codes. Scanning uses an exact indexed local lookup, preserves leading zeros, and canonicalizes UPC/EAN aliases. Repeated intentional scans increment the cart; camera events close after one capture.
- Product names use a local FTS5 token-prefix index maintained by triggers. Catalog and billing render bounded keyset pages through FlashList; they do not fetch/filter thousands of products on every keystroke. Search uses a short debounce. Separate shop-scoped counts support dashboards.
- Camera scanning and keyboard/HID scanners are supported. HID scanners must send Enter after a barcode. Unrecognized codes can be linked to a product or used when creating one. Generated internal IDs are not registered retail GTINs; barcode label printing is not included.
- Receipt snapshots preserve branding and original checkout amounts. Later-payment statements are explicitly selected separately. HTML escapes shop/customer/product text; Urdu/Hindi fonts are bundled for offline PDF rendering.
- Direct printing renders the receipt PDF to monochrome ESC/POS raster, one page at a time, on a native worker. This preserves logos and multilingual text without relying on printer code pages. Native transport writes are bounded and serialized. BLE uses conservative 20-byte packets with write callbacks and pacing; actual speed depends on firmware.
- Only one print job runs across screens. Jobs are never retried after a possible partial write. A transport accepting bytes does not prove paper printed: check paper/power before manually retrying. Cancel closes the active transport. Print PDFs are deleted after the native job completes; shared PDFs stay in app cache so receiving apps can finish reading them.
- Receipt-profile conflicts are shown for resolution without blocking product/bill pushes after the backend capability check. Backend barcode uniqueness is enforced in the product transaction to protect concurrent devices.

## Reference guide review

The supplied `Sheerenaab App/recieptpritningg/THERMAL_PRINTING_INTEGRATION.md` and its module were used as the USB/raster starting point. It targets SDK 56 and USB only. This app uses SDK 57 and adds Classic/BLE transports, explicit printer selection, bounded jobs, per-printer profiles, and one-page-at-a-time PDF processing. Its “permission once, ever” claim was deliberately not retained; Android may revoke access. Vendor-class detection is only a candidate-device filter, not universal compatibility certification.

## Verification and hardware release checks

Automated checks: `node --test scripts/barcodeReceipts.test.cjs scripts/multiShopSync.test.cjs`; backend `npm test`; `npx prisma validate`; Android JS export; native `:expo-usb-printer:compileDebugKotlin`.

The SQLite performance fixture has 10,000 products and checks indexed exact lookup, Unicode search, pagination, and trigger updates. Host timings are not phone performance guarantees.

Before release, test on real phones/printers:

- USB 80 mm and small Classic/BLE printer: permission deny/allow, attach/detach, power cycle, app restart, Bluetooth disabled, unavailable device, and two identical USB units.
- Test each configured paper/head width; English/Urdu/Hindi, logo, long shop/item names, pack/loose quantities, long multi-page bills, original receipt and updated statement, PDF share, optional cutter.
- Unplug/switch off midway through a receipt; verify no automatic retry, responsive UI, manual recovery, and no duplicate bills/stock writes. Test paper-out; many generic printers cannot report it through this interface.
- Fast repeated HID scans, camera duplicate frames, unknown codes, duplicate-code rejection, low/out-of-stock, shop switching, and catalog search on a low-memory phone with 10,000 products.
- Upgrade an existing database, sync two devices with conflicting barcode assignments/template edits, and confirm the migrated backend retains receipt snapshots.

Validation on 2026-11-06: Android JavaScript export passed; the local native printer module compiled successfully with `:expo-usb-printer:compileDebugKotlin`; backend tests and Prisma schema validation passed. This is module compilation, not a signed full-app release build.

No physical printer output or device throughput is certified by repository tests alone.
