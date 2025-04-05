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
    useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import { MapContainerProps } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import { MapSettings } from '../types';
import ListItemModalControl from './generic/ListItemModalControl';
import { defaults } from '../constants';
import { NumericRowControl } from './generic/NumericRowControls';
import HgtSourceRowControl from './HgtSourceRowControl';
import InfoRadioRow from './generic/InfoRadioRow';
import InfoRowControl from './generic/InfoRowControl';

const HgtControl = () => {

	const { t } = useTranslation();

    const theme = useTheme();

	const {
		mapSettings,
		setMapSettings,
		appDirs,
	} = useContext( AppContext );

    const [showAdvanced,setShowAdvanced] = useState( false );

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

	const [hgtInterpolation,setHgtInterpolation] = useState<MapContainerProps['hgtInterpolation'] >( get( mapSettings, 'hgtInterpolation', defaults.mapSettings.hgtInterpolation ) );
	const hgtInterpolationRef = useRef( hgtInterpolation );
    useEffect( () => {
        hgtInterpolationRef.current = hgtInterpolation;
    }, [hgtInterpolation] );

	const [hgtFileInfoPurgeThreshold,setHgtFileInfoPurgeThreshold] = useState<MapContainerProps['hgtFileInfoPurgeThreshold'] >( get( mapSettings, 'hgtFileInfoPurgeThreshold', defaults.mapSettings.hgtFileInfoPurgeThreshold ) );
	const hgtFileInfoPurgeThresholdRef = useRef( hgtFileInfoPurgeThreshold );
    useEffect( () => {
        hgtFileInfoPurgeThresholdRef.current = hgtFileInfoPurgeThreshold;
    }, [hgtFileInfoPurgeThreshold] );

    const save = () => mapSettings && setMapSettings && setMapSettings( ( mapSettings: MapSettings ) => ( {
        ...mapSettings,
        hgtDirPath: hgtDirPathRef.current,
        ...( undefined !== hgtReadFileRateRef?.current && { hgtReadFileRate: hgtReadFileRateRef.current } ),
        ...( undefined !== hgtInterpolationRef?.current && { hgtInterpolation: hgtInterpolationRef.current } ),
        ...( undefined !== hgtFileInfoPurgeThresholdRef?.current && { hgtFileInfoPurgeThreshold: hgtFileInfoPurgeThresholdRef.current } ),
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
            onlyThreeSeconds={ true }
        />

        <InfoRadioRow
            opt={ {
                label: t( 'hgtInterpolation' ),
                key: 'hgtInterpolation',
            } }
            onPress={ () => setHgtInterpolation( ! hgtInterpolation ) }
            labelStyle={ theme.fonts.bodyMedium }
            labelExtractor={ a => a.label }
            status={ hgtInterpolation ? 'checked' : 'unchecked' }
            radioAlign={ 'left' }
            Info={ t( 'hint.maps.hgtInterpolation' ) }
        />

        <InfoRowControl
            label={ showAdvanced ? t( 'advancedSettingsHide' ) : t( 'advancedSettingsShow' ) }
            onLabelPress={ () => setShowAdvanced( ! showAdvanced ) }
        />
            { showAdvanced && <View>
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

                <NumericRowControl
                    label={ t( 'hgtFileInfoPurgeThreshold' ) }
                    optKey={ 'hgtFileInfoPurgeThreshold' }
                    options={ { hgtFileInfoPurgeThreshold } }
                    setOptions={ ( { hgtFileInfoPurgeThreshold } ) => {
                        setHgtFileInfoPurgeThreshold( hgtFileInfoPurgeThreshold );
                    } }
                    validate={ val => val >= 0 }
                    Info={ t( 'hint.maps.hgtFileInfoPurgeThreshold' ) }
                />
        </View> }

	</ListItemModalControl>;
};

export default HgtControl;