CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` integer,
	`shop_id` text NOT NULL,
	`category` text NOT NULL,
	`amount` real NOT NULL,
	`note` text,
	`occurred_at` text NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`deleted_at` text,
	`device_id` text,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL
);
