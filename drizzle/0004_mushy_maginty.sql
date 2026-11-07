CREATE TABLE `line_points` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`line_id` integer NOT NULL,
	`point_index` integer NOT NULL,
	`timestamp` integer NOT NULL,
	`speed` real,
	`data` text,
	FOREIGN KEY (`line_id`) REFERENCES `lines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `line_points_line_id_idx` ON `line_points` (`line_id`);