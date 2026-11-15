ALTER TABLE `bill_items` ADD `volume_ml` real;--> statement-breakpoint
ALTER TABLE `products` ADD `stock_volume_ml` real DEFAULT 0 NOT NULL;