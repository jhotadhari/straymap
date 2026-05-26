import { drizzle } from 'drizzle-orm/op-sqlite';
import {
	ANDROID_DATABASE_PATH, // /data/user/0/com.jhotadhari.straymap/databases/
	open,
} from '@op-engineering/op-sqlite';

import schema from './schema';

export const dbOp = open({
	name: 'db',
	location: ANDROID_DATABASE_PATH,
});

const path = 'libspatialite';
dbOp.loadExtension(path, 'sqlite3_modspatialite_init');

export const dbZ = drizzle(dbOp, {
	logger: __DEV__,
	schema,
});
