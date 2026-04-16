ALTER TABLE `offers` DROP COLUMN `imageUrl`;
--> statement-breakpoint
ALTER TABLE `offers` MODIFY COLUMN `active` tinyint NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `offers` MODIFY COLUMN `published` tinyint NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `offers` MODIFY COLUMN `notificationSent` tinyint NOT NULL DEFAULT 0;