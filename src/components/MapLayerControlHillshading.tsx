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
    MD3Theme,
    Text,
    useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { debounce, get, invert } from 'lodash-es';

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
import { styles as mdStyles } from '../markdown/styles';
import HintLink from './generic/HintLink';

const algorithmLinks = {
    CLASY_ADAPTIVE: 'https://github.com/mapsforge/mapsforge/blob/master/mapsforge-map/src/main/java/org/mapsforge/map/layer/hills/AdaptiveClasyHillShading.java',
    CLASY_STANDARD: 'https://github.com/mapsforge/mapsforge/blob/master/mapsforge-map/src/main/java/org/mapsforge/map/layer/hills/StandardClasyHillShading.java',
    CLASY_SIMPLE: 'https://github.com/mapsforge/mapsforge/blob/master/mapsforge-map/src/main/java/org/mapsforge/map/layer/hills/SimpleClasyHillShading.java',
    CLASY_HALF_RES: 'https://github.com/mapsforge/mapsforge/blob/master/mapsforge-map/src/main/java/org/mapsforge/map/layer/hills/HalfResClasyHillShading.java',
    CLASY_HI_RES: 'https://github.com/mapsforge/mapsforge/blob/master/mapsforge-map/src/main/java/org/mapsforge/map/layer/hills/HiResClasyHillShading.java',
    SIMPLE: 'https://github.com/mapsforge/mapsforge/blob/master/mapsforge-map/src/main/java/org/mapsforge/map/layer/hills/SimpleShadingAlgorithm.java',
    DIFFUSE_LIGHT: 'https://github.com/mapsforge/mapsforge/blob/master/mapsforge-map/src/main/java/org/mapsforge/map/layer/hills/DiffuseLightShadingAlgorithm.java',
};

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
    const [algoInfo,setAlgoInfo] = useState( false );
    const [showAdvanced,setShowAdvanced] = useState( false );

    const opts : OptionBase[] = Object.keys( LayerHillshading.shadingAlgorithms ).map( key => ( {
        key: LayerHillshading.shadingAlgorithms[key],
        label: t( 'shadingAlgorithms.' + key + '.label' ),
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

    const shadingAlgoKey = get(
        invert( LayerHillshading.shadingAlgorithms ),
        options?.shadingAlgorithm || '',
        ''
    );

    const shadingAlgorithmsOptionKeys = get(
        LayerHillshading.shadingAlgorithmsOptionKeys,
        shadingAlgoKey,
        []
    ) as string[];

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
                onLabelPress={ () => setAlgoInfo( ! algoInfo ) }
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

            { algoInfo && shadingAlgoKey && <View style={ {
                ...get( mdStyles( theme ), 'blockquote' ),
                marginTop: -10,
                marginBottom: 20,
                paddingVertical: 10,
                marginLeft: 0,
            } }>
                <Text>{ t( 'shadingAlgorithms.' + shadingAlgoKey + '.info' ) }</Text>
                { get( algorithmLinks, shadingAlgoKey ) && <HintLink
                    label={ t( 'More information, read the code' ) + ':' }
                    url={ get( algorithmLinks, shadingAlgoKey ) }
                /> }
            </View> }

            { shadingAlgorithmsOptionKeys.includes( 'linearity' ) && <NumericRowControl
                label={ t( 'shadingOptions.linearity.label' ) }
                optKey={ 'linearity' }
                options={ algOpts }
                setOptions={ setAlgOpts }
                numType="float"
                Info={ t( 'shadingOptions.linearity.hint' ) }
            /> }

            { shadingAlgorithmsOptionKeys.includes( 'scale' ) && <NumericRowControl
                label={ t( 'shadingOptions.scale.label' ) }
                optKey={ 'scale' }
                options={ algOpts }
                setOptions={ setAlgOpts }
                validate={ val => val > 0 }
                numType="float"
                Info={ t( 'shadingOptions.scale.hint' ) }
            /> }

            { shadingAlgorithmsOptionKeys.includes( 'heightAngle' ) && <NumericRowControl
                label={ t( 'shadingOptions.heightAngle.label' ) }
                optKey={ 'heightAngle' }
                options={ algOpts }
                setOptions={ setAlgOpts }
                validate={ val => val >= 0 && val <= 90 }
                Info={ t( 'shadingOptions.heightAngle.hint' ) }
            /> }

            { shadingAlgorithmsOptionKeys.includes( 'maxSlope' ) && <NumericRowControl
                label={ t( 'shadingOptions.maxSlope.label' ) }
                optKey={ 'maxSlope' }
                options={ algOpts }
                setOptions={ setAlgOpts }
                validate={ val => val > 0 && val < 100 }
                numType="float"
                Info={ t( 'shadingOptions.maxSlope.hint' ) }
            /> }

            { shadingAlgorithmsOptionKeys.includes( 'minSlope' ) && <NumericRowControl
                label={ t( 'shadingOptions.minSlope.label' ) }
                optKey={ 'minSlope' }
                options={ algOpts }
                setOptions={ setAlgOpts }
                validate={ val => val >= 0 && val < 100 }
                numType="float"
                Info={ t( 'shadingOptions.minSlope.hint' ) }
            /> }

            { shadingAlgorithmsOptionKeys.includes( 'asymmetryFactor' ) && <NumericRowControl
                label={ t( 'shadingOptions.asymmetryFactor.label' ) }
                optKey={ 'asymmetryFactor' }
                options={ algOpts }
                setOptions={ setAlgOpts }
                validate={ val => val >= 0 && val <= 1 }
                numType="float"
                Info={ t( 'shadingOptions.asymmetryFactor.hint' ) }
            /> }

            { ( shadingAlgorithmsOptionKeys.includes( 'qualityScale' )
                || shadingAlgorithmsOptionKeys.includes( 'readingThreadsCount' )
                || shadingAlgorithmsOptionKeys.includes( 'computingThreadsCount' )
            ) && <View>

                <InfoRowControl
                    label={ showAdvanced ? t( 'advancedSettingsHide' ) : t( 'advancedSettingsShow' ) }
                    onLabelPress={ () => setShowAdvanced( ! showAdvanced ) }
                />

                { showAdvanced && <View>

                    { shadingAlgorithmsOptionKeys.includes( 'qualityScale' ) && <NumericRowControl
                        label={ t( 'shadingOptions.qualityScale.label' ) }
                        optKey={ 'qualityScale' }
                        options={ algOpts }
                        setOptions={ setAlgOpts }
                        validate={ val => val >= 0 && val <= 1 }
                        numType="float"
                        Info={ t( 'shadingOptions.qualityScale.hint' ) }
                    /> }

                    { shadingAlgorithmsOptionKeys.includes( 'readingThreadsCount' ) && <NumericRowControl
                        label={ t( 'shadingOptions.readingThreadsCount.label' ) }
                        optKey={ 'readingThreadsCount' }
                        options={ algOpts }
                        setOptions={ setAlgOpts }
                        validate={ val => val > 0 || val === -1 }
                        Info={ t( 'shadingOptions.readingThreadsCount.hint' ) }
                    /> }

                    { shadingAlgorithmsOptionKeys.includes( 'computingThreadsCount' ) && <NumericRowControl
                        label={ t( 'shadingOptions.computingThreadsCount.label' ) }
                        optKey={ 'computingThreadsCount' }
                        options={ algOpts }
                        setOptions={ setAlgOpts }
                        validate={ val => val > 0 || val === -1 }
                        Info={ t( 'shadingOptions.computingThreadsCount.hint' ) }
                    /> }

                </View> }

            </View> }

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
            label={ t( 'shadingOptions.magnitude.label' ) }
            optKey={ 'magnitude' }
            options={ options }
            setOptions={ setOptions }
            validate={ val => val > 0 }
            Info={ t( 'shadingOptions.magnitude.hint' ) }
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