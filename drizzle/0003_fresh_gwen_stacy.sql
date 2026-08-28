ALTER TABLE `monitorSettings` ADD `dueActionCronTaskUid` varchar(65);--> statement-breakpoint
CREATE INDEX `monitor_settings_due_action_uid_idx` ON `monitorSettings` (`dueActionCronTaskUid`);