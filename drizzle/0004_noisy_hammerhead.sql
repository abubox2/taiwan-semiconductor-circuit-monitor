CREATE TABLE `scheduleRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobType` enum('weekly_research','due_actions') NOT NULL,
	`taskUid` varchar(65) NOT NULL,
	`status` enum('running','success','skipped','failed') NOT NULL DEFAULT 'running',
	`reportId` int,
	`sourceCount` int NOT NULL DEFAULT 0,
	`opportunityCount` int NOT NULL DEFAULT 0,
	`message` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `scheduleRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `schedule_runs_task_idx` ON `scheduleRuns` (`taskUid`);--> statement-breakpoint
CREATE INDEX `schedule_runs_type_started_idx` ON `scheduleRuns` (`jobType`,`startedAt`);