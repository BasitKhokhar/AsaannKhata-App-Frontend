CREATE TABLE `product_barcodes` (
	`shop_id` text NOT NULL,
	`code` text NOT NULL,
	`product_id` text NOT NULL,
	`unit` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `product_barcodes_shop_code_idx` ON `product_barcodes` (`shop_id`,`code`);--> statement-breakpoint
CREATE INDEX `product_barcodes_product_idx` ON `product_barcodes` (`product_id`);--> statement-breakpoint
CREATE TABLE `receipt_profiles` (
	`shop_id` text PRIMARY KEY NOT NULL,
	`config` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `bills` ADD `receipt_snapshot` text;--> statement-breakpoint
ALTER TABLE `products` ADD `barcode` text;--> statement-breakpoint
ALTER TABLE `products` ADD `loose_barcode` text;--> statement-breakpoint
CREATE INDEX `products_shop_name_cursor_idx` ON `products` (`shop_id`,`is_deleted`,`name`,`id`);--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `image`;
--> statement-breakpoint
CREATE VIRTUAL TABLE product_search USING fts5(product_id UNINDEXED, name, tokenize='unicode61 remove_diacritics 2', prefix='2 3 4');
--> statement-breakpoint
INSERT INTO product_search(rowid, product_id, name) SELECT rowid, id, name FROM products WHERE is_deleted = 0;
--> statement-breakpoint
CREATE TRIGGER products_search_insert AFTER INSERT ON products WHEN new.is_deleted = 0 BEGIN
  INSERT INTO product_search(rowid, product_id, name) VALUES (new.rowid, new.id, new.name);
END;
--> statement-breakpoint
CREATE TRIGGER products_search_update AFTER UPDATE OF name, is_deleted ON products BEGIN
  DELETE FROM product_search WHERE rowid = old.rowid;
  INSERT INTO product_search(rowid, product_id, name) SELECT new.rowid, new.id, new.name WHERE new.is_deleted = 0;
END;
--> statement-breakpoint
CREATE TRIGGER products_search_delete AFTER DELETE ON products BEGIN
  DELETE FROM product_search WHERE rowid = old.rowid;
END;
--> statement-breakpoint
CREATE TRIGGER products_codes_insert AFTER INSERT ON products WHEN new.is_deleted = 0 BEGIN
  INSERT INTO product_barcodes SELECT new.shop_id, new.barcode, new.id, 'default' WHERE new.barcode IS NOT NULL AND new.barcode != '';
  INSERT INTO product_barcodes SELECT new.shop_id, new.loose_barcode, new.id, 'loose' WHERE new.stock_type = 'PACK' AND new.loose_barcode IS NOT NULL AND new.loose_barcode != '';
END;
--> statement-breakpoint
CREATE TRIGGER products_codes_update AFTER UPDATE OF barcode, loose_barcode, shop_id, stock_type, is_deleted ON products BEGIN
  DELETE FROM product_barcodes WHERE product_id = old.id;
  INSERT INTO product_barcodes SELECT new.shop_id, new.barcode, new.id, 'default' WHERE new.is_deleted = 0 AND new.barcode IS NOT NULL AND new.barcode != '';
  INSERT INTO product_barcodes SELECT new.shop_id, new.loose_barcode, new.id, 'loose' WHERE new.is_deleted = 0 AND new.stock_type = 'PACK' AND new.loose_barcode IS NOT NULL AND new.loose_barcode != '';
END;
--> statement-breakpoint
CREATE TRIGGER products_codes_delete AFTER DELETE ON products BEGIN
  DELETE FROM product_barcodes WHERE product_id = old.id;
END;
