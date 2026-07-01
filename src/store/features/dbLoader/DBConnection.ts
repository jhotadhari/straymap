/**
 * External dependencies
 */
import { QueryClient } from '@tanstack/react-query';
import { drizzle } from 'drizzle-orm/op-sqlite';
import { migrate } from 'drizzle-orm/op-sqlite/migrator';
import { DB, open } from '@op-engineering/op-sqlite';

/**
 * Internal dependencies
 */
import * as schema from './schema';
import migrations from '../../../../drizzle/migrations';

class DBConnection {
	op?: DB;

	drizzle?: ReturnType<typeof drizzle<typeof schema>>;

	queryClient?: QueryClient;

	/** Whether SpatiaLite registered regexp() — needed for SQL REGEXP operator. */
	regexpAvailable = false;

	constructor() {}

	initialize(dbPath: string) {
		return new Promise<true>((resolve, reject) => {
			this.setDbOp(dbPath);
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

			// SpatiaLite 5+ may bundle RegexpCache which registers regexp().
			// Check availability so callers can fall back to JS-side regex
			// when the SQL REGEXP operator is unavailable.
			this.op!
				.execute(
					"SELECT CASE WHEN REGEXP('t.st', 'test') THEN 1 ELSE 0 END"
				)
				.then(() => {
					this.regexpAvailable = true;
				})
				.catch(() => {
					this.regexpAvailable = false;
				})
				.finally(() => {
					// Migrate database.
					migrate(this.drizzle!, migrations)
						.then(() => {
							resolve(true);
						})
						.catch((error) => {
							reject(error);
						});
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
							const msg =
								error instanceof Error
									? error.message
									: typeof error === 'string'
										? error
										: JSON.stringify(error);
							console.error(
								`DEBUG error query [${query.queryKey.join(', ')}]` +
									`\n  message: ${msg}` +
									`\n  stale: ${query.state.status}`,
								error instanceof Error ? error : undefined
							);
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
