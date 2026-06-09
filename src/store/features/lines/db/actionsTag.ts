import { eq } from 'drizzle-orm';

import { dbZ } from '../../../../db/client';
import { tagsTable, tagsToLinesTable } from './schema/schema';

export const createTags = async (
	newTags: {
		label: string | null;
		notes: string | null;
		params: any; // ??? any
	}[]
) => {
	try {
		const inserted = await dbZ
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
	} catch (error) {
		console.log('debug error', error); // debug
	}
};

export const updateTag = async (
	id: number,
	newTag: Partial<{
		label: string | null;
		notes: string | null;
		params: any; // ??? any
	}>
) => {
	const tags = await dbZ.select().from(tagsTable).where(eq(tagsTable.id, id)).limit(1);
	if (!tags.length) {
		return;
	}
	await dbZ
		.update(tagsTable)
		.set({
			...(undefined !== newTag?.label && { label: newTag.label }),
			...(undefined !== newTag?.notes && { notes: newTag.notes }),
			...(undefined !== newTag?.params && { params: newTag.params }),
		})
		.where(eq(tagsTable.id, id));
};

export const deleteTag = async (id: number) => {
	await dbZ.delete(tagsTable).where(eq(tagsTable.id, id));
	await dbZ.delete(tagsToLinesTable).where(eq(tagsToLinesTable.tag_id, id));
};
