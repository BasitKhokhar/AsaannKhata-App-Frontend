CREATE TABLE `coin_usage_log` (
	`id` text PRIMARY KEY NOT NULL,
	`action_type` text NOT NULL,
	`amount` real NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
