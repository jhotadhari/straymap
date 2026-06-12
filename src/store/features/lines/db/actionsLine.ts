import { Feature, LineString, GeoJsonProperties } from 'geojson';
import { eq, and } from 'drizzle-orm';

import { dbZ } from '../../../../db/clients';
import { fetchLinesWithTags } from './fetch';
import { linesTable, tagsTable, tagsToLinesTable } from './schema/schema';

export const createLines = async (
	newLines: {
		title?: string | null;
		lineStringFeature: Feature<LineString, GeoJsonProperties>;
		tagIds?: number[];
	}[]
) => {
	try {
		const insertedLines = await dbZ
			.insert(linesTable)
			.values(
				newLines.map(({ title, lineStringFeature }) => ({
					title: title ?? null,
					geometry: lineStringFeature.geometry,
				}))
			)
			.returning({ id: linesTable.id });

		if (insertedLines.length !== newLines.length) {
			return insertedLines;
		}

		const tagIdsExisting: { [tagId: string]: boolean } = {};

		insertedLines.forEach(({ id }, idx) => {
			if (newLines[idx]?.tagIds) {
				newLines[idx].tagIds.forEach(async (tagId) => {
					if (undefined === tagIdsExisting[tagId]) {
						const tags = await dbZ
							.select()
							.from(tagsTable)
							.where(eq(tagsTable.id, tagId))
							.limit(1);
						tagIdsExisting[tagId] = !!tags.length;
					}

					if (true === tagIdsExisting[tagId]) {
						await dbZ.insert(tagsToLinesTable).values([
							{
								tag_id: tagId,
								line_id: id,
							},
						]);
					}
				});
			}
		});
		return insertedLines;
	} catch (error) {
		console.log('debug error', error); // debug
	}
};

export const updateLine = async (
	id: number,
	newLine: Partial<{
		title: string | null;
		lineStringFeature: Feature<LineString, GeoJsonProperties>;
		tagIds?: number[];
	}>
) => {
	const lines = await dbZ.select().from(linesTable).where(eq(linesTable.id, id)).limit(1);
	if (!lines.length) {
		return;
	}
	await dbZ
		.update(linesTable)
		.set({
			// ...line,
			...(undefined !== newLine?.title && { title: newLine.title }),
			...(undefined !== newLine?.lineStringFeature && {
				geometry: newLine.lineStringFeature.geometry,
			}),
		})
		.where(eq(linesTable.id, id));

	if (!Array.isArray(newLine?.tagIds)) {
		return;
	}

	// get tags fo line.
	const linesWithTags = await fetchLinesWithTags({ lineIds: [id] });
	const currentTagIds = linesWithTags.length ? linesWithTags[0].tags.map((tag) => tag.id) : [];

	newLine.tagIds.forEach(async (tagId) => {
		if (!currentTagIds.includes(tagId)) {
			// create relation
			await dbZ.insert(tagsToLinesTable).values([
				{
					tag_id: tagId,
					line_id: id,
				},
			]);
		}
	});

	currentTagIds.forEach(async (tagId) => {
		if (newLine.tagIds!.includes(tagId)) {
			// delete existing relation
			await dbZ
				.delete(tagsToLinesTable)
				.where(and(eq(tagsToLinesTable.tag_id, tagId), eq(tagsToLinesTable.line_id, id)));
		}
	});
};

export const lineAddTag = async (lineId: number, tagId: number) => {
	const linesWithTags = await fetchLinesWithTags({ lineIds: [lineId], tagId });
	if (!linesWithTags.length) {
		await dbZ.insert(tagsToLinesTable).values([
			{
				tag_id: tagId,
				line_id: lineId,
			},
		]);
	}
};

export const lineRemoveTag = async (lineId: number, tagId: number) => {
	await dbZ
		.delete(tagsToLinesTable)
		.where(and(eq(tagsToLinesTable.tag_id, tagId), eq(tagsToLinesTable.line_id, lineId)));
};

export const deleteLine = async (id: number) => {
	await dbZ.delete(linesTable).where(eq(linesTable.id, id));
	await dbZ.delete(tagsToLinesTable).where(eq(tagsToLinesTable.line_id, id));
};
