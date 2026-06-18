/**
 * External dependencies
 */
import { LineString } from 'geojson';
import { sql, eq, and, inArray, desc } from 'drizzle-orm';
import { difference, includes, intersection, mapValues, omit, pick } from 'lodash-es';
import { WithRequired } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { dbZ } from '../../../../db/clients';
import { linesTable, tagsTable, tagsToLinesTable } from './schema/schema';
import { rowsParseGeometryGeoJSON } from '../../../../db/utils';
import { ArrayElement } from '../../../../types';
import { Line, LinePartial, STATS_FIELDS, Tag } from '../types';

/**
 * Functions to fetch/retrieve data from database.
 * They are actually db selectors or drizzle queries. But to avoid naming collisions, let's call/prefix them "fetch".
 *
 */
/**
 */

interface FetchLinesWithoutTagsParams {
	lineIds?: number[];
	limit?: number;
	fieldsInclude?: (keyof Omit<Line, 'id' | 'tags'>)[];
	fieldsExclude?: (keyof Omit<Line, 'id'>)[];
	simplify?: number;
}

interface FetchLinesWithTagsParams {
	lineIds?: number[];
	limit?: number;
	allLines?: boolean; // defaults to true
	tagId?: number;
	allTags?: boolean;
	fieldsInclude?: (keyof Omit<Line, 'id'>)[];
	fieldsExclude?: (keyof Omit<Line, 'id'>)[];
	simplify?: number;
}

export interface FetchLinesParams extends FetchLinesWithTagsParams {}

const statsFields = [...STATS_FIELDS] as string[];

interface LineColumnsOptions {
	simplify?: number;
}

const getLineColumns = (fields: (keyof Omit<Line, 'id'>)[], options?: LineColumnsOptions) => {
	return {
		id: linesTable.id,
		...(fields.includes('title') && { title: linesTable.title }),
		...(fields.includes('timestamp') && { timestamp: linesTable.timestamp }),
		...(fields.includes('geometry') &&
			!options?.simplify && {
				geometryGeoJSON: sql<string>` AsGeoJSON (${linesTable.geometry}) `,
			}),
		...(fields.includes('geometry') &&
			options?.simplify && {
				geometryGeoJSON: sql<string>`
					AsGeoJSON (
						Simplify (
							${linesTable.geometry},
							${options.simplify}
						)
					)
				`,
			}),
		...(fields.includes('stats') && {
			length: sql<string>`GreatCircleLength (${linesTable.geometry})`,
		}),
		...(fields.includes('stats') && {
			uphill: sql<string>`UphillHeight (${linesTable.geometry})`,
		}),
		...(fields.includes('stats') && {
			downhill: sql<string>`DownhillHeight (${linesTable.geometry})`,
		}),
		...(fields.includes('stats') && {
			minZ: sql<string>`ST_MinZ (${linesTable.geometry})`,
		}),
		...(fields.includes('stats') && {
			maxZ: sql<string>`ST_MaxZ (${linesTable.geometry})`,
		}),
	};
};

const fetchLinesWithoutTags = (params?: FetchLinesWithoutTagsParams) => {
	const {
		lineIds, //
		limit,
		fieldsInclude,
		fieldsExclude,
		simplify,
	} = params ?? {};

	let fields: (keyof Omit<Line, 'id'>)[] = [
		'title',
		'geometry',
		'timestamp',
		'stats',
	];
	if (fieldsInclude) {
		fields = intersection(fields, fieldsInclude);
	}
	if (fieldsExclude) {
		fields = difference(fields, fieldsExclude);
	}

	return new Promise<LinePartial[]>((resolve, reject) => {
		const query = dbZ.select(getLineColumns(fields, { simplify })).from(linesTable);

		query.where(and(lineIds ? inArray(linesTable.id, lineIds) : undefined));

		query.orderBy(desc(linesTable.timestamp));

		if (limit) {
			query.limit(limit);
		} else if (lineIds) {
			query.limit(lineIds.length);
		} else {
			query.all();
		}

		query
			.then((rows) => {
				let aggregated = rows;
				if (fields.includes('geometry')) {
					const aggregatedWithGeo = aggregated as WithRequired<
						ArrayElement<typeof aggregated>,
						'geometryGeoJSON'
					>[];
					aggregated = rowsParseGeometryGeoJSON<
						ArrayElement<typeof aggregatedWithGeo>,
						LineString
					>(aggregatedWithGeo);
				}
				resolve(aggregated);
			})
			.catch((err) => {
				reject(err);
			});
	});
};

const fetchLinesWithTags = (params?: FetchLinesWithTagsParams) => {
	const {
		lineIds, //
		allLines,
		tagId,
		allTags,
		limit,
		fieldsInclude,
		fieldsExclude,
		simplify,
	} = {
		allLines: true,
		...(params ?? {}),
	};

	let fields: (keyof Omit<Line, 'id'>)[] = [
		'title',
		'geometry',
		'timestamp',
		'tags',
		'stats',
	];
	if (fieldsInclude) {
		fields = intersection(fields, fieldsInclude);
	}
	if (fieldsExclude) {
		fields = difference(fields, fieldsExclude);
	}

	if (!(fields as string[]).includes('tags')) {
		return fetchLinesWithoutTags(params as FetchLinesWithoutTagsParams);
	}

	return new Promise<LinePartial[]>((resolve, reject) => {
		const query = dbZ
			.select({
				line: getLineColumns(fields, { simplify }),
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

		query.orderBy(desc(linesTable.timestamp));

		if (limit) {
			query.limit(limit);
		} else if (allLines && lineIds) {
			query.limit(lineIds.length);
		} else {
			query.all();
		}

		query
			.then(
				(
					rows: {
						line: {
							id: number;
							title?: string | null;
							timestamp?: string;
							geometryGeoJSON?: string;
							length?: string;
							uphill?: string;
							downhill?: string;
							minZ?: string;
							maxZ?: string;
						};
						tag: Tag;
					}[]
				) => {
					let aggregated = Array.from(
						rows
							.reduce<
								Map<
									number, // line.id
									Partial<
										Omit<Line, 'geometry'> & { geometryGeoJSON: string }
									> & {
										id: number;
										tags: Tag[];
									}
								>
							>((acc, row) => {
								if (row?.line?.id && !acc.has(row.line.id)) {
									acc.set(row.line.id, {
										id: row.line.id,
										...omit(row.line, statsFields),
										...(fields.includes('stats') && {
											stats: mapValues(
												pick(row.line, statsFields),
												(str: string) => parseFloat(str)
											),
										}),
										tags: [],
									});
								}
								if (row?.tag && row?.line?.id) {
									acc.get(row.line.id)!.tags.push(row.tag);
								}
								return acc;
							}, new Map())
							.values()
					);

					if (fields.includes('geometry')) {
						const aggregatedWithGeo = aggregated as WithRequired<
							ArrayElement<typeof aggregated>,
							'geometryGeoJSON'
						>[];
						aggregated = rowsParseGeometryGeoJSON<
							ArrayElement<typeof aggregatedWithGeo>,
							LineString
						>(aggregatedWithGeo);
					}
					resolve(aggregated);
				}
			)
			.catch((err) => {
				reject(err);
			});
	});
};

export { fetchLinesWithTags as fetchLines };
