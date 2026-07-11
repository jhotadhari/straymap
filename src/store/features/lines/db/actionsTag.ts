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
import { featureRegistry } from '../../FeatureRegistry';

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
		// Guard: prevent creating tags with system-reserved labels.
		const systemLabels = featureRegistry.getSystemTagLabels();
		const filtered = newTags.filter(({ label }) => !systemLabels.includes(label ?? ''));
		if (!filtered.length) {
			return [];
		}
		const inserted = await dbConnection.drizzle
			.insert(tagsTable)
			.values(
				filtered.map(({ label, notes, data }) => ({
					label: label ?? null,
					notes: notes ?? null,
					data: data ?? null,
				}))
			)
			.returning({ id: tagsTable.id });
		return inserted;
	}
);

export const ensureTagByLabel = withDbErrorHandling(
	'lines/actionsTag.ensureTagByLabel',
	async (label: string) => {
		if (!dbConnection?.drizzle) {
			return;
		}
		// Check if a tag already exists with this label.
		const existing = await dbConnection.drizzle
			.select({ id: tagsTable.id })
			.from(tagsTable)
			.where(eq(tagsTable.label, label))
			.limit(1);
		if (existing.length) {
			return existing[0].id;
		}
		// Create if not found.
		const created = await dbConnection.drizzle
			.insert(tagsTable)
			.values({ label, notes: null, data: null })
			.returning({ id: tagsTable.id });
		return created.length ? created[0].id : undefined;
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
		// Guard: prevent renaming system-protected tag labels,
		// and prevent renaming any tag to a system-reserved label.
		const systemLabels = featureRegistry.getSystemTagLabels();
		const isSystemTag = systemLabels.includes(existingTag.label ?? '');
		const wouldBecomeSystemLabel =
			undefined !== newTag?.label && systemLabels.includes(newTag.label ?? '');
		await dbConnection.drizzle
			.update(tagsTable)
			.set({
				...(undefined !== newTag?.label &&
					!isSystemTag &&
					!wouldBecomeSystemLabel && { label: newTag.label }),
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
	// Guard: prevent deletion of system-protected tags.
	const [tag] = await dbConnection.drizzle
		.select({ label: tagsTable.label })
		.from(tagsTable)
		.where(eq(tagsTable.id, id))
		.limit(1);
	if (tag && featureRegistry.getSystemTagLabels().includes(tag.label ?? '')) {
		return;
	}
	await dbConnection.drizzle.delete(tagsTable).where(eq(tagsTable.id, id));
	// Schema has ON DELETE CASCADE on tags_to_lines.tag_id FK, but
	// PRAGMA foreign_keys may not be ON at runtime. Keep explicit
	// delete as safety net against orphaned join rows.
	await dbConnection.drizzle.delete(tagsToLinesTable).where(eq(tagsToLinesTable.tag_id, id));
});
