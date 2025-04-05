/**
 * External dependencies
 */
import React, {
	useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    Text,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import { MapSettings, MapsforgeGeneral } from '../types';
import ListItemModalControl from './generic/ListItemModalControl';
import { defaults } from '../constants';
import { NumericRowControl } from './generic/NumericRowControls';
import IconIcomoon from './generic/IconIcomoon';

const SettingsMapsforgeControl = () => {

	const { t } = useTranslation();

	const {
		mapSettings,
		setMapSettings,
	} = useContext( AppContext );

	const [value,setValue] = useState<MapsforgeGeneral>( get( mapSettings, ['mapsforgeGeneral'], defaults.mapSettings.mapsforgeGeneral ) );
	const valueRef = useRef( value );
    useEffect( () => {
        valueRef.current = value;
    }, [value] );
    const save = () => {
        return setMapSettings && setMapSettings( ( mapSettings: MapSettings ) => ( {
            ...mapSettings,
            ...( valueRef.current && { mapsforgeGeneral: valueRef.current } ),
        } ) );
    }
    useEffect( () => save, [] );    // Save on unmount.

	return <ListItemModalControl
		anchorLabel={ t( 'settings.mapsforgeGeneral' ) }
        anchorIcon={ props => <IconIcomoon size={ 25 } name="mapsforge_puzzle_cog" {...props} /> }
		header={ t( 'settings.mapsforgeGeneral' ) }
		hasHeaderBackPress={ true }
	>

        <Text style={ { marginBottom: 10 } }>{ t( 'hint.applyToAllMapsforge' ) }</Text>
        <Text style={ { marginBottom: 10 } }>{ t( 'hint.changeNeedsRestart' ) }</Text>

        <NumericRowControl
            label={ t( 'lineScale' ) }
            optKey={ 'lineScale' }
            numType={ 'float' }
            options={ value }
            setOptions={ ( newValue ) => {
                setValue( newValue );
            } }
            validate={ val => val >= 0 }
            Info={ t( 'hint.maps.lineScale' ) }
        />

        <NumericRowControl
            label={ t( 'textScale' ) }
            optKey={ 'textScale' }
            numType={ 'float' }
            options={ value }
            setOptions={ ( newValue ) => {
                setValue( newValue );
            } }
            validate={ val => val >= 0 }
            Info={ t( 'hint.maps.textScale' ) }
        />

        <NumericRowControl
            label={ t( 'symbolScale' ) }
            optKey={ 'symbolScale' }
            numType={ 'float' }
            options={ value }
            setOptions={ ( newValue ) => {
                setValue( newValue );
            } }
            validate={ val => val >= 0 }
            Info={ t( 'hint.maps.symbolScale' ) }
        />

	</ListItemModalControl>;
};

export default SettingsMapsforgeControl;