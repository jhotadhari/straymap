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
import { openDocumentTree } from "react-native-scoped-storage"

/**
 * react-native-mapsforge-vtm dependencies
 */
import { LayerHillshading, ShadingAlgorithm, ShadingAlgorithmOptions } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import ButtonHighlight from './ButtonHighlight';
import { AbsPath, LayerConfig, LayerConfigOptionsHillshading, OptionBase } from '../types';
import InfoRowControl from './InfoRowControl';
import { AppContext } from '../Context';
import ModalWrapper from './ModalWrapper';
import RadioListItem from './RadioListItem';
import { NumericRowControl, NumericMultiRowControl } from './NumericRowControls';
import ListItemMenuControl from './ListItemMenuControl';

const SourceRowControl = ( {
    dirs,
    options,
    setOptions,
} : {
    dirs: AbsPath[],
    options: LayerConfigOptionsHillshading;
    setOptions: ( options : LayerConfigOptionsHillshading ) => void;
} ) => {

    const { t } = useTranslation();
    const theme = useTheme();

	const [modalVisible, setModalVisible] = useState( false );

    let opts : OptionBase[] = [
        {
            key: 'custom',
            label: t( 'custom' ),
        },
    ];
    [...dirs].reverse().map( ( dir : AbsPath ) => {
        opts = [
            {
                key: dir,
                label: dir,
            },
            ...opts,
        ];
    } );

    const getInitialSelectedOpt = () : ( null | 'custom' | LayerConfigOptionsHillshading['hgtDirPath'] ) => {
        if ( options.hgtDirPath ) {
            const opt = opts.find( opt => opt.key === options.hgtDirPath );
            return opt ? get( opt, 'key', null ) as ( null | LayerConfigOptionsHillshading['hgtDirPath'] ) : 'custom';
        } else {
            return null;
        }
    };

	const [selectedOpt,setSelectedOpt] = useState<null | 'custom' | LayerConfigOptionsHillshading['hgtDirPath']>( getInitialSelectedOpt() );

	const [customUri,setCustomUri] = useState<undefined | `content://${string}`>( options.hgtDirPath && options.hgtDirPath.startsWith( 'content://' )
        ? options.hgtDirPath as `content://${string}`
        : undefined
    );

    useEffect( () => {
        if ( selectedOpt ) {
            setOptions( {
                ...options,
                hgtDirPath: 'custom' === selectedOpt ? customUri : selectedOpt,
            } );
        }
    }, [selectedOpt] );

    return <InfoRowControl
            label={ t( 'map.demDir' ) }
            Info={ 'bla bla ??? info text' }
    >
        { modalVisible && <ModalWrapper
            visible={ modalVisible }
            backgroundBlur={ false }
            onDismiss={ () => setModalVisible( false ) }
            header={ t( 'map.selectDemDir' ) }
            onHeaderBackPress={ () => setModalVisible( false ) }
        >
            { [...opts].map( opt => {
                return <View
                    key={ opt.key }
                    style={ {
                        marginBottom: 18,
                    } }
                >
                    <RadioListItem
                        key={ opt.key }
                        opt={ opt }
                        onPress={ () => {
                            if ( opt.key === selectedOpt ) {
                                setSelectedOpt( null );
                                setCustomUri( undefined );
                            } else {
                                if ( opt.key === 'custom' ) {
                                    openDocumentTree( true ).then( dir => {
                                        setCustomUri( dir.uri as `content://${string}` );
                                        setSelectedOpt( 'custom' );
                                        setModalVisible( false );
                                    } ).catch( ( err : any ) => console.log( err ) );
                                } else {
                                    setCustomUri( undefined );
                                    setSelectedOpt( opt.key as LayerConfigOptionsHillshading['hgtDirPath'] );
                                    setModalVisible( false );
                                }
                            }
                        } }
                        labelStyle={ theme.fonts.bodyMedium }
                        labelExtractor={ a => a.label }
                        descExtractor={ opt.key === 'custom' ? () => ( customUri ? customUri?.replace( 'content://', 'content:// ' ) : null ) : undefined }
                        status={ opt.key === selectedOpt ? 'checked' : 'unchecked' }
                    />
                </View>;
            } ) }

            <ButtonHighlight
                style={ { marginTop: 10 } }
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
                    ? ( 'custom' === selectedOpt && customUri
                        ? customUri?.replace( 'content://', 'content:// ' ).slice( 0, Math.min( customUri.length - 1, 30 ) )
                        : get( opts.find( opt => opt.key === selectedOpt ), 'label', '' )
                    )
                    : 'selected.none'
                ) }</Text>
            </ButtonHighlight>
        </View>

    </InfoRowControl>;
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
        Info={ 'bla bla ??? info text' }
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
                Info={ 'bla bla ??? info text' }
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
                Info={ t( 'linearityWhat' ) }
            /> }

            { 'SimpleShadingAlgorithm' === selectedOpt && <NumericRowControl
                label={ t( 'scale' ) }
                optKey={ 'scale' }
                options={ algOpts }
                setOptions={ setAlgOpts }
                validate={ val => val > 0 }
                numType="float"
                Info={ t( 'scaleWhat' ) }
            /> }

            { 'DiffuseLightShadingAlgorithm' === selectedOpt && <NumericRowControl
                label={ t( 'heightAngle' ) }
                optKey={ 'heightAngle' }
                options={ algOpts }
                setOptions={ setAlgOpts }
                validate={ val => val >= 0 && val <= 90 }
                Info={ t( 'heightAngleWhat' ) }
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

    const [options,setOptions] = useState<LayerConfigOptionsHillshading>( editLayer.options as LayerConfigOptionsHillshading );

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

        <SourceRowControl
            options={ options }
            setOptions={ setOptions }
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
            Info={ 'bla blaa ??? info text' }
        />

        <NumericMultiRowControl
            label={ 'Zoom' }
            optKeys={ ['zoomMin','zoomMax'] }
            optLabels={ ['min','max'] }
            options={ options }
            setOptions={ setOptions }
            validate={ val => val >= 0 }
            Info={ 'bla bla ??? info text' }
        />

        <NumericRowControl
            label={ t( 'magnitude' ) }
            optKey={ 'magnitude' }
            options={ options }
            setOptions={ setOptions }
            validate={ val => val > 0 }
            Info={ 'bla bla ??? info text' }
        />

        <NumericRowControl
            label={ t( 'cacheSize' ) }
            optKey={ 'cacheSize' }
            options={ options }
            setOptions={ setOptions }
            validate={ val => val >= 0 }
            Info={ 'bla bla ??? info text' }
        />

    </View>;

};

export default MapLayerControlHillshading;