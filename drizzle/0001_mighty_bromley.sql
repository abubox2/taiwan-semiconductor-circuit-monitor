CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`supplyChainStage` enum('upstream','midstream','downstream') NOT NULL,
	`region` varchar(120) NOT NULL,
	`city` varchar(120),
	`status` enum('verified','review','nurture') NOT NULL DEFAULT 'review',
	`priority` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
	`score` int NOT NULL DEFAULT 0,
	`website` varchar(500),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `companies_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `contactLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`opportunityId` int,
	`contactId` int,
	`channel` enum('call','email','meeting','message','other') NOT NULL,
	`contactedAt` timestamp NOT NULL,
	`summary` text NOT NULL,
	`nextStep` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contactLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`jobTitle` varchar(255),
	`department` varchar(255),
	`email` varchar(320),
	`phone` varchar(80),
	`profileUrl` varchar(1000),
	`sourceNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidenceSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`opportunityId` int,
	`sourceType` enum('company','government','filing','media','industry','other') NOT NULL,
	`quality` enum('primary','secondary','lead') NOT NULL DEFAULT 'secondary',
	`title` varchar(500) NOT NULL,
	`url` varchar(1000) NOT NULL,
	`publishedAt` timestamp,
	`excerpt` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidenceSources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `facilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`facilityType` enum('fab','datacenter','office','rd','warehouse','other') NOT NULL,
	`region` varchar(120) NOT NULL,
	`city` varchar(120) NOT NULL,
	`address` text,
	`latitude` varchar(32),
	`longitude` varchar(32),
	`operationalStatus` enum('planning','construction','operational','expansion') NOT NULL DEFAULT 'planning',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `facilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monitorSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weeklyCron` varchar(64) NOT NULL DEFAULT '0 0 1 * * 0',
	`timezone` varchar(64) NOT NULL DEFAULT 'Asia/Taipei',
	`scheduleCronTaskUid` varchar(65),
	`scheduleEnabled` int NOT NULL DEFAULT 0,
	`recipientName` varchar(160),
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitorSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `networkRequirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`facilityId` int NOT NULL,
	`requirementType` enum('leased_line','dia','dci','cloud_connect','iepl_iplc','backup','network_equipment','other') NOT NULL,
	`bandwidth` varchar(120),
	`equipment` text,
	`estimatedTiming` varchar(160),
	`scale` enum('pilot','site','multi_site','enterprise') NOT NULL DEFAULT 'site',
	`confidence` enum('verified','review','nurture') NOT NULL DEFAULT 'review',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `networkRequirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opportunityId` int NOT NULL,
	`notificationType` enum('priority_created','stage_changed','action_due') NOT NULL,
	`recipientName` varchar(160),
	`deliveredAt` timestamp,
	`status` enum('pending','delivered','failed') NOT NULL DEFAULT 'pending',
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notificationLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`facilityId` int,
	`title` varchar(255) NOT NULL,
	`owner` varchar(120),
	`stage` enum('discovery','qualified','solution','proposal','negotiation','won','lost') NOT NULL DEFAULT 'discovery',
	`priority` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
	`score` int NOT NULL DEFAULT 0,
	`estimatedAmount` int,
	`nextAction` text,
	`nextActionDue` timestamp,
	`serviceHypothesis` text,
	`verificationQuestion` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weeklyReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`summary` text NOT NULL,
	`content` text NOT NULL,
	`opportunityCount` int NOT NULL DEFAULT 0,
	`sourceCount` int NOT NULL DEFAULT 0,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weeklyReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `companies_stage_region_idx` ON `companies` (`supplyChainStage`,`region`);--> statement-breakpoint
CREATE INDEX `companies_priority_idx` ON `companies` (`priority`);--> statement-breakpoint
CREATE INDEX `contact_logs_company_idx` ON `contactLogs` (`companyId`);--> statement-breakpoint
CREATE INDEX `contact_logs_opportunity_idx` ON `contactLogs` (`opportunityId`);--> statement-breakpoint
CREATE INDEX `contacts_company_idx` ON `contacts` (`companyId`);--> statement-breakpoint
CREATE INDEX `evidence_company_idx` ON `evidenceSources` (`companyId`);--> statement-breakpoint
CREATE INDEX `evidence_opportunity_idx` ON `evidenceSources` (`opportunityId`);--> statement-breakpoint
CREATE INDEX `facilities_company_idx` ON `facilities` (`companyId`);--> statement-breakpoint
CREATE INDEX `facilities_region_city_idx` ON `facilities` (`region`,`city`);--> statement-breakpoint
CREATE INDEX `monitor_settings_schedule_uid_idx` ON `monitorSettings` (`scheduleCronTaskUid`);--> statement-breakpoint
CREATE INDEX `network_requirements_facility_idx` ON `networkRequirements` (`facilityId`);--> statement-breakpoint
CREATE INDEX `notification_opportunity_idx` ON `notificationLogs` (`opportunityId`);--> statement-breakpoint
CREATE INDEX `opportunities_company_idx` ON `opportunities` (`companyId`);--> statement-breakpoint
CREATE INDEX `opportunities_stage_priority_idx` ON `opportunities` (`stage`,`priority`);--> statement-breakpoint
CREATE INDEX `opportunities_due_idx` ON `opportunities` (`nextActionDue`);--> statement-breakpoint
CREATE INDEX `weekly_reports_period_idx` ON `weeklyReports` (`periodStart`);