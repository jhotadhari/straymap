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
import { BaseMapSettings, BaseMapState, initialSettings, setHgtDirPath, setHgtFileInfoPurgeThreshold, setHgtInterpolation, setHgtReadFileRate, setInitialized, setLayers, setMapsforgeGeneral, setMapsforgeProfiles } from './baseMapSlice';
import { startAppListening } from '../../listenerMiddleware';

const settingsKey = 'baseMapSettings';

/**
 * Loads settings from defaultPreferences and dispatches them to the store.
 *
 * Has to be called in index.js after the store got initialized.
 */
export const initializeFromStorage = ( store: EnhancedStore ) => {
	DefaultPreference.get( settingsKey ).then( newSettingsStr => {
		if ( newSettingsStr ) {
			const newSettings = JSON.parse( newSettingsStr ) as Partial<BaseMapState>;
			if ( newSettings?.layers ) {
				store.dispatch( setLayers( newSettings.layers.map( layer => ( {
					...layer,
					key: rnUuid.v4(),
			 	} ) ) ) );
			}
			if ( newSettings?.mapsforgeProfiles ) {
				store.dispatch( setMapsforgeProfiles( newSettings.mapsforgeProfiles.map( profile => ( {
					...profile,
					key: rnUuid.v4(),
			 	} ) ) ) );
			}
			if ( newSettings?.hgtDirPath ) {
				store.dispatch( setHgtDirPath( newSettings.hgtDirPath ) );
			}
			if ( newSettings?.hgtReadFileRate ) {
				store.dispatch( setHgtReadFileRate( newSettings.hgtReadFileRate ) );
			}
			if ( newSettings?.hgtInterpolation ) {
				store.dispatch( setHgtInterpolation( newSettings.hgtInterpolation ) );
			}
			if ( newSettings?.hgtFileInfoPurgeThreshold ) {
				store.dispatch( setHgtFileInfoPurgeThreshold( newSettings.hgtFileInfoPurgeThreshold ) );
			}
			if ( newSettings?.mapsforgeGeneral ) {
				store.dispatch( setMapsforgeGeneral( newSettings.mapsforgeGeneral ) );
			}
		}
		store.dispatch( setInitialized( true ) );
	} )	.catch( err => 'ERROR' + console.log( err ) );
};

/**
 * Compares settings in this store slice with initialSettings,
 * and saves anything that esdiffers to initialSettings to defaultPreferences.
 */
export const saveToStorage = ( baseMapState: BaseMapState ) => {
	if ( ! baseMapState.initialized ) {
		return;
	}
	const settingsToSave: Partial<BaseMapSettings> = {};
	Object.keys( initialSettings ).forEach( key => {
		let shouldSave = false;
		let valueToSave;
		switch( key ) {
			case 'layers':
			case 'mapsforgeProfiles':
				valueToSave = get( baseMapState, key ).map( ele => omit( ele, 'key' ) );
				shouldSave = ! isEqual(
					valueToSave,
					get( initialSettings, key ).map( ele => omit( ele, 'key' ) ),
				);
			default:
				valueToSave = get( baseMapState, key );
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
		setLayers,
		setMapsforgeProfiles,
		setHgtDirPath,
		setHgtReadFileRate,
		setHgtInterpolation,
		setHgtFileInfoPurgeThreshold,
		setMapsforgeGeneral,
	),
	effect: async (_action, listenerApi) => {
		saveToStorage( listenerApi.getState().baseMap );
	},
} );
