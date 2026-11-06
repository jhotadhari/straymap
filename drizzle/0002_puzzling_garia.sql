CREATE TABLE `track_points` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`track_id` integer NOT NULL,
	`line_id` integer NOT NULL,
	`point_index` integer NOT NULL,
	`timestamp` integer NOT NULL,
	`speed` real,
	`accuracy` real,
	`bearing` real,
	`gnss_altitude` real,
	`elevation_source` text NOT NULL,
	`data` text,
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`line_id`) REFERENCES `lines`(`id`) ON UPDATE no action ON DELETE cascade
);
