/**
 * External dependencies
 */
import { type EnhancedStore } from '@reduxjs/toolkit';
// import DefaultPreference from 'react-native-default-preference';

/**
 * Internal dependencies
 */
import { setAppDirs, setInitialized } from './dirsSlice';
import { HelperModule } from '../../../nativeModules';
import { AbsPathsMap } from './types';

// const settingsKey = 'dirsSettings';

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 *
 * Has to be called in index.js after the store got initialized.
 */
export const initializeFromStorage = (store: EnhancedStore) => {
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
				.then((dirs: AbsPathsMap) => {
					store.dispatch(setAppDirs(dirs));
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
