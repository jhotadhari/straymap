import { Scalar, QueryResult } from '@op-engineering/op-sqlite';
import { Feature, LineString, GeoJsonProperties, Point } from 'geojson';
import { lineString } from '@turf/helpers';
import { gt, isNotNull, sql, eq, and } from 'drizzle-orm';

import { dbOp, dbZ } from '../../../../db/client';
import { linesTable, tagsTable, tagsToLinesTable } from './schema/schema';

export const getLinesWithTags = (params?: {
    lineId?: number;
    allLines?: boolean;
    tagId?: number;
    allTags?: boolean;
}) => {
    const { lineId, allLines, tagId, allTags } = params ?? {};

    return new Promise<
        {
            id: number;
            title: string | null;
            geometryGeoJSON: string;
            tags: {
                id: number;
                label: string | null;
                notes: string | null;
                params: any;	// ??? any
            }[];
        }[]
    >((resolve) => {
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

        query
            .where(
                and(
                    lineId ? eq(linesTable.id, lineId) : undefined,
                    tagId ? eq(tagsTable.id, tagId) : undefined
                )
            )
			.all()	/// ??? add limit.
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
                                    params: any;	// ??? any
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

                resolve(aggregated);
            });
    });
};
