/**
 * External dependencies
 */
import { Scalar, QueryResult } from '@op-engineering/op-sqlite';
import { omit } from 'lodash-es';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { dbConnection } from './DBConnection';
import { parseSerialized } from '../../../lib/utilsLight';
import { logError } from '../../../lib/utils';
import { showErrorToast } from '../../../components/ErrorToast/service';
import i18n from '../../../assets/i18n/i18n';

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

/**
 * Wraps an async DB action with try/catch that logs the error and shows a
 * user-facing toast, then rethrows. Use for all drizzle-backed CRUD functions
 * so failures are consistently reported.
 */
export const withDbErrorHandling = <Args extends any[], T>(
	context: string,
	fn: (...args: Args) => Promise<T>
) =>
	async (...args: Args): Promise<T> => {
		try {
			return await fn(...args);
		} catch (error) {
			logError(context, error);
			showErrorToast(
				sprintf(i18n.t('errorGeneric'), (error as Error)?.message ?? String(error))
			);
			throw error;
		}
	};
