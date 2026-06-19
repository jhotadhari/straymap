/**
 * External dependencies
 */
import { Scalar, QueryResult } from '@op-engineering/op-sqlite';
import { omit } from 'lodash-es';

/**
 * Internal dependencies
 */
import { dbConnection } from './DBConnection';
import { parseSerialized } from '../../../lib/utilsLight';

export const dbOpExecute = (query: string, params?: Scalar[]): Promise<QueryResult> => {
	return new Promise(async (resolve, reject) => {
		if (dbConnection?.op) {
			dbConnection.op.transaction(async (tx) => {
				try {
					const res = await tx.execute(query, params);
					resolve(res);
					await tx.commit();
				} catch (error) {
					reject(error);
					tx.rollback();
				}
			});
		} else {
			reject('ERROR dbOp is undefined');
		}
	});
};

export const rowParseGeometryGeoJSON = <T, G>(row: T & { geometryGeoJSON: string }) => {
	return {
		...omit(row, 'geometryGeoJSON'),
		geometry: parseSerialized<G>(row.geometryGeoJSON)!,
	} as Omit<T, 'geometryGeoJSON'> & { geometry: G };
};

export const rowsParseGeometryGeoJSON = <T, G>(rows: (T & { geometryGeoJSON: string })[]) => {
	return rows.map((row) => rowParseGeometryGeoJSON<T, G>(row));
};

export const rowParseEnvelopeGeoJSON = <T, G>(row: T & { envelopeGeoJSON: string }) => {
	return {
		...omit(row, 'envelopeGeoJSON'),
		envelope: parseSerialized<G>(row.envelopeGeoJSON)!,
	} as Omit<T, 'envelopeGeoJSON'> & { envelope: G };
};

export const rowsParseEnvelopeGeoJSON = <T, G>(rows: (T & { envelopeGeoJSON: string })[]) => {
	return rows.map((row) => rowParseEnvelopeGeoJSON<T, G>(row));
};
