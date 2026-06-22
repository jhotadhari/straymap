/**
 * Internal dependencies
 */
import { setAppDirs, setInitialized } from './slice';
import { HelperModule } from '../../../nativeModules';
import { AbsPathsMap } from './types';
import { selectInitialized } from './selectors';
import { AppStore } from '../../store';

// const settingsKey = 'dirsSettings';

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 */
export const initializeFromStorage = (store: AppStore) => {
	if (selectInitialized(store.getState())) {
		return;
	}
	Promise.all([
		// new Promise( ( resolve: ( value: boolean ) => void ) => {
		// 	DefaultPreference.get( settingsKey ).then( newSettingsStr => {
		// 		// if ( newSettingsStr ) {
		// 		// 	const newSettings = JSON.parse( newSettingsStr ) as Partial<DirsState>;
		// 		// 	if ( newSettings?.something ) {
		// 		// 		store.dispatch( setSomething( newSettings.something ) );
		// 		// 	}
		// 		// }
		// 		resolve( true );
		// 	} ).catch( ( err: any ) => {
		// 		console.log( 'ERROR', err );
		// 		resolve( false );
		// 	} );
		// } ),
		new Promise((resolve: (value: boolean) => void) => {
			HelperModule.getAppDirs()
				.then((dirs) => {

					console.log( 'debug dirs', dirs ); // debug

					store.dispatch(setAppDirs(dirs as AbsPathsMap));
					resolve(true);
				})
				.catch((err: any) => {
					console.log('ERROR', err);
					resolve(false);
				});
		}),
	])
		.then((results: boolean[]) => {
			if (results.every((result) => !!result)) {
				store.dispatch(setInitialized(true));
			}
		})
		.catch((err: any) => console.log(err));
};
