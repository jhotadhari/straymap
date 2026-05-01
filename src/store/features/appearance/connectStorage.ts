/**
 * External dependencies
 */
import { isAnyOf, type EnhancedStore } from '@reduxjs/toolkit';
import DefaultPreference from 'react-native-default-preference';
import { get, isEqual, set } from 'lodash-es';

/**
 * Internal dependencies
 */
import { AppearanceSettings, AppearanceState, initialSettings, setCursor, setInitialized } from './appearanceSlice';
import { startAppListening } from '../../listenerMiddleware';

const settingsKey = 'appearanceSettings';

export const initializeFromStorage = ( store: EnhancedStore ) => {
	DefaultPreference.get( settingsKey ).then( newSettingsStr => {
		if ( newSettingsStr ) {
			const newSettings = JSON.parse( newSettingsStr ) as Partial<AppearanceState>;
			if ( newSettings?.cursor ) {
				store.dispatch( setCursor( newSettings.cursor ) );
			}
		}
		store.dispatch( setInitialized( true ) );
	} )	.catch( err => 'ERROR' + console.log( err ) );
};

export const saveToStorage = ( appearanceState: AppearanceState ) => {
	if ( ! appearanceState.initialized ) {
		return;
	}
	const settingsToSave: Partial<AppearanceSettings> = {};
	Object.keys( initialSettings ).forEach( key => {
		if ( ! isEqual(
			get( appearanceState, key ),
			get( initialSettings, key )
		) ) {
			set( settingsToSave, key, get( appearanceState, key ) );
		}
	} );
	DefaultPreference.set( settingsKey, JSON.stringify( settingsToSave ) )
};

startAppListening( {
	matcher: isAnyOf(
		setCursor,
		// ...appearanceSlice.actions
	),
	effect: async (_action, listenerApi) => {
		saveToStorage( listenerApi.getState().appearance );
	},
} );

