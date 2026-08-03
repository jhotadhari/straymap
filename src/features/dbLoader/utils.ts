/**
 * External dependencies
 */
import { Scalar, QueryResult } from '@op-engineering/op-sqlite';
import { omit } from 'lodash-es';
import { sprintf } from 'sprintf-js';
import dayjs from '../../lib/dayjs';

/**
 * Internal dependencies
 */
import { dbConnection } from './DBConnection';
import { parseSerialized } from '../../lib/utilsLight';
import { logError } from '../../lib/utils';
import { showErrorToast } from '../../components/ErrorToast/service';
import i18n from '../../assets/i18n/i18n';

export const dbOpExecute = (query: string, params?: Scalar[]): Promise<QueryResult> => {
	return withDbTransaction((exec) =>
		exec({ toSQL: () => ({ sql: query, params: params ?? [] }) })
	);
};

export const rowParseGeometryGeoJSON = <T, G>(row: T & { geometryGeoJSON: string }) => {
	const geometry = parseSerialized<G>(row.geometryGeoJSON);
	if (!geometry) {
		throw new Error(
			`Failed to parse geometry GeoJSON: ${row.geometryGeoJSON?.substring(0, 100)}`
		);
	}
	return {
		...omit(row, 'geometryGeoJSON'),
		geometry,
	} as Omit<T, 'geometryGeoJSON'> & { geometry: G };
};

export const rowsParseGeometryGeoJSON = <T, G>(rows: (T & { geometryGeoJSON: string })[]) => {
	return rows.map((row) => rowParseGeometryGeoJSON<T, G>(row));
};

export const rowParseEnvelopeGeoJSON = <T, G>(row: T & { envelopeGeoJSON: string }) => {
	const envelope = parseSerialized<G>(row.envelopeGeoJSON);
	if (!envelope) {
		throw new Error(
			`Failed to parse envelope GeoJSON: ${row.envelopeGeoJSON?.substring(0, 100)}`
		);
	}
	return {
		...omit(row, 'envelopeGeoJSON'),
		envelope,
	} as Omit<T, 'envelopeGeoJSON'> & { envelope: G };
};

export const rowsParseEnvelopeGeoJSON = <T, G>(rows: (T & { envelopeGeoJSON: string })[]) => {
	return rows.map((row) => rowParseEnvelopeGeoJSON<T, G>(row));
};

type DrizzleQuery = { toSQL: () => { sql: string; params: unknown[] } };
type ExecFn = (query: DrizzleQuery) => Promise<QueryResult>;

/**
 * Thin wrapper around op-sqlite's native transaction API (which is genuinely
 * async), replacing drizzle-orm's broken `transaction()` method (see
 * drizzle-orm#2275).  Pass drizzle queries (anything with `.toSQL()`) to the
 * `exec` callback and they will run inside the same transaction.
 */
export const withDbTransaction = async <T>(callback: (exec: ExecFn) => Promise<T>): Promise<T> => {
	return new Promise((resolve, reject) => {
		if (!dbConnection?.op) {
			reject(new Error('dbConnection.op is undefined'));
			return;
		}
		dbConnection.op.transaction(async (tx) => {
			try {
				const result = await callback(async (query) => {
					const { sql, params } = query.toSQL();
					return tx.execute(sql, params as Scalar[]);
				});
				resolve(result);
			} catch (error) {
				reject(error);
			}
		});
	});
};

/**
 * Parse the rows returned by tx.execute() for an INSERT ... RETURNING query
 * into { id: number }[] shape.  op-sqlite returns rows as Record<string, Scalar>
 * so we can address the column by name rather than position.
 */
export const parseReturningIds = (result: QueryResult): { id: number }[] => {
	return (result.rows ?? []).map((row) => ({ id: row.id as number }));
};

/**
 * Wraps an async DB action with try/catch that logs the error and shows a
 * user-facing toast, then rethrows. Use for all drizzle-backed CRUD functions
 * so failures are consistently reported.
 */
export const withDbErrorHandling =
	<Args extends any[], T>(context: string, fn: (...args: Args) => Promise<T>) =>
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

export const getDbDefaultName = () => dayjs().format('YYYYMMDDHHmmss');
