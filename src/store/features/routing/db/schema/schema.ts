import { sql } from 'drizzle-orm/sql';
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

import { point } from '../../../dbLoader/types';
import { linesTable } from '../../../lines/db/schema/schema';

export const routesTable = sqliteTable('routes', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	timestamp: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	point_order: text('point_order', { mode: 'json' })
		.notNull()
		.$type<number[]>()
		.default(sql`(json_array())`),
	line_id: integer('line_id').references(() => linesTable.id, { onDelete: 'set null' }),
});

export const routingPointsTable = sqliteTable('routing_points', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	timestamp: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	geometry: point('geometry').notNull(),
	profile: text('profile', { mode: 'json' }).notNull().$type<any>(), // ??? any
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
