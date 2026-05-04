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
import { runAfterInteractions } from '../utils';
import { useAppDispatch } from '../store/hooks';
import { addBusyKey, removeBusyKey } from '../store/features/ui/uiSlice';

const useSettings = ( {
	settingsKey,
	savedMessage,
	initialSettings = {},
} : {
	savedMessage?: string;
	settingsKey: string;
	initialSettings?: object;
} ) => {

	const dispatch = useAppDispatch();

	const [initialized,setInitialized] = useState( false );
	const [settings,setSettings] = useState<object>( initialSettings );

    useEffect( () => {
		const busyKey = 'useSettings' + 'load' + settingsKey;
		dispatch( addBusyKey( busyKey ) );
		runAfterInteractions( () => {
			DefaultPreference.get( settingsKey ).then( newSettingsStr => {
				if ( newSettingsStr ) {
					const newSettings = JSON.parse( newSettingsStr );
					setSettings( {
						...initialSettings,
						...newSettings,
					} );
				}
				setInitialized( true );
			} ).catch( err => 'ERROR' + console.log( err ) )
			.finally( () => dispatch( removeBusyKey( busyKey ) ) );
		} );
    }, [] );

	useDeepCompareEffect( () => {
		if ( initialized ) {
			const busyKey = 'useSettings' + 'changed' + settingsKey;
			dispatch( addBusyKey( busyKey ) );
			runAfterInteractions( () => {
				DefaultPreference.set( settingsKey, JSON.stringify( settings ) )
					.then( () => savedMessage ? ToastAndroid.show( savedMessage, ToastAndroid.SHORT ) : null )
					.catch( err => 'ERROR' + console.log( err ) )
					.finally( () => dispatch( removeBusyKey( busyKey ) ) )
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