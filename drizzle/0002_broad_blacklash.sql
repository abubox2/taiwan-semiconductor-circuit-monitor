ALTER TABLE `companies` ADD `subCategory` varchar(160);--> statement-breakpoint
ALTER TABLE `companies` ADD `ticker` varchar(20);--> statement-breakpoint
CREATE INDEX `companies_stage_subcategory_idx` ON `companies` (`supplyChainStage`,`subCategory`);