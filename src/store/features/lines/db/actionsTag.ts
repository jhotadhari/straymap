/**
 * External dependencies
 */
import { eq } from 'drizzle-orm';

/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { tagsTable, tagsToLinesTable } from './schema/schema';
import { withDbErrorHandling } from '../../dbLoader/utils';

export const createTags = withDbErrorHandling(
	'lines/actionsTag.createTags',
	async (
		newTags: {
			label: string | null;
			notes: string | null;
			data: any; // ??? any
		}[]
	) => {
		if (!dbConnection?.drizzle) {
			return;
		}
		const inserted = await dbConnection.drizzle
			.insert(tagsTable)
			.values(
				newTags.map(({ label, notes, data }) => ({
					label: label ?? null,
					notes: notes ?? null,
					data: data ?? null,
				}))
			)
			.returning({ id: tagsTable.id });
		return inserted;
	}
);

export const updateTag = withDbErrorHandling(
	'lines/actionsTag.updateTag',
	async (
		id: number,
		newTag: Partial<{
			label: string | null;
			notes: string | null;
			data: any; // ??? any
		}>
	) => {
		if (!dbConnection?.drizzle) {
			return;
		}
		const tags = await dbConnection.drizzle
			.select()
			.from(tagsTable)
			.where(eq(tagsTable.id, id))
			.limit(1);
		if (!tags.length) {
			return;
		}
		const existingTag = tags[0];
		await dbConnection.drizzle
			.update(tagsTable)
			.set({
				...(undefined !== newTag?.label && { label: newTag.label }),
				...(undefined !== newTag?.notes && { notes: newTag.notes }),
				...(undefined !== newTag?.data && {
					data: { ...((existingTag.data as any) ?? {}), ...newTag.data },
				}),
			})
			.where(eq(tagsTable.id, id));
	}
);

export const deleteTag = withDbErrorHandling('lines/actionsTag.deleteTag', async (id: number) => {
	if (!dbConnection?.drizzle) {
		return;
	}
	await dbConnection.drizzle.delete(tagsTable).where(eq(tagsTable.id, id));
	// Schema has ON DELETE CASCADE on tags_to_lines.tag_id FK, but
	// PRAGMA foreign_keys may not be ON at runtime. Keep explicit
	// delete as safety net against orphaned join rows.
	await dbConnection.drizzle.delete(tagsToLinesTable).where(eq(tagsToLinesTable.tag_id, id));
});
