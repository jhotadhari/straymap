import { Scalar, QueryResult } from '@op-engineering/op-sqlite';

import { dbOp } from './client';

export const dbOpExecute = (query: string, params?: Scalar[]): Promise<QueryResult> => {
	return new Promise(async (resolve, reject) => {
		dbOp.transaction(async (tx) => {
			try {
				const res = await tx.execute(query, params);
				resolve(res);
				await tx.commit();
			} catch (error) {
				reject(error);
				tx.rollback();
			}
		});
	});
};

export const dbOpLongLatToDMS = async (lngLat: number[]) => {
	const res = await dbOpExecute('SELECT LongLatToDMS( ?, ? )', lngLat.slice(0, 2));
	return Object.values(res.rows[0])[0];
};
