import { sql } from 'drizzle-orm/sql';
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { lineString } from '../types';

export const linesTable = sqliteTable('lines', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	timestamp: text()
		.default(sql`(current_timestamp)`)
		.notNull(),
	title: text('title'),
	geometry: lineString('geometry').notNull(),
});

// export const tagsTable = sqliteTable('tags', {
// 	id: integer('id').primaryKey({ autoIncrement: true }),
// 	timestamp: text()
// 		.default(sql`(current_timestamp)`)
// 		.notNull(),
// 	label: text('label'),
// 	notes: text('notes'),
// });
// // https://orm.drizzle.team/docs/indexes-constraints#composite-primary-key
// export const tagToLineTable = sqliteTable("tag_to_line", {
// 	tag_id: integer("tag_id"),
// 	line_id: integer("line_id"),
// }, (table) => [
// 	primaryKey({ columns: [table.tag_id, table.line_id] }),
// 	// // Or PK with custom name
// 	// primaryKey({ name: 'custom_name', columns: [table.tag_id, table.line_id] })
// ]);

// https://orm.drizzle.team/docs/indexes-constraints#foreign-key
