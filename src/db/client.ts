/**
 * External dependencies
 */
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
