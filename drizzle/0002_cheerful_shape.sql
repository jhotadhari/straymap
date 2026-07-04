CREATE TABLE `tracks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text DEFAULT (current_timestamp) NOT NULL,
	`line_id` integer,
	`title` text,
	`settings` text,
	`data` text,
	FOREIGN KEY (`line_id`) REFERENCES `lines`(`id`) ON UPDATE no action ON DELETE set null
);
