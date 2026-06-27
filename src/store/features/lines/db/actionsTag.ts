import { eq } from 'drizzle-orm';

import { dbConnection } from '../../dbLoader/DBConnection';
import { tagsTable, tagsToLinesTable } from './schema/schema';
import { withDbErrorHandling } from '../../dbLoader/utils';

export const createTags = withDbErrorHandling(
	'lines/actionsTag.createTags',
	async (
		newTags: {
			label: string | null;
			notes: string | null;
			params: any; // ??? any
		}[]
	) => {
		if (!dbConnection?.drizzle) {
			return;
		}
		const inserted = await dbConnection.drizzle
			.insert(tagsTable)
			.values(
				newTags.map(({ label, notes, params }) => ({
					label: label ?? null,
					notes: notes ?? null,
					params: params ?? null,
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
			params: any; // ??? any
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
		await dbConnection.drizzle
			.update(tagsTable)
			.set({
				...(undefined !== newTag?.label && { label: newTag.label }),
				...(undefined !== newTag?.notes && { notes: newTag.notes }),
				...(undefined !== newTag?.params && { params: newTag.params }),
			})
			.where(eq(tagsTable.id, id));
	}
);

export const deleteTag = withDbErrorHandling('lines/actionsTag.deleteTag', async (id: number) => {
	if (!dbConnection?.drizzle) {
		return;
	}
	await dbConnection.drizzle.delete(tagsTable).where(eq(tagsTable.id, id));
	await dbConnection.drizzle.delete(tagsToLinesTable).where(eq(tagsToLinesTable.tag_id, id));
});
