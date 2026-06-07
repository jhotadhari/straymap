/**
 * External dependencies
 */
import { LineString } from 'geojson';
import { sql, eq, and, inArray } from 'drizzle-orm';

/**
 * Internal dependencies
 */
import { dbZ } from '../../../../db/client';
import { linesTable, tagsTable, tagsToLinesTable } from './schema/schema';
import { rowsParseGeometryGeoJSON } from '../../../../db/utils';
import { ArrayElement } from '../../../../types';

/**
 * Functions to fetch/retrieve data from database.
 * They are actually db selectors or drizzle queries. But to avoid naming collisions, let's call/prefix them "fetch".
 *
 */
/**
 */

interface LinesWithTagsParams {
	lineIds?: number[];
	allLines?: boolean;
	tagId?: number;
	allTags?: boolean;
}

export const fetchLinesWithTagsQuery = (params?: LinesWithTagsParams) => {
	const { lineIds, allLines, tagId, allTags } = params ?? {};

	const query = dbZ
		.select({
			line: {
				id: linesTable.id,
				title: linesTable.title,
				geometryGeoJSON: sql<string>`AsGeoJSON (${linesTable.geometry})`,
			},
			tag: {
				id: tagsTable.id,
				label: tagsTable.label,
				notes: tagsTable.notes,
				params: tagsTable.params,
			},
		})
		.from(tagsToLinesTable);

	if (allLines) {
		query.rightJoin(linesTable, eq(tagsToLinesTable.line_id, linesTable.id));
	} else {
		query.leftJoin(linesTable, eq(tagsToLinesTable.line_id, linesTable.id));
	}
	if (allTags) {
		query.rightJoin(tagsTable, eq(tagsToLinesTable.tag_id, tagsTable.id));
	} else {
		query.leftJoin(tagsTable, eq(tagsToLinesTable.tag_id, tagsTable.id));
	}

	query.where(
		and(
			lineIds ? inArray(linesTable.id, lineIds) : undefined,
			tagId ? eq(tagsTable.id, tagId) : undefined
		)
	);

	return query;
};

export const fetchLinesWithTags = (params?: LinesWithTagsParams) => {
	const { lineIds, allLines, tagId, allTags } = params ?? {};

	return new Promise<
		{
			id: number;
			title: string | null;
			// geometryGeoJSON: string;
			geometry: LineString;
			tags: {
				id: number;
				label: string | null;
				notes: string | null;
				params: any; // ??? any
			}[];
		}[]
	>((resolve) => {
		const query = fetchLinesWithTagsQuery(params);

		query
			.all() /// ??? add limit.
			.then((rows) => {
				const aggregated = Object.values(
					rows.reduce<
						Record<
							number,
							{
								id: number;
								title: string | null;
								geometryGeoJSON: string;
								tags: {
									id: number;
									label: string | null;
									notes: string | null;
									params: any; // ??? any
								}[];
							}
						>
					>((acc, row) => {
						if (row?.line?.id && !acc[row.line.id]) {
							acc[row.line.id] = { ...row.line, tags: [] };
						}
						if (row?.tag && row?.line?.id) {
							acc[row.line.id].tags.push(row.tag);
						}
						return acc;
					}, {})
				);

				resolve(
					rowsParseGeometryGeoJSON<ArrayElement<typeof aggregated>, LineString>(
						aggregated
					)
				);
			});
	});
};
