/**
 * External dependencies
 */
import { isAnyOf, type EnhancedStore } from '@reduxjs/toolkit';
import DefaultPreference from 'react-native-default-preference';
import { get, isEqual, omit, set } from 'lodash-es';
import rnUuid from 'react-native-uuid';

/**
 * Internal dependencies
 */
import { DashboardSettings, DashboardState, initialSettings, setInitialized } from './dashboardSlice';
import { startAppListening } from '../../listenerMiddleware';
import { setDashboardStyle, setElements } from './dashboardSlice';

const settingsKey = 'dashboardSettings';

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 *
 * Has to be called in index.js after the store got initialized.
 */
export const initializeFromStorage = ( store: EnhancedStore ) => {
	DefaultPreference.get( settingsKey ).then( newSettingsStr => {
		if ( newSettingsStr ) {
			const newSettings = JSON.parse( newSettingsStr ) as Partial<DashboardState>;
			if ( newSettings?.elements ) {
				store.dispatch( setElements( newSettings.elements.map( ele => ( {
					...ele,
					key: rnUuid.v4(),
			 	} ) ) ) );
			}
			if ( newSettings?.dashboardStyle ) {
				store.dispatch( setDashboardStyle( newSettings.dashboardStyle ) );
			}
		}
		store.dispatch( setInitialized( true ) );
	} )	.catch( err => 'ERROR' + console.log( err ) );
};

/**
 * Compares settings in this store slice with initialSettings,
 * and saves anything that esdiffers to initialSettings to defaultPreferences.
 */
export const saveToStorage = ( dashboardState: DashboardState ) => {
	if ( ! dashboardState.initialized ) {
		return;
	}
	const settingsToSave: Partial<DashboardSettings> = {};
	Object.keys( initialSettings ).forEach( key => {
		let shouldSave = false;
		let valueToSave;
		switch( key ) {
			case 'elements':
				valueToSave = get( dashboardState, key ).map( ele => omit( ele, 'key' ) );
				shouldSave = ! isEqual(
					valueToSave,
					get( initialSettings, key ).map( ele => omit( ele, 'key' ) ),
				);
			default:
				valueToSave = get( dashboardState, key );
				shouldSave = ! isEqual(
					valueToSave,
					get( initialSettings, key )
				);
		}
		if ( shouldSave ) {
			set( settingsToSave, key, valueToSave );
		}
	} );
	DefaultPreference.set( settingsKey, JSON.stringify( settingsToSave ) )
};

/**
 * Listens to action that change settings in this store slice,
 * and calls the function to save them to defaultPreferences.
 *  */
startAppListening( {
	matcher: isAnyOf(
		setElements,
		setDashboardStyle,
	),
	effect: async (_action, listenerApi) => {
		saveToStorage( listenerApi.getState().dashboard );
	},
} );
