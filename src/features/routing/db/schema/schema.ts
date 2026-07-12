/**
 * External dependencies
 */
import { sql } from 'drizzle-orm/sql';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

import { point } from '../../../dbLoader/types';
import { linesTable } from '../../../lines/db/schema/schema';

// drizzle-kit migration safety for non-spatial tables:
// INSERT INTO __new SELECT preserves data for columns shared between old and new.
// Safe: adding nullable columns or columns with defaults, FK constraint changes,
// column renames.  NOT safe: NOT NULL column without a default (migration fails
// on existing rows), dropping a column (data silently lost).
export const routesTable = sqliteTable('routes', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	point_order: text('point_order', { mode: 'json' })
		.notNull()
		.$type<number[]>()
		.default(sql`(json_array())`),
	line_id: integer('line_id').references(() => linesTable.id, { onDelete: 'set null' }),
});

// claude:warning ⛔ DO NOT EDIT THIS TABLE'S COLUMNS — it has a SpatiaLite
// geometry column created via AddGeometryColumn in drizzle/0001_initSpatial.sql.
// drizzle-kit cannot generate spatial DDL. Any column change here will cause
// drizzle-kit to recreate the table (CREATE __new_* → INSERT SELECT → DROP →
// RENAME), silently losing the AddGeometryColumn metadata and CreateSpatialIndex
// R*Tree indexes.  To extend this table, add a JSON column like `profile`.
export const routingPointsTable = sqliteTable('routing_points', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	geometry: point('geometry').notNull(),
	profile: text('profile', { mode: 'json' }).notNull().$type<any>(), // ??? type any. is that ok?
	route_id: integer('route_id')
		.references(() => routesTable.id)
		.notNull(),
});

export const routesRelations = relations(routesTable, ({ one, many }) => ({
	line: one(linesTable, {
		fields: [routesTable.line_id],
		references: [linesTable.id],
	}),
	points: many(routingPointsTable),
}));

export const routingPointsRelations = relations(routingPointsTable, ({ one }) => ({
	route: one(routesTable, {
		fields: [routingPointsTable.route_id],
		references: [routesTable.id],
	}),
}));
