CREATE TABLE `routes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text DEFAULT (current_timestamp) NOT NULL,
	`point_order` text DEFAULT (json_array()) NOT NULL,
	`line_id` integer,
	FOREIGN KEY (`line_id`) REFERENCES `lines`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `routing_points` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text DEFAULT (current_timestamp) NOT NULL,
	`geometry` blob NOT NULL,
	`profile` text NOT NULL,
	`route_id` integer NOT NULL,
	FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text DEFAULT (current_timestamp) NOT NULL,
	`title` text,
	`data` text,
	`geometry` blob NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text DEFAULT (current_timestamp) NOT NULL,
	`label` text,
	`notes` text,
	`data` text
);
--> statement-breakpoint
CREATE TABLE `tags_to_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tag_id` integer NOT NULL,
	`line_id` integer NOT NULL,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`line_id`) REFERENCES `lines`(`id`) ON UPDATE no action ON DELETE cascade
);
