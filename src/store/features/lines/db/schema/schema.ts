import { sql } from 'drizzle-orm/sql';
import { relations } from 'drizzle-orm';
import {
    AnySQLiteColumn,
    integer,
    sqliteTable,
    text,
} from 'drizzle-orm/sqlite-core';

import { lineString } from '../../../../../db/types';

export const linesTable = sqliteTable('lines', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    timestamp: text()
        .default(sql`(current_timestamp)`)
        .notNull(),
    title: text('title'),
    geometry: lineString('geometry').notNull(),
});

export const tagsTable = sqliteTable('tags', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    timestamp: text()
        .default(sql`(current_timestamp)`)
        .notNull(),
    label: text('label'),
    notes: text('notes'),
    params: text('params', { mode: 'json' }).$type<any>(), // ??? any
});

export const tagsToLinesTable = sqliteTable(
    'tags_to_lines',
    {
        id: integer('id').primaryKey({ autoIncrement: true }),
        tag_id: integer('tag_id')
            .notNull()
            .references((): AnySQLiteColumn => tagsTable.id), //, { onDelete: 'cascade' })
        line_id: integer('line_id')
            .notNull()
            .references((): AnySQLiteColumn => linesTable.id), //, { onDelete: 'cascade' })
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
