/**
 * External dependencies
 */
import { get, pick } from 'lodash-es';
import {
	useEffect,
	useState,
} from 'react';
import {
	InteractionManager,
	ToastAndroid,
} from 'react-native';
import DefaultPreference from 'react-native-default-preference';
import useDeepCompareEffect from 'use-deep-compare-effect'

const mergeSettingsForKey = ( initialSettings: object, newSettings: object, key: string ) => ( {
    [key]: {
        ...get( initialSettings, key, {} ),
        ...( newSettings.hasOwnProperty( key ) && pick(
            get( newSettings, key, {} ),
            Object.keys( get( initialSettings, key, {} ) )
        ) ),
    },
} );

const useSettings = ( {
	maybeIsBusyAdd,
	maybeIsBusyRemove,
	settingsKey,
	savedMessage,
	initialSettings = {},
} : {
	maybeIsBusyAdd?: ( key: string ) => void;
	maybeIsBusyRemove?: ( key: string ) => void;
	savedMessage?: string;
	settingsKey: string;
	initialSettings?: object;
} ) => {

	const [initialized,setInitialized] = useState( false );
	const [settings,setSettings] = useState<object>( initialSettings );

    useEffect( () => {
		const busyKey = 'useSettings' + 'load' + settingsKey;
		maybeIsBusyAdd && maybeIsBusyAdd( busyKey );
		InteractionManager.runAfterInteractions( () => {
			DefaultPreference.get( settingsKey ).then( newSettingsStr => {
				if ( newSettingsStr ) {
					const newSettings = JSON.parse( newSettingsStr );
					setSettings( {
						...initialSettings,
						...newSettings,
						...( 'generalSettings' === settingsKey && {
							...mergeSettingsForKey( initialSettings, newSettings, 'unitPrefs' ),
							...mergeSettingsForKey( initialSettings, newSettings, 'dashboardElements' ),
						} ),
					} );
				}
				setInitialized( true );
			} ).catch( err => 'ERROR' + console.log( err ) )
			.finally( () => maybeIsBusyRemove && maybeIsBusyRemove( busyKey ) );
		} );
    }, [] );

	useDeepCompareEffect( () => {
		if ( initialized ) {
			const busyKey = 'useSettings' + 'changed' + settingsKey;
			maybeIsBusyAdd && maybeIsBusyAdd( busyKey );
			InteractionManager.runAfterInteractions( () => {
				DefaultPreference.set( settingsKey, JSON.stringify( settings ) )
				.then( () => savedMessage ? ToastAndroid.show( savedMessage, ToastAndroid.SHORT ) : null )
				.catch( err => 'ERROR' + console.log( err ) )
				.finally( () => maybeIsBusyRemove && maybeIsBusyRemove( busyKey ) )
			} );
		}
	}, [settings] );

	return {
		settings,
		setSettings,
		initialized,
	};

};

export default useSettings;