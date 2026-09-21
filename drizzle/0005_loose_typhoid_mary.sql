CREATE TABLE `customNotificationRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`keywords` text,
	`triggerType` enum('opportunity_created','stage_changed','score_threshold','action_due') NOT NULL,
	`enabled` int NOT NULL DEFAULT 1,
	`priority` enum('critical','high','medium','low'),
	`stage` enum('discovery','qualified','solution','proposal','negotiation','won','lost'),
	`supplyChainStage` enum('upstream','midstream','downstream'),
	`minScore` int,
	`dueWithinHours` int,
	`cooldownHours` int NOT NULL DEFAULT 24,
	`lastTriggeredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customNotificationRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notificationLogs` MODIFY COLUMN `notificationType` enum('priority_created','stage_changed','action_due','custom_rule') NOT NULL;--> statement-breakpoint
ALTER TABLE `notificationLogs` ADD `customRuleId` int;--> statement-breakpoint
CREATE INDEX `custom_notification_rules_enabled_idx` ON `customNotificationRules` (`enabled`);--> statement-breakpoint
CREATE INDEX `custom_notification_rules_trigger_idx` ON `customNotificationRules` (`triggerType`);