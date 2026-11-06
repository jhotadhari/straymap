/**
 * External dependencies
 */
import { relations } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Internal dependencies
 */
import { linesTable } from '../../../lines/db/schema/schema';

export const tracksTable = sqliteTable('tracks', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	line_id: integer('line_id').references(() => linesTable.id, { onDelete: 'set null' }),
	title: text('title'),
	settings: text('settings', { mode: 'json' }).$type<any>(),
	data: text('data', { mode: 'json' }).$type<any>(),
});

/**
 * Per-point metadata of a recorded track, aligned to the line's geometry
 * by `point_index` (0-based, matching `lines.geometry.coordinates[i]`).
 *
 * The geometry is the anchor: a crash between the geometry append and the
 * metadata insert leaves missing tail rows (tolerated), never a mismatch.
 * Metadata is historical truth — geometry Z may diverge from
 * `gnss_altitude` later (e.g. DEM re-apply); consumers must not assume
 * equality.
 */
export const trackPointsTable = sqliteTable('track_points', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	track_id: integer('track_id')
		.notNull()
		.references(() => tracksTable.id, { onDelete: 'cascade' }),
	line_id: integer('line_id')
		.notNull()
		.references(() => linesTable.id, { onDelete: 'cascade' }),
	point_index: integer('point_index').notNull(),
	/** GNSS fix time (ms epoch) — the basis for derived speed. */
	timestamp: integer('timestamp').notNull(),
	/** Derived segment speed (m/s) since the previous stored point. */
	speed: real('speed'),
	accuracy: real('accuracy'),
	bearing: real('bearing'),
	/** Raw GNSS altitude (m) at fix time, independent of DEM. */
	gnss_altitude: real('gnss_altitude'),
	/** Which source resolved the geometry Z: 'dem' | 'gnss' | 'none'. */
	elevation_source: text('elevation_source').notNull(),
	/** Future per-point extras (heart rate, cadence, satellites, ...). */
	data: text('data', { mode: 'json' }).$type<any>(),
});

export const tracksRelations = relations(tracksTable, ({ many }) => ({
	points: many(trackPointsTable),
}));

export const trackPointsRelations = relations(trackPointsTable, ({ one }) => ({
	track: one(tracksTable, {
		fields: [trackPointsTable.track_id],
		references: [tracksTable.id],
	}),
	line: one(linesTable, {
		fields: [trackPointsTable.line_id],
		references: [linesTable.id],
	}),
}));
