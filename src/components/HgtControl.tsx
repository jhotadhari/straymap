/**
 * External dependencies
 */
import React, {
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

/**
 * Internal dependencies
 */
import ListItemModalControl from './generic/ListItemModalControl';
import { NumericRowControl } from './generic/NumericRowControls';
import HgtSourceRowControl from './HgtSourceRowControl';
import InfoRadioRow from './generic/InfoRadioRow';
import InfoRowControl from './generic/InfoRowControl';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectHgtDirPath, selectHgtFileInfoPurgeThreshold, selectHgtInterpolation, selectHgtReadFileRate } from '../store/features/baseMap/selectors';
import { setHgtDirPath, setHgtFileInfoPurgeThreshold, setHgtInterpolation, setHgtReadFileRate } from '../store/features/baseMap/baseMapSlice';
import { selectAppDirs } from '../store/features/dirs/selectors';

const HgtControl = () => {

	const { t } = useTranslation();

    const theme = useTheme();

    const appDirs = useAppSelector( selectAppDirs );

    const [showAdvanced,setShowAdvanced] = useState( false );

    const dispatch = useAppDispatch();

    const hgtDirPath = useAppSelector( selectHgtDirPath );
    const hgtReadFileRate = useAppSelector( selectHgtReadFileRate );
    const hgtInterpolation = useAppSelector( selectHgtInterpolation );
    const hgtFileInfoPurgeThreshold = useAppSelector( selectHgtFileInfoPurgeThreshold );

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
                dispatch( setHgtDirPath( get( options, 'hgtDirPath' ) || undefined ) );
            } }
            optKey={ 'hgtDirPath' }
            dirs={ get( appDirs, 'dem', [] ) }
            onlyThreeSeconds={ true }
        />

        <InfoRadioRow
            opt={ {
                label: t( 'hgtInterpolation' ),
                key: 'hgtInterpolation',
            } }
            onPress={ () => dispatch( setHgtInterpolation( ! hgtInterpolation ) ) }
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
                        dispatch( setHgtReadFileRate( hgtReadFileRate ) );
                    } }
                    validate={ val => val >= 0 }
                    Info={ t( 'hint.maps.hgtReadFileRate' ) }
                />

                <NumericRowControl
                    label={ t( 'hgtFileInfoPurgeThreshold' ) }
                    optKey={ 'hgtFileInfoPurgeThreshold' }
                    options={ { hgtFileInfoPurgeThreshold } }
                    setOptions={ ( { hgtFileInfoPurgeThreshold } ) => {
                        dispatch( setHgtFileInfoPurgeThreshold( hgtFileInfoPurgeThreshold ) );
                    } }
                    validate={ val => val >= 0 }
                    Info={ t( 'hint.maps.hgtFileInfoPurgeThreshold' ) }
                />
        </View> }

	</ListItemModalControl>;
};

export default HgtControl;