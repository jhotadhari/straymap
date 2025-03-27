/**
 * External dependencies
 */
import {
    useContext,
    useEffect,
    useState,
} from 'react';
import {
	View,
} from 'react-native';
import {
    Text,
    useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { debounce, get } from 'lodash-es';

/**
 * react-native-mapsforge-vtm dependencies
 */
import { LayerHillshading, ShadingAlgorithm, ShadingAlgorithmOptions } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import ButtonHighlight from './generic/ButtonHighlight';
import { LayerConfig, LayerConfigOptionsHillshading, OptionBase } from '../types';
import InfoRowControl from './generic/InfoRowControl';
import { AppContext } from '../Context';
import ModalWrapper from './generic/ModalWrapper';
import { NumericRowControl, NumericMultiRowControl } from './generic/NumericRowControls';
import ListItemMenuControl from './generic/ListItemMenuControl';
import HgtSourceRowControl from './HgtSourceRowControl';
import { fillLayerConfigOptionsWithDefaults, getHillshadingCacheDirChild } from '../utils';
import CacheControl from './CacheControl';
import { defaults } from '../constants';

const AlgorithmControl = ( {
    options,
    setOptions,
} : {
    options: LayerConfigOptionsHillshading;
    setOptions: ( options : LayerConfigOptionsHillshading ) => void;
} ) => {

    const { t } = useTranslation();
	const theme = useTheme();

	const [modalVisible, setModalVisible] = useState( false );

    const opts : OptionBase[] = Object.keys( LayerHillshading.shadingAlgorithms ).map( key => ( {
        key: LayerHillshading.shadingAlgorithms[key],
        label: key,
    } ) );
    const getInitialSelectedOpt = () : ( null | LayerConfigOptionsHillshading['shadingAlgorithm'] ) => {
        if ( options.shadingAlgorithm ) {
            const opt = opts.find( opt => opt.key === options.shadingAlgorithm );
            return get( opt, 'key', null ) as ( null | LayerConfigOptionsHillshading['shadingAlgorithm'] );
        } else {
            return null;
        }
    };
	const [selectedOpt,setSelectedOpt] = useState<null | LayerConfigOptionsHillshading['shadingAlgorithm']>( getInitialSelectedOpt() );

    const [algOpts,setAlgOpts] = useState<ShadingAlgorithmOptions>( options.shadingAlgorithmOptions || {} as ShadingAlgorithmOptions );

    useEffect( () => {
        if ( selectedOpt ) {
            setOptions( {
                ...options,
                shadingAlgorithm: selectedOpt,
            } );
        }
    }, [selectedOpt] );

    useEffect( () => {
        if ( algOpts ) {
            setOptions( {
                ...options,
                shadingAlgorithmOptions: algOpts,
            } );
        }
    }, [algOpts] );

    return <InfoRowControl
        label={ t( 'algorithm' ) }
        Info={ t( 'hint.maps.shadingAlgorithm' ) }
    >
        { modalVisible && <ModalWrapper
            visible={ modalVisible }
            backgroundBlur={ false }
            onDismiss={ () => setModalVisible( false ) }
            onHeaderBackPress={ () => setModalVisible( false ) }
            header={ t( 'shadingAlgorithm' ) }
        >
            <InfoRowControl
                label={ t( 'algorithm' ) }
            >
                <ListItemMenuControl
                    options={ opts }
                    listItemStyle={ {
                        marginLeft: 0,
                        paddingLeft: 10,
                    } }
                    value={ selectedOpt || undefined }
                    setValue={ newValue => setSelectedOpt( newValue as ShadingAlgorithm ) }
                    anchorLabel={ get( opts.find( opt => opt.key === options.shadingAlgorithm ), 'label', '' ) }
                />
            </InfoRowControl>

            { 'SimpleShadingAlgorithm' === selectedOpt && <NumericRowControl
                label={ t( 'linearity' ) }
                optKey={ 'linearity' }
                options={ algOpts }
                setOptions={ setAlgOpts }
                numType="float"
                Info={ t( 'hint.maps.shadingLinearity' ) }
            /> }

            { 'SimpleShadingAlgorithm' === selectedOpt && <NumericRowControl
                label={ t( 'scale' ) }
                optKey={ 'scale' }
                options={ algOpts }
                setOptions={ setAlgOpts }
                validate={ val => val > 0 }
                numType="float"
                Info={ t( 'hint.maps.shadingScale' ) }
            /> }

            { 'DiffuseLightShadingAlgorithm' === selectedOpt && <NumericRowControl
                label={ t( 'heightAngle' ) }
                optKey={ 'heightAngle' }
                options={ algOpts }
                setOptions={ setAlgOpts }
                validate={ val => val >= 0 && val <= 90 }
                Info={ t( 'hint.maps.shadingHeightAngle' ) }
            /> }

            <ButtonHighlight
                style={ { marginTop: 30 } }
                onPress={ () => {
                    setModalVisible( false );
                } }
                mode="contained"
                buttonColor={ get( theme.colors, 'successContainer' ) }
                textColor={ get( theme.colors, 'onSuccessContainer' ) }
            ><Text>{ t( 'ok' ) }</Text></ButtonHighlight>

        </ModalWrapper> }

        <View style={ { flexDirection: 'row', alignItems: 'center' } }>
            <ButtonHighlight style={ { marginTop: 3 } } onPress={ () => setModalVisible( true ) } >
                <Text>{ t( selectedOpt
                    ? get( opts.find( opt => opt.key === selectedOpt ), 'label', '' )
                    : 'selected.none'
                ) }</Text>
            </ButtonHighlight>
        </View>

    </InfoRowControl>;
};

const MapLayerControlHillshading = ( {
    editLayer,
    updateLayer,
} : {
    editLayer: LayerConfig;
    updateLayer: ( newItem : LayerConfig ) => void;
} ) => {

	const { t } = useTranslation();

    const { appDirs } = useContext( AppContext );

    const [options,setOptions] = useState<LayerConfigOptionsHillshading>(
        fillLayerConfigOptionsWithDefaults( 'hillshading', editLayer.options ) as LayerConfigOptionsHillshading
    );

    const doUpdate = debounce( () => {
        updateLayer( {
            ...editLayer,
            options,
        } );
    }, 300 );
    useEffect( () => {
        doUpdate();
    }, [Object.values( options ).join( '' )] );

    return <View>

        <HgtSourceRowControl
            options={ options }
            setOptions={ setOptions }
            optKey={ 'hgtDirPath' }
            dirs={ appDirs ? appDirs.dem : [] }
        />

        <AlgorithmControl
            options={ options }
            setOptions={ setOptions }
        />

        <NumericMultiRowControl
            label={ t( 'enabled' ) }
            optKeys={ ['enabledZoomMin','enabledZoomMax'] }
            optLabels={ ['min','max'] }
            options={ options }
            setOptions={ setOptions }
            validate={ val => val >= 0 }
            Info={ t( 'hint.maps.enabled' ) + '\n\n' + t( 'hint.maps.zoomGeneralInfo' ) }
        />

        <NumericMultiRowControl
            label={ 'Zoom' }
            optKeys={ ['zoomMin','zoomMax'] }
            optLabels={ ['min','max'] }
            options={ options }
            setOptions={ setOptions }
            validate={ val => val >= 0 }
            Info={ t( 'hint.maps.zoom' ) + '\n\n' + t( 'hint.maps.zoomGeneralInfo' ) }
        />

        <NumericRowControl
            label={ t( 'magnitude' ) }
            optKey={ 'magnitude' }
            options={ options }
            setOptions={ setOptions }
            validate={ val => val > 0 }
            Info={ t( 'hint.maps.shadingMagnitude' ) }
        />

        <CacheControl
            options={ options }
            setOptions={ setOptions }
            baseDefault={ defaults.layerConfigOptions.hillshading.cacheDirBase }
            cacheDirChild={ getHillshadingCacheDirChild( options ) }
        />

    </View>;

};

export default MapLayerControlHillshading;