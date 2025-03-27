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
	View,
} from 'react-native';
import {
	Icon,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import { MapSettings } from '../types';
import ListItemModalControl from './generic/ListItemModalControl';
import { MapContainerProps } from 'react-native-mapsforge-vtm';
import { defaults } from '../constants';
import { NumericRowControl } from './generic/NumericRowControls';
import HgtSourceRowControl from './HgtSourceRowControl';

const HgtControl = () => {

	const { t } = useTranslation();

	const {
		mapSettings,
		setMapSettings,
		appDirs,
	} = useContext( AppContext );

	const [hgtDirPath,setHgtDirPath] = useState<MapContainerProps['hgtDirPath'] >( get( mapSettings, 'hgtDirPath', defaults.mapSettings.hgtDirPath ) );
	const hgtDirPathRef = useRef( hgtDirPath );
    useEffect( () => {
        hgtDirPathRef.current = hgtDirPath;
    }, [hgtDirPath] );

	const [hgtReadFileRate,setHgtReadFileRate] = useState<MapContainerProps['hgtReadFileRate'] >( get( mapSettings, 'hgtReadFileRate', defaults.mapSettings.hgtReadFileRate ) );
	const hgtReadFileRateRef = useRef( hgtReadFileRate );
    useEffect( () => {
        hgtReadFileRateRef.current = hgtReadFileRate;
    }, [hgtReadFileRate] );

    const save = () => mapSettings && setMapSettings && setMapSettings( ( mapSettings: MapSettings ) => ( {
        ...mapSettings,
        hgtDirPath: hgtDirPathRef.current,
        ...( hgtReadFileRateRef.current && { hgtReadFileRate: hgtReadFileRateRef.current } ),
    } ) );
    useEffect( () => save, [] );    // Save on unmount.

	return <ListItemModalControl
		anchorLabel={ t( 'dem' ) }
		anchorIcon={ ( { color, style } ) => <View style={ style }>
			<Icon
				source="elevation-rise"
				color={ color }
				size={ 25 }
			/>
		</View> }
		header={ t( 'dem' ) }
		hasHeaderBackPress={ true }
	>

        <HgtSourceRowControl
            options={ { hgtDirPath } }
            setOptions={ options => {
                setHgtDirPath( get( options, 'hgtDirPath' ) || undefined );
            } }
            optKey={ 'hgtDirPath' }
            dirs={ appDirs ? appDirs.dem : [] }
        />

        <NumericRowControl
            label={ t( 'hgtReadFileRate' ) }
            optKey={ 'hgtReadFileRate' }
            options={ { hgtReadFileRate } }
            setOptions={ ( { hgtReadFileRate } ) => {
                setHgtReadFileRate( hgtReadFileRate );
            } }
            validate={ val => val >= 0 }
            Info={ t( 'hint.maps.hgtReadFileRate' ) }
        />

	</ListItemModalControl>;
};

export default HgtControl;