/**
 * External dependencies
 */
import React, {
    useCallback,
} from 'react';
import {
    Text,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ListItemModalControl from './generic/ListItemModalControl';
import { NumericRowControl } from './generic/NumericRowControls';
import IconIcomoon from './generic/IconIcomoon';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectMapsforgeGeneral } from '../store/features/baseMap/selectors';
import { setMapsforgeGeneral } from '../store/features/baseMap/baseMapSlice';
import { MapsforgeGeneral } from '../store/features/baseMap/types';

const SettingsMapsforgeControl = () => {

	const { t } = useTranslation();

    const dispatch = useAppDispatch();

    const settings = useAppSelector( selectMapsforgeGeneral );

    const handleChange = useCallback( ( newSettings: MapsforgeGeneral ) => {
        dispatch( setMapsforgeGeneral( newSettings ) );
    }, [] );

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
            options={ settings }
            setOptions={ handleChange }
            validate={ val => val >= 0 }
            Info={ t( 'hint.maps.lineScale' ) }
        />

        <NumericRowControl
            label={ t( 'textScale' ) }
            optKey={ 'textScale' }
            numType={ 'float' }
            options={ settings }
            setOptions={ handleChange }
            validate={ val => val >= 0 }
            Info={ t( 'hint.maps.textScale' ) }
        />

        <NumericRowControl
            label={ t( 'symbolScale' ) }
            optKey={ 'symbolScale' }
            numType={ 'float' }
            options={ settings }
            setOptions={ handleChange }
            validate={ val => val >= 0 }
            Info={ t( 'hint.maps.symbolScale' ) }
        />

	</ListItemModalControl>;
};

export default SettingsMapsforgeControl;