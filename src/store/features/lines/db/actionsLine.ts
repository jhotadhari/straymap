/**
 * External dependencies
 */
import { Feature, LineString, GeoJsonProperties } from 'geojson';
import { eq, and, or } from 'drizzle-orm';

/**
 * Internal dependencies
 */
import { dbConnection } from '../../dbLoader/DBConnection';
import { fetchLines } from './fetch';
import { linesTable, tagsTable, tagsToLinesTable } from './schema/schema';
import { Line, LinePartial } from '../types';
import { WithRequired } from '@tanstack/react-query';

export const createLines = async (
	newLines: {
		title?: string | null;
		lineStringFeature: Feature<LineString, GeoJsonProperties>;
		tagIds?: number[];
	}[]
) => {
	if (!dbConnection?.drizzle) {
		return;
	}
	try {
		const insertedLines = await dbConnection.drizzle
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
					if (undefined === tagIdsExisting[tagId] && dbConnection?.drizzle) {
						const tags = await dbConnection.drizzle
							.select()
							.from(tagsTable)
							.where(eq(tagsTable.id, tagId))
							.limit(1);
						tagIdsExisting[tagId] = !!tags.length;
					}

					if (true === tagIdsExisting[tagId] && dbConnection?.drizzle) {
						await dbConnection.drizzle.insert(tagsToLinesTable).values([
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
	id: number | undefined,
	newLine: Partial<{
		title: string | null;
		lineStringFeature: Feature<LineString, GeoJsonProperties>;
		tagIds?: number[];
	}>
) => {
	if (!id || !dbConnection?.drizzle) {
		return;
	}
	const lines = await dbConnection.drizzle
		.select()
		.from(linesTable)
		.where(eq(linesTable.id, id))
		.limit(1);
	if (!lines.length) {
		return;
	}
	await dbConnection.drizzle
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
	const linesWithTags = (await fetchLines({
		lineIds: [id],
		allLines: false,
		limit: 1,
		fieldsInclude: ['tags'],
	})) as WithRequired<LinePartial, 'tags'>[];
	const currentTagIds = linesWithTags.length ? linesWithTags[0].tags.map((tag) => tag.id) : [];

	newLine.tagIds.forEach(async (tagId) => {
		if (!currentTagIds.includes(tagId) && dbConnection?.drizzle) {
			// create relation
			await dbConnection.drizzle.insert(tagsToLinesTable).values([
				{
					tag_id: tagId,
					line_id: id,
				},
			]);
		}
	});

	currentTagIds.forEach(async (tagId) => {
		if (newLine.tagIds!.includes(tagId) && dbConnection?.drizzle) {
			// delete existing relation
			await dbConnection.drizzle
				.delete(tagsToLinesTable)
				.where(and(eq(tagsToLinesTable.tag_id, tagId), eq(tagsToLinesTable.line_id, id)));
		}
	});
};

export const lineAddTag = async (lineId: number, tagId: number) => {
	// Check if line has tag already
	if (
		!dbConnection?.drizzle ||
		(
			(await fetchLines({
				lineIds: [lineId],
				allLines: false,
				limit: 1,
				fieldsInclude: ['tags'],
			})) as WithRequired<LinePartial, 'tags'>[]
		).length
	) {
		return;
	}
	await dbConnection.drizzle.insert(tagsToLinesTable).values([
		{
			tag_id: tagId,
			line_id: lineId,
		},
	]);
};

export const lineRemoveTag = async (lineId: number, tagId: number) => {
	dbConnection?.drizzle &&
		(await dbConnection.drizzle
			.delete(tagsToLinesTable)
			.where(and(eq(tagsToLinesTable.tag_id, tagId), eq(tagsToLinesTable.line_id, lineId))));
};

export const deleteLine = async (id?: number | false) => {
	if (id && dbConnection?.drizzle) {
		await dbConnection.drizzle.delete(linesTable).where(eq(linesTable.id, id));

		// ??? do that with schema
		// await clients.dbZ.delete(tagsToLinesTable).where(eq(tagsToLinesTable.line_id, id));
	}
};

export const deleteLines = async (ids?: number[]) => {
	if (!ids || !dbConnection?.drizzle) {
		return;
	}

	await dbConnection.drizzle
		.delete(linesTable)
		.where(or(...ids.map((id) => eq(linesTable.id, id))));

	// ??? do that with schema
	// await clients.dbZ.delete(tagsToLinesTable).where(or(
	// 	...ids.map((id) => eq(tagsToLinesTable.line_id, id) )
	// ));
};
