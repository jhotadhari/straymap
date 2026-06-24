SELECT InitSpatialMetaData('WGS84');
--> statement-breakpoint
ALTER TABLE `lines` DROP COLUMN `geometry`;
--> statement-breakpoint
SELECT AddGeometryColumn('lines', 'geometry', 4326, 'LINESTRINGZ', 'XYZ', 1);
--> statement-breakpoint
ALTER TABLE `routing_points` DROP COLUMN `geometry`;
--> statement-breakpoint
SELECT AddGeometryColumn('routing_points', 'geometry', 4326, 'POINTZ', 'XYZ', 1);
--> statement-breakpoint