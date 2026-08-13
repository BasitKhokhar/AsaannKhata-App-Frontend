CREATE TABLE `bill_items` (
	`id` text PRIMARY KEY NOT NULL,
	`bill_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`stock_type` text NOT NULL,
	`quantity` real,
	`pack_quantity` real,
	`loose_quantity` real,
	`unit` text,
	`width` real,
	`height` real,
	`unit_area` real,
	`total_area` real,
	`length_cm` real,
	`price_per_unit` real NOT NULL,
	`total` real NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bills` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` integer,
	`shop_id` text NOT NULL,
	`customer_id` text,
	`customer_name` text NOT NULL,
	`customer_phone` text,
	`subtotal` real DEFAULT 0 NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`total_amount` real DEFAULT 0 NOT NULL,
	`total_received` real DEFAULT 0 NOT NULL,
	`change_due` real DEFAULT 0 NOT NULL,
	`remaining_due` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text,
	`device_id` text,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` integer,
	`shop_id` text NOT NULL,
	`name` text NOT NULL,
	`image_local_uri` text,
	`image_remote_url` text,
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text,
	`device_id` text,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customer_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` integer,
	`shop_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`amount` real NOT NULL,
	`note` text,
	`device_id` text,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` integer,
	`shop_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`balance` real DEFAULT 0 NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text,
	`device_id` text,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`device_id` text NOT NULL,
	`device_name` text,
	`platform` text,
	`registered` integer DEFAULT false NOT NULL,
	`last_sync_at` text
);
--> statement-breakpoint
CREATE TABLE `entitlement_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subscription_id` integer,
	`tier` text,
	`plan_code` text,
	`status` text,
	`cloud_enabled` integer DEFAULT false NOT NULL,
	`offline_enabled` integer DEFAULT true NOT NULL,
	`max_devices` integer DEFAULT 1 NOT NULL,
	`expiry_date` text,
	`is_trial` integer DEFAULT false NOT NULL,
	`can_write` integer DEFAULT true NOT NULL,
	`fetched_at` text
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` integer,
	`shop_id` text NOT NULL,
	`category_id` text,
	`name` text NOT NULL,
	`image` text,
	`stock_type` text DEFAULT 'QUANTITY' NOT NULL,
	`stock_quantity` real DEFAULT 0 NOT NULL,
	`stock_area_cm2` real DEFAULT 0 NOT NULL,
	`sheet_width_cm` real,
	`sheet_height_cm` real,
	`sheet_area_cm2` real,
	`stock_length_cm` real DEFAULT 0 NOT NULL,
	`pack_size` integer,
	`stock_packs` real DEFAULT 0 NOT NULL,
	`stock_loose_units` real DEFAULT 0 NOT NULL,
	`pack_purchase_price` real,
	`pack_sale_price` real,
	`purchase_price` real NOT NULL,
	`sale_price` real NOT NULL,
	`low_stock_threshold` real,
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text,
	`device_id` text,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shops` (
	`id` text PRIMARY KEY NOT NULL,
	`admin_id` integer NOT NULL,
	`shop_type_id` integer NOT NULL,
	`shop_type_code` text,
	`name` text NOT NULL,
	`address` text,
	`phone` text,
	`logo_local_uri` text,
	`logo_remote_url` text,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stock_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` integer,
	`shop_id` text NOT NULL,
	`product_id` text NOT NULL,
	`type` text NOT NULL,
	`quantity` real NOT NULL,
	`price` real,
	`description` text,
	`device_id` text,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
