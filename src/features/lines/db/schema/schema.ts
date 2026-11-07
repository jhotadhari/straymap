/**
 * External dependencies
 */
import { sql } from 'drizzle-orm/sql';
import { relations } from 'drizzle-orm';
import { AnySQLiteColumn, index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Internal dependencies
 */
import { lineString } from '../../../dbLoader/types';

// claude:warning ⛔ DO NOT EDIT THIS TABLE'S COLUMNS — it has a SpatiaLite
// geometry column created via AddGeometryColumn in drizzle/0001_initSpatial.sql.
// drizzle-kit cannot generate spatial DDL. Any column change here will cause
// drizzle-kit to recreate the table (CREATE __new_* → INSERT SELECT → DROP →
// RENAME), silently losing the AddGeometryColumn metadata and CreateSpatialIndex
// R*Tree indexes.  To extend this table, add fields to the `data` JSON column.
export const linesTable = sqliteTable('lines', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	created_at: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	modified_at: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	custom_date: text().default(sql`(current_timestamp)`),
	title: text('title'),
	data: text('data', { mode: 'json' }).$type<any>(),
	geometry: lineString('geometry').notNull(),
});

// drizzle-kit migration safety for non-spatial tables:
// INSERT INTO __new SELECT preserves data for columns shared between old and new.
// Safe: adding nullable columns or columns with defaults, FK constraint changes,
// column renames.  NOT safe: NOT NULL column without a default (migration fails
// on existing rows), dropping a column (data silently lost).
export const tagsTable = sqliteTable('tags', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	timestamp: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	label: text('label'),
	notes: text('notes'),
	data: text('data', { mode: 'json' }).$type<any>(),
});

export const tagsToLinesTable = sqliteTable(
	'tags_to_lines',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		tag_id: integer('tag_id')
			.notNull()
			.references((): AnySQLiteColumn => tagsTable.id, { onDelete: 'cascade' }),
		line_id: integer('line_id')
			.notNull()
			.references((): AnySQLiteColumn => linesTable.id, { onDelete: 'cascade' }),
	}
	// (table) => [
	// 	primaryKey({ columns: [table.tag_id, table.line_id] }),
	// 	// primaryKey(table.tag_id, table.line_id)
	// ]
);

export const tagsRelations = relations(tagsTable, ({ many }) => ({
	lines: many(tagsToLinesTable),
}));

export const linesRelations = relations(linesTable, ({ many }) => ({
	tags: many(tagsToLinesTable),
}));

export const tagsToLinesTableRelations = relations(tagsToLinesTable, ({ one }) => ({
	tag: one(tagsTable, {
		fields: [tagsToLinesTable.tag_id],
		references: [tagsTable.id],
	}),
	line: one(linesTable, {
		fields: [tagsToLinesTable.line_id],
		references: [linesTable.id],
	}),
}));

/**
 * Per-point time metadata for imported lines, aligned to the line's
 * geometry by `point_index` (0-based, matching
 * `lines.geometry.coordinates[i]`).  Mirrors trackRecording's
 * `track_points` (minus the `tracks` coupling) so imported GPX tracks
 * can surface time-based stats (duration, moving time, speed) with the
 * same window-function aggregation.
 *
 * `speed` is the derived segment speed (m/s) since the previous stored
 * point, computed at import time.  `data` is reserved for future
 * per-point extras (heart rate, cadence, ...).
 */
export const linePointsTable = sqliteTable(
	'line_points',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		line_id: integer('line_id')
			.notNull()
			.references((): AnySQLiteColumn => linesTable.id, { onDelete: 'cascade' }),
		point_index: integer('point_index').notNull(),
		timestamp: integer('timestamp').notNull(),
		speed: real('speed'),
		data: text('data', { mode: 'json' }).$type<any>(),
	},
	(table) => [index('line_points_line_id_idx').on(table.line_id)]
);

export const linePointsRelations = relations(linePointsTable, ({ one }) => ({
	line: one(linesTable, {
		fields: [linePointsTable.line_id],
		references: [linesTable.id],
	}),
}));
