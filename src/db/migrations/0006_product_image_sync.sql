ALTER TABLE `products` ADD `image_local_uri` text;
--> statement-breakpoint
ALTER TABLE `products` ADD `image_remote_url` text;
--> statement-breakpoint
UPDATE `products`
SET `image_remote_url` = `image`
WHERE `image` LIKE 'http://%' OR `image` LIKE 'https://%';
--> statement-breakpoint
UPDATE `products`
SET `image_local_uri` = `image`
WHERE `image` IS NOT NULL AND `image_remote_url` IS NULL;
