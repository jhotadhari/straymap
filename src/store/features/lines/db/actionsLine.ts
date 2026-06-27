/**
 * External dependencies
 */
import { Feature, LineString, GeoJsonProperties } from 'geojson';
import { eq, and, or, inArray } from 'drizzle-orm';

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

		// Pre-flight: check which tag IDs exist (outside transaction, so
		// these SELECTs can use drizzle's typed query builder).  Batch
		// into a single WHERE id IN (...) query instead of N sequential
		// round-trips.
		const allTagIds = [...new Set(newLines.flatMap((l) => l.tagIds ?? []))];
		const tagIdsExisting: Record<number, boolean> = {};
		if (allTagIds.length > 0) {
			const existingTags = await dbConnection.drizzle
				.select({ id: tagsTable.id })
				.from(tagsTable)
				.where(inArray(tagsTable.id, allTagIds));
			for (const { id } of existingTags) {
				tagIdsExisting[id] = true;
			}
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

			// Collect all tag relations across all new lines, then
			// INSERT them in a single multi-row statement.
			const tagRelationValues: { tag_id: number; line_id: number }[] = [];
			for (let idx = 0; idx < insertedLines.length; idx++) {
				const { id } = insertedLines[idx];
				const tagIds = newLines[idx]?.tagIds;
				if (!tagIds) {
					continue;
				}
				for (const tagId of tagIds) {
					if (tagIdsExisting[tagId]) {
						tagRelationValues.push({ tag_id: tagId, line_id: id });
					}
				}
			}
			if (tagRelationValues.length > 0) {
				await exec(
					dbConnection.drizzle!.insert(tagsToLinesTable).values(tagRelationValues)
				);
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
			// Lightweight query: only fetch tag IDs for this line
			// instead of the full fetchLines (joins + GeoJSON parse).
			const tagRows = await dbConnection.drizzle
				.select({ tag_id: tagsToLinesTable.tag_id })
				.from(tagsToLinesTable)
				.where(eq(tagsToLinesTable.line_id, id));
			currentTagIds = tagRows.map((r) => r.tag_id);
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

			// Batch INSERT relations for newly requested tags.
			const tagIdsToAdd = newLine.tagIds!.filter((tagId) => !currentTagIds.includes(tagId));
			if (tagIdsToAdd.length > 0) {
				await exec(
					dbConnection.drizzle!.insert(tagsToLinesTable).values(
						tagIdsToAdd.map((tagId) => ({
							tag_id: tagId,
							line_id: id,
						}))
					)
				);
			}

			// Batch DELETE relations for tags no longer in the list.
			const tagIdsToRemove = currentTagIds.filter(
				(tagId) => !newLine.tagIds!.includes(tagId)
			);
			if (tagIdsToRemove.length > 0) {
				await exec(
					dbConnection
						.drizzle!.delete(tagsToLinesTable)
						.where(
							and(
								inArray(tagsToLinesTable.tag_id, tagIdsToRemove),
								eq(tagsToLinesTable.line_id, id)
							)
						)
				);
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
		if (!dbConnection?.drizzle) {
			return;
		}
		await dbConnection.drizzle
			.delete(tagsToLinesTable)
			.where(and(eq(tagsToLinesTable.tag_id, tagId), eq(tagsToLinesTable.line_id, lineId)));
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
