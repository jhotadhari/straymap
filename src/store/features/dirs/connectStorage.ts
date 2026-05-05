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
export const initializeFromStorage = ( store: EnhancedStore ) => {
	Promise.all( [
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
		new Promise( ( resolve: ( value: boolean ) => void ) => {
			HelperModule.getAppDirs().then( ( dirs : AbsPathsMap ) => {
				store.dispatch( setAppDirs( dirs ) );
					resolve( true );
			} ).catch( ( err: any ) => {
				console.log( 'ERROR', err );
				resolve( false );
			} );
		} ),
	] ).then( ( results: boolean[] ) => {
		if ( results.every( result => !! result ) ) {
			store.dispatch( setInitialized( true ) );
		}
	} ).catch( ( err : any ) => console.log( err ) );
};

// /**
//  * Compares settings in this store slice with initialSettings,
//  * and saves anything that differs to initialSettings to defaultPreferences.
//  */
// export const saveToStorage = ( dirsState: DirsState ) => {
// 	if ( ! dirsState.initialized ) {
// 		return;
// 	}
// 	const settingsToSave: Partial<DirsSettings> = {};
// 	Object.keys( initialSettings ).forEach( key => {
// 		let shouldSave = false;
// 		let valueToSave;
// 		switch( key ) {
// 			default:
// 				valueToSave = get( dirsState, key );
// 				shouldSave = ! isEqual(
// 					valueToSave,
// 					get( initialSettings, key )
// 				);
// 		}
// 		if ( shouldSave ) {
// 			set( settingsToSave, key, valueToSave );
// 		}
// 	} );
// 	DefaultPreference.set( settingsKey, JSON.stringify( settingsToSave ) )
// };

// /**
//  * Listens to action that change settings in this store slice,
//  * and calls the function to save them to defaultPreferences.
//  *  */
// startAppListening( {
// 	matcher: isAnyOf(
// 		setSomething
// 	),
// 	effect: async (_action, listenerApi) => {
// 		saveToStorage( listenerApi.getState().dirs );
// 	},
// } );
