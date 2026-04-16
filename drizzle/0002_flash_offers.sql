ALTER TABLE `offers` ADD `serviceId` int;
--> statement-breakpoint
ALTER TABLE `offers` ADD `offerDescription` text;
--> statement-breakpoint
ALTER TABLE `offers` ADD `promotionalPrice` decimal(10,2);
--> statement-breakpoint
ALTER TABLE `offers` ADD `active` boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE `offers` ADD CONSTRAINT `offers_serviceId_services_id_fk` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE set null ON UPDATE no action;