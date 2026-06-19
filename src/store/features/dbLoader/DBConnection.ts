/**
 * External dependencies
 */
import { QueryClient } from '@tanstack/react-query';
import { drizzle } from 'drizzle-orm/op-sqlite';
import { DB, open } from '@op-engineering/op-sqlite';

/**
 * Internal dependencies
 */
import * as schema from './schema';
import { AppStore } from '../../store';
import { migrate } from 'drizzle-orm/op-sqlite/migrator';
import migrations from '../../../../drizzle/migrations';
import { setDbMigrated } from './slice';

class DBConnection {
	op?: DB;

	drizzle?: ReturnType<typeof drizzle<typeof schema>>;

	queryClient?: QueryClient;

	constructor() {}

	initialize(dbPath: string) {
		return new Promise<true>((resolve, reject) => {
			this.setDbOp(dbPath);
			console.log('debug dbPath', dbPath); // debug
			this.setQueryClient();
			this.setDbZ()
				.then((result) => resolve(result))
				.catch((error) => {
					reject(error);
				});
		});
	}

	setDbOp(dbPath: string) {
		const dbPathParts = dbPath.split('/');
		const conf = {
			location:
				dbPathParts.length > 1
					? dbPathParts.slice(0, dbPathParts.length - 1).join('/') + '/'
					: undefined,
			name: dbPathParts.length > 1 ? dbPathParts[dbPathParts.length - 1] : dbPathParts[0],
		};
		this.op = open(conf);
		this.op.loadExtension('libspatialite', 'sqlite3_modspatialite_init');
	}

	setDbZ() {
		return new Promise<true>((resolve, reject) => {
			this.drizzle = drizzle(this.op, {
				logger: shouldLog.drizzle,
				schema,
			});
			// Migrate database.
			migrate(this.drizzle, migrations)
				.then(() => {
					resolve(true);
				})
				.catch((error) => {
					reject(error);
				});
		});
	}

	setQueryClient() {
		if (this?.queryClient) {
			this.queryClient.cancelQueries();
		}
		this.queryClient = new QueryClient({
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
	}
}

const dbConnection = new DBConnection();

export { dbConnection };
