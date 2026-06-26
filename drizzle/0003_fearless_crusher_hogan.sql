PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tags_to_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tag_id` integer NOT NULL,
	`line_id` integer NOT NULL,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`line_id`) REFERENCES `lines`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_tags_to_lines`("id", "tag_id", "line_id") SELECT "id", "tag_id", "line_id" FROM `tags_to_lines`;--> statement-breakpoint
DROP TABLE `tags_to_lines`;--> statement-breakpoint
ALTER TABLE `__new_tags_to_lines` RENAME TO `tags_to_lines`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_routes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text DEFAULT (current_timestamp) NOT NULL,
	`point_order` text DEFAULT (json_array()) NOT NULL,
	`line_id` integer,
	FOREIGN KEY (`line_id`) REFERENCES `lines`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_routes`("id", "timestamp", "point_order", "line_id") SELECT "id", "timestamp", "point_order", "line_id" FROM `routes`;--> statement-breakpoint
DROP TABLE `routes`;--> statement-breakpoint
ALTER TABLE `__new_routes` RENAME TO `routes`;--> statement-breakpoint
CREATE TABLE `__new_routing_points` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text DEFAULT (current_timestamp) NOT NULL,
	`geometry` blob NOT NULL,
	`profile` text NOT NULL,
	`route_id` integer NOT NULL,
	FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_routing_points`("id", "timestamp", "geometry", "profile", "route_id") SELECT "id", "timestamp", "geometry", "profile", "route_id" FROM `routing_points`;--> statement-breakpoint
DROP TABLE `routing_points`;--> statement-breakpoint
ALTER TABLE `__new_routing_points` RENAME TO `routing_points`;