/**
 * External dependencies
 */
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

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
