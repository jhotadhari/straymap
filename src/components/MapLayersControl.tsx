/**
 * External dependencies
 */
import {
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
	useWindowDimensions,
	View,
    TouchableHighlight,
    ViewStyle,
} from 'react-native';
import {
    List,
	useTheme,
    Text,
    Icon,
    TextInput,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import DraggableGrid from 'react-native-draggable-grid';
import { debounce, get } from 'lodash-es';
import rnUuid from 'react-native-uuid';

/**
 * react-native-mapsforge-vtm dependencies
 */
import { LayerHillshading } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { LayerConfig, LayerConfigOptionsAny, OptionBase } from '../types';
import InfoRowControl from './InfoRowControl';
import ButtonHighlight from './ButtonHighlight';
import ModalWrapper from './ModalWrapper';
import MapLayerControlOnlineRasterXYZ from './MapLayerControlOnlineRasterXYZ';
import { AppContext } from '../Context';
import MapLayerControlRasterMBTiles from './MapLayerControlRasterMBTiles';
import RadioListItem from './RadioListItem';
import MapLayerControlHillshading from './MapLayerControlHillshading';
import InfoButton from './InfoButton';

type LayerType = 'base' | 'overlay';

interface LayerOption extends OptionBase {
    type: LayerType;
};

const mapTypeOptions : LayerOption[] = [
    {
        key: 'online-raster-xyz',
        type: 'base' as LayerOption['type'],
    },
    {
        key: 'mapsforge',
        type: 'base' as LayerOption['type'],
    },
    {
        key: 'raster-MBtiles',
        type: 'base' as LayerOption['type'],
    },
    {
        key: 'hillshading',
        type: 'overlay' as LayerOption['type'],
    },
].map( opt => ( {
    ...opt,
    label: 'map.typeDesc.' + opt.key,
} ) );

const getLayerType = ( layer : LayerConfig ) : ( LayerType | null ) => get( mapTypeOptions.find( opt => opt.key === layer.type ), 'type', null );

const itemHeight = 50;
const labelMinWidth = 90;

const getNewItem = () : LayerConfig => ( {
    key: rnUuid.v4(),
    name: '',
    visible: true,
    type: null,
    options: {},
} );

const fillLayerConfigOptionsWithDefaults = ( type : string, options : LayerConfigOptionsAny ) : LayerConfigOptionsAny => {
    switch( type ) {
        case 'online-raster-xyz':
            return {
                ...options,
                ...( null === get( options, 'cacheSize', null ) && { cacheSize: 0 } ),
                ...( null === get( options, 'zoomMin', null ) && { zoomMin: 1 } ),
                ...( null === get( options, 'zoomMax', null ) && { zoomMax: 20 } ),
                ...( null === get( options, 'enabledZoomMin', null ) && { enabledZoomMin: 1 } ),
                ...( null === get( options, 'enabledZoomMax', null ) && { enabledZoomMax: 20 } ),
            };
        case 'mapsforge':
            return {
                ...options,
            };
        case 'raster-MBtiles':
            return {
                ...options,
                ...( null === get( options, 'enabledZoomMin', null ) && { enabledZoomMin: 1 } ),
                ...( null === get( options, 'enabledZoomMax', null ) && { enabledZoomMax: 20 } ),
            };
        case 'hillshading':
            return {
                ...options,
                ...( null === get( options, 'cacheSize', null ) && { cacheSize: 0 } ),
                ...( null === get( options, 'zoomMin', null ) && { zoomMin: 1 } ),
                ...( null === get( options, 'zoomMax', null ) && { zoomMax: 20 } ),
                ...( null === get( options, 'enabledZoomMin', null ) && { enabledZoomMin: 1 } ),
                ...( null === get( options, 'enabledZoomMax', null ) && { enabledZoomMax: 20 } ),
                ...( null === get( options, 'magnitude', null ) && { magnitude: 90 } ),
                ...( null === get( options, 'shadingAlgorithm', null ) && { shadingAlgorithm: Object.values( LayerHillshading.shadingAlgorithms )[0] } ),
                ...( null === get( options, 'shadingAlgorithmOptions', null ) && { shadingAlgorithmOptions: {
                    linearity: 0.1,
                    scale: 0.666,
                    heightAngle: 50,
                } } ),
            };
        default:
            return options;
    }
};

const VisibleControl = ( {
    item,
    updateLayer,
    style,
} : {
    item: LayerConfig;
    updateLayer: ( newLayer: LayerConfig ) => void,
    style?: ViewStyle,
} ) => {
    const theme = useTheme();
    return <TouchableHighlight
        underlayColor={ theme.colors.elevation.level3 }
        onPress={ () => updateLayer( {
            ...item,
            visible: ! item.visible,
        } ) }
        style={ { borderRadius: theme.roundness, ...style } }
    >
        <Icon
            source={ item.visible ? 'eye-outline' : 'eye-off-outline' }
            size={ 25 }
        />
    </TouchableHighlight>;
};

const VisibleRowControl = ( {
    item,
    updateLayer,
} : {
    item: LayerConfig;
    updateLayer: ( newLayer: LayerConfig ) => void,
} ) => {
	const { t } = useTranslation();
    return <InfoRowControl
        label={ t( 'visibility' ) }
        Info={ <Text>{ 'bla bla ??? info text' }</Text> }
    >
        <VisibleControl
            item={ item }
            updateLayer={ updateLayer }
        />
    </InfoRowControl>;
};

const NameRowControl = ( {
    item,
    updateLayer,
} : {
    item: LayerConfig;
    updateLayer: ( newLayer: LayerConfig ) => void,
} ) => {
    const theme = useTheme();
    const [value,setValue] = useState( item.name );
    const doUpdate = debounce( () => {
        updateLayer( {
            ...item,
            name: value,
        } );
    }, 300 );
    useEffect( () => {
        doUpdate();
    }, [value] );

    return <InfoRowControl
        label={ 'Name/ID' }
        Info={ <Text>{ 'bla bla ??? info text' }</Text> }
    >
        <TextInput
            style={ { flexGrow: 1 } }
            underlineColor="transparent"
            dense={ true }
            theme={ { fonts: { bodyLarge: {
                ...theme.fonts.bodySmall,
                fontFamily: "sans-serif",
            } } } }
            onChangeText={ newVal => setValue( newVal ) }
            value={ value }
        />
    </InfoRowControl>;
};

const DraggableItem = ( {
    item,
    width,
    updateLayer,
    setEditLayer,
} : {
    item: LayerConfig;
    width: number;
    updateLayer: ( newLayer: LayerConfig ) => void,
    setEditLayer: ( newLayer: LayerConfig ) => void,
} ) => {

    const theme = useTheme();

    return <View
        style={ {
            width,
            height: itemHeight,
            justifyContent:'space-between',
            alignItems: 'center',
            flexDirection: 'row',
            marginLeft: -34,
            paddingLeft: 3,
            paddingRight: 17,
        } }
        key={ item.key }
    >

        <VisibleControl
            item={ item }
            updateLayer={ updateLayer }
            style={ { padding: 10 } }
        />

        <View style={ {
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'row',
            flexGrow: 1,
            marginLeft: 5,
            marginRight: 5,
        } } >
            <Text>{ item.name }</Text>
            <Text>[{ item.type }]</Text>
        </View>

        <TouchableHighlight
            underlayColor={ theme.colors.elevation.level3 }
            onPress={ () => setEditLayer( item ) }
            style={ { padding: 10, borderRadius: theme.roundness } }
        >
            <Icon
                source="cog"
                size={ 25 }
            />
        </TouchableHighlight>

    </View>;
};

const MapLayersControl = () => {

    const { width } = useWindowDimensions();
	const { t } = useTranslation();
	const theme = useTheme();

    const {
		mapSettings,
		setMapSettings,
    } = useContext( AppContext );

    const [layers,setLayers] = useState<LayerConfig[]>( mapSettings?.layers || [] );
    const layersRef = useRef<LayerConfig[]>( layers );
    useEffect( () => {
        layersRef.current = layers;
    }, [layers])
    const save = () => mapSettings && setMapSettings && setMapSettings( {
        ...mapSettings,
        layers: layersRef.current,
    } );
    useEffect( () => save, [] );    // Save on unmount.

	const [expanded, setExpanded] = useState( true );
	const [modalVisible, setModalVisible] = useState( false );
    const [editLayer, setEditLayer] = useState<null | LayerConfig>( null );

    useEffect( () => {
        if ( editLayer ) {
            setModalVisible( true );
        }
    }, [editLayer] );

    const updateLayer = ( newLayer : LayerConfig ) => {
        if ( editLayer && editLayer.key === newLayer.key ) {
            setEditLayer( newLayer );
        }
        const itemIndex = layers.findIndex( item => item.key === newLayer.key );
        if ( -1 !== itemIndex ) {
            const newLayers = [...layers];
            newLayers[itemIndex] = newLayer;
            setLayers( newLayers );
        } else {
            let insertIndex = 0;
            if ( 'base' === getLayerType( newLayer ) ) {
                const indexFirstBase = layers.findIndex( layer => 'base' === getLayerType( layer ) );
                insertIndex = indexFirstBase !== -1 ? indexFirstBase : insertIndex;
            }
            const newLayers = [...layers];
            newLayers.splice(
                insertIndex,
                0,
                newLayer
            );
            setLayers( newLayers );
        }
    };

    const renderItem = ( item : LayerConfig ) => <View key={ item.key }><DraggableItem
        item={ item }
        width={ width }
        updateLayer={ updateLayer }
        setEditLayer={ setEditLayer }
    /></View>;

    return <View>

        { editLayer && <ModalWrapper
            visible={ modalVisible }
            onDismiss={ () => {
                setModalVisible( false );
                setEditLayer( null );
            } }
            header={ editLayer.type ? t( 'map.layerEdit' ) : t( 'map.addNewLayerShort' ) }
        >
            { ! editLayer.type && <View>
                <Text style={ { marginBottom: 18 } }>{ t( 'map.selectType' ) }</Text>

                    { [...mapTypeOptions].map( ( opt : LayerOption, index: number ) => {
                        const onPress = () => {
                            updateLayer( {
                                ...editLayer,
                                type: opt.key,
                                options: fillLayerConfigOptionsWithDefaults( opt.key, editLayer.options ),
                            } );
                            // setModalDismissable( false );
                        };
                        return <RadioListItem
                            key={ opt.key }
                            opt={ opt }
                            onPress={ onPress }
                            labelExtractor={ a => a.key }
                            descExtractor={ a => a.label }
                        />;
                    } ) }
            </View> }

            { editLayer.type && <View>

                <View style={ { marginBottom: 10, flexDirection: 'row' } }>
                    <Text style={ { minWidth: labelMinWidth + 12 } }>{ t( 'map.mapType' ) }:</Text>
                    <Text>{ editLayer.type }</Text>
                </View>

                <NameRowControl
                    item={ editLayer }
                    updateLayer={ updateLayer }
                />

                <VisibleRowControl
                    item={ editLayer }
                    updateLayer={ updateLayer }
                />

                { 'online-raster-xyz' === editLayer.type && <MapLayerControlOnlineRasterXYZ
                    editLayer={ editLayer }
                    updateLayer={ updateLayer }
                /> }

                { 'mapsforge' === editLayer.type && <View>

                    {/*
                    source mapFile
                    renderTheme
                    renderStyle
                    renderOverlays
                    zoomMin
                    zoomMax */}

                </View> }

                { 'raster-MBtiles' === editLayer.type && <MapLayerControlRasterMBTiles
                    editLayer={ editLayer }
                    updateLayer={ updateLayer }
                /> }

                { 'hillshading' === editLayer.type && <MapLayerControlHillshading
                    editLayer={ editLayer }
                    updateLayer={ updateLayer }
                /> }

                <View style={ { marginTop: 20, marginBottom: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } }>

                    <ButtonHighlight
                        onPress={ () => {
                            setEditLayer( null );
                            setModalVisible( false );
                        } }
                        mode="contained"
                        buttonColor={ get( theme.colors, 'successContainer' ) }
                        textColor={ get( theme.colors, 'onSuccessContainer' ) }
                    ><Text>{ t( 'ok' ) }</Text></ButtonHighlight>

                    <ButtonHighlight
                        onPress={ () => {
                            const layerIndex = layers.findIndex( layer => layer.key === editLayer.key )
                            if ( layerIndex !== -1 ) {
                                const newLayers = [...layers];
                                newLayers.splice( layerIndex, 1 );
                                setLayers( newLayers );
                                setEditLayer( null );
                                setModalVisible( false );
                            }
                        } }
                        mode="contained"
                        buttonColor={ theme.colors.errorContainer }
                        textColor={ theme.colors.onErrorContainer }
                    ><Text>{ t( 'map.layerRemove' ) }</Text></ButtonHighlight>
                </View>

            </View> }

        </ModalWrapper> }

        <List.Accordion
            title={ t( 'map.layer', { count: 0 } ) }
            left={ props => <List.Icon {...props} icon="map" /> }
            expanded={ expanded }
            onPress={ () => {
                if ( expanded ) {
                    save();
                }
                setExpanded( ! expanded )
            } }
        >

            <View style={ {
                height: itemHeight * layers.length + 8 ,
                width,
            } } >
                <DraggableGrid
                    itemHeight={ itemHeight }
                    numColumns={ 1 }
                    // renderItem={ DraggableItem }
                    renderItem={ renderItem }
                    data={ layers }
                    onDragRelease={ ( newLayers : LayerConfig[] ) => setLayers( newLayers ) }
                />
            </View>

            { ! layers.length && <Text style={ { marginLeft: 18, marginBottom: 35 } } >{ t( 'map.layersNone' ) }</Text>}

            <View
                style={ {
                    justifyContent: 'space-between',
                    flexDirection: 'row',
                } }
            >

                <InfoButton
                    label={ t( 'map.layer', { count: 0 } ) }
                    headerPlural={ true }
                    backgroundBlur={ true }
                    Info={ <Text>{ 'bla bla ??? info text' }</Text> }
                    buttonProps={ {
                        style: { marginTop: 0, marginBottom: 0, marginLeft: -30 },
                        icon: "information-variant",
                        mode: "outlined",
                        iconColor: theme.colors.primary,
                    } }
                />

                <ButtonHighlight
                    style={ { marginRight: 20 } }
                    icon="map-plus"
                    mode="outlined"
                    onPress={ () => setEditLayer( getNewItem() ) }
                >
                    { t( 'map.addNewLayer' ) }
                </ButtonHighlight>
            </View>
        </List.Accordion>

    </View>;
};

export default MapLayersControl;