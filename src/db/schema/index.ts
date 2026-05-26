import { SQLiteTableWithColumns, TableConfig } from 'drizzle-orm/sqlite-core';
import { get, mapValues, merge, omitBy } from 'lodash-es';

import features from '../../store/features';

import * as schemaBase from './schemaBase';
import * as schemaRouting from '../../store/features/routing/schema/schema';
// import routing from '../../store/features/routing/';

const schema = {
	...schemaBase,
	...schemaRouting,
	// ...routing.schema,
};

// Object.fromEntries( [

// ] );

// const schemaaaa = {
// 	// ...schemaBase,

// 	...mapValues(
// 		omitBy(features, (feature) => !!feature?.schema),
// 		// (feature) => Object.values(feature.schema!)
// 		(feature) => feature.schema!
// 	),
// };

// const lllll = Object.values(schemaaaa)

// const schema = merge(schemaBase,schemaRouting);

// console.log( 'debug schema', schema ); // debug

// Object.keys(features).forEach(
// 	(featureKey) => {
// 		if (features[featureKey]?.schema) {
// 			Object.keys(features[featureKey]?.schema).forEach((table) => {
// 				schema[table] = get(features, [
// 					featureKey,
// 					'schema',
// 					table,
// 				])!;
// 			});
// 		}
// 		// return acc;
// 	},
// 	// { ...schemaBase } as { [table: string]: SQLiteTableWithColumns<any> }
// );
// Object.keys(features).reduce(
// 	(acc, featureKey) => {
// 		if (features[featureKey]?.schema) {
// 			Object.keys(features[featureKey]?.schema).forEach((table) => {
// 				acc[table] = get(features, [
// 					featureKey,
// 					'schema',
// 					table,
// 				])!;
// 			});
// 		}
// 		return acc;
// 	},
// 	{ ...schemaBase } as { [table: string]: SQLiteTableWithColumns<any> }
// );

export default schema;
// export default {...schemaBase};
