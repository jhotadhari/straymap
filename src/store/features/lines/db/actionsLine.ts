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
import { LinePartial } from '../types';
import { WithRequired } from '@tanstack/react-query';
import { withDbErrorHandling, withDbTransaction, parseReturningIds } from '../../dbLoader/utils';

export const createLines = withDbErrorHandling(
	'lines/actionsLine.createLines',
	async (
		newLines: {
			title?: string | null;
			lineStringFeature: Feature<LineString, GeoJsonProperties>;
			tagIds?: number[];
		}[]
	) => {
		if (!dbConnection?.drizzle) {
			return;
		}

		// Pre-flight: check which tag IDs exist (outside transaction, so these
		// SELECTs can use drizzle's typed query builder).
		const allTagIds = [...new Set(newLines.flatMap((l) => l.tagIds ?? []))];
		const tagIdsExisting: Record<number, boolean> = {};
		for (const tagId of allTagIds) {
			const tags = await dbConnection.drizzle
				.select()
				.from(tagsTable)
				.where(eq(tagsTable.id, tagId))
				.limit(1);
			tagIdsExisting[tagId] = !!tags.length;
		}

		return withDbTransaction(async (exec) => {
			const insertResult = await exec(
				dbConnection
					.drizzle!.insert(linesTable)
					.values(
						newLines.map(({ title, lineStringFeature }) => ({
							title: title ?? null,
							geometry: lineStringFeature.geometry,
						}))
					)
					.returning({ id: linesTable.id })
			);
			const insertedLines = parseReturningIds(insertResult);

			if (insertedLines.length !== newLines.length) {
				return insertedLines;
			}

			for (let idx = 0; idx < insertedLines.length; idx++) {
				const { id } = insertedLines[idx];
				const tagIds = newLines[idx]?.tagIds;
				if (!tagIds) {
					continue;
				}
				for (const tagId of tagIds) {
					if (tagIdsExisting[tagId]) {
						await exec(
							dbConnection.drizzle!.insert(tagsToLinesTable).values([
								{
									tag_id: tagId,
									line_id: id,
								},
							])
						);
					}
				}
			}

			return insertedLines;
		});
	}
);

export const updateLine = withDbErrorHandling(
	'lines/actionsLine.updateLine',
	async (
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

		// Pre-flight SELECTs outside transaction (use drizzle's typed query
		// builder for these complex queries).
		const lines = await dbConnection.drizzle
			.select()
			.from(linesTable)
			.where(eq(linesTable.id, id))
			.limit(1);
		if (!lines.length) {
			return;
		}

		const hasTagUpdate = Array.isArray(newLine?.tagIds);
		let currentTagIds: number[] = [];
		if (hasTagUpdate) {
			const linesWithTags = (await fetchLines({
				lineIds: [id],
				allLines: false,
				limit: 1,
				fieldsInclude: ['tags'],
			})) as WithRequired<LinePartial, 'tags'>[];
			currentTagIds = linesWithTags.length
				? linesWithTags[0].tags.map((tag) => tag.id)
				: [];
		}

		// Writes in transaction: UPDATE the line row, then add/remove tag
		// relations atomically.
		await withDbTransaction(async (exec) => {
			await exec(
				dbConnection
					.drizzle!.update(linesTable)
					.set({
						...(undefined !== newLine?.title && { title: newLine.title }),
						...(undefined !== newLine?.lineStringFeature && {
							geometry: newLine.lineStringFeature.geometry,
						}),
					})
					.where(eq(linesTable.id, id))
			);

			if (!hasTagUpdate) {
				return;
			}

			// INSERT relations for newly requested tags.
			for (const tagId of newLine.tagIds!) {
				if (!currentTagIds.includes(tagId)) {
					await exec(
						dbConnection.drizzle!.insert(tagsToLinesTable).values([
							{
								tag_id: tagId,
								line_id: id,
							},
						])
					);
				}
			}

			// DELETE relations for tags no longer in the list.
			for (const tagId of currentTagIds) {
				if (!newLine.tagIds!.includes(tagId)) {
					await exec(
						dbConnection
							.drizzle!.delete(tagsToLinesTable)
							.where(
								and(
									eq(tagsToLinesTable.tag_id, tagId),
									eq(tagsToLinesTable.line_id, id)
								)
							)
					);
				}
			}
		});
	}
);

export const lineAddTag = withDbErrorHandling(
	'lines/actionsLine.lineAddTag',
	async (lineId: number, tagId: number) => {
		if (!dbConnection?.drizzle) {
			return;
		}
		// Check if line has this tag already
		const linesWithTags = (await fetchLines({
			lineIds: [lineId],
			allLines: false,
			limit: 1,
			fieldsInclude: ['tags'],
		})) as WithRequired<LinePartial, 'tags'>[];
		const alreadyHasTag = linesWithTags.length
			? linesWithTags[0].tags.some((tag) => tag.id === tagId)
			: false;
		if (alreadyHasTag) {
			return;
		}
		await dbConnection.drizzle.insert(tagsToLinesTable).values([
			{
				tag_id: tagId,
				line_id: lineId,
			},
		]);
	}
);

export const lineRemoveTag = withDbErrorHandling(
	'lines/actionsLine.lineRemoveTag',
	async (lineId: number, tagId: number) => {
		dbConnection?.drizzle &&
			(await dbConnection.drizzle
				.delete(tagsToLinesTable)
				.where(
					and(eq(tagsToLinesTable.tag_id, tagId), eq(tagsToLinesTable.line_id, lineId))
				));
	}
);

export const deleteLine = withDbErrorHandling(
	'lines/actionsLine.deleteLine',
	async (id?: number | false) => {
		if (id && dbConnection?.drizzle) {
			await dbConnection.drizzle.delete(linesTable).where(eq(linesTable.id, id));
		}
	}
);

export const deleteLines = withDbErrorHandling(
	'lines/actionsLine.deleteLines',
	async (ids?: number[]) => {
		if (!ids || !dbConnection?.drizzle) {
			return;
		}

		await dbConnection.drizzle
			.delete(linesTable)
			.where(or(...ids.map((id) => eq(linesTable.id, id))));
	}
);
