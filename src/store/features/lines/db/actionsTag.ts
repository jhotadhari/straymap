import { eq } from 'drizzle-orm';
import { sprintf } from 'sprintf-js';

import { dbConnection } from '../../dbLoader/DBConnection';
import { tagsTable, tagsToLinesTable } from './schema/schema';
import { logError } from '../../../../lib/utils';
import { showErrorToast } from '../../../../components/ErrorToast/service';
import i18n from '../../../../assets/i18n/i18n';

export const createTags = async (
	newTags: {
		label: string | null;
		notes: string | null;
		params: any; // ??? any
	}[]
) => {
	if (!dbConnection?.drizzle) {
		return;
	}
	try {
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
	} catch (error) {
		logError('lines/actionsTag.createTags', error);
		showErrorToast(sprintf(i18n.t('errorGeneric'), (error as Error)?.message ?? String(error)));
		throw error;
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
};

export const deleteTag = async (id: number) => {
	dbConnection?.drizzle &&
		(await dbConnection.drizzle.delete(tagsTable).where(eq(tagsTable.id, id)));
	dbConnection?.drizzle &&
		(await dbConnection.drizzle
			.delete(tagsToLinesTable)
			.where(eq(tagsToLinesTable.tag_id, id)));
};
