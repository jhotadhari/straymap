/**
 * External dependencies
 */
import { QueryClient } from '@tanstack/react-query';
import { drizzle } from 'drizzle-orm/op-sqlite';
import {
	ANDROID_DATABASE_PATH, // /data/user/0/com.jhotadhari.straymap/databases/
	open,
} from '@op-engineering/op-sqlite';

/**
 * Internal dependencies
 */
import * as schema from './schema';

export const dbOp = open({
	name: 'db',
	location: ANDROID_DATABASE_PATH,
});

// source https://github.com/tigawanna/react-native-spatialite-artifacts/releases/tag/v0.0.1
const path = 'libspatialite';
dbOp.loadExtension(path, 'sqlite3_modspatialite_init');

export const dbZ = drizzle(dbOp, {
	logger: shouldLog.drizzle,
	schema,
});

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: Infinity, // Never trigger a refetch until the Query is invalidated manually.
			gcTime: 0, // The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration.
			networkMode: 'always', // We don't care for network, we fetch from a local db.
			throwOnError: (error, query) => {
				if (__DEV__) {
					console.error('DEBUG error query ', { error, query }); // debug
				}
				return false;
			},
		},
	},
});