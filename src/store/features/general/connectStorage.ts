/**
 * External dependencies
 */
import { isAnyOf, type EnhancedStore } from '@reduxjs/toolkit';
import DefaultPreference from 'react-native-default-preference';
import { get, isEqual, set } from 'lodash-es';

/**
 * Internal dependencies
 */
import { GeneralSettings, GeneralState, initialSettings, setHardwareKeys, setInitialized, setInstalledVersion, setLang, setMapEventRate, setUnitPrefs } from './generalSlice';
import { startAppListening } from '../../listenerMiddleware';
import { changeLang, SUPPORTED_LANGUAGES } from '../../../assets/i18n/i18n';

const settingsKey = 'generalSettings';

/**
 * Listen to state lang changes and change i18n lang.
 */
startAppListening( {
	actionCreator: setLang,
	effect: async (action) => {
		changeLang( action.payload );
	},
} );

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 *
 * Has to be called in index.js after the store got initialized.
 */
export const initializeFromStorage = ( store: EnhancedStore ) => {
	DefaultPreference.get( settingsKey ).then( newSettingsStr => {
		if ( newSettingsStr ) {
			const newSettings = JSON.parse( newSettingsStr ) as Partial<GeneralState>;
			if ( newSettings?.lang && (
				'system' === newSettings.lang ||
				( [...SUPPORTED_LANGUAGES] as string[] ).includes( newSettings.lang )
			) ) {
				store.dispatch( setLang( newSettings.lang ) );
			}
			if ( newSettings?.installedVersion ) {
				store.dispatch( setInstalledVersion( newSettings.installedVersion ) );
			}
			if ( newSettings?.hardwareKeys ) {
				store.dispatch( setHardwareKeys( newSettings.hardwareKeys ) );
			}
			if ( newSettings?.unitPrefs ) {
				store.dispatch( setUnitPrefs( newSettings.unitPrefs ) );
			}
			if ( newSettings?.mapEventRate ) {
				store.dispatch( setMapEventRate( newSettings.mapEventRate ) );
			}
		}
		store.dispatch( setInitialized( true ) );
	} )	.catch( err => 'ERROR' + console.log( err ) );
};

/**
 * Compares settings in this store slice with initialSettings,
 * and saves anything that differs to initialSettings to defaultPreferences.
 */
export const saveToStorage = ( generalState: GeneralState ) => {
	if ( ! generalState.initialized ) {
		return;
	}
	const settingsToSave: Partial<GeneralSettings> = {};
	Object.keys( initialSettings ).forEach( key => {
		let shouldSave = false;
		let valueToSave;
		switch( key ) {
			default:
				valueToSave = get( generalState, key );
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
		setLang,
		setInstalledVersion,
		setHardwareKeys,
		setUnitPrefs,
		setMapEventRate,
	),
	effect: async (_action, listenerApi) => {
		saveToStorage( listenerApi.getState().general );
	},
} );
