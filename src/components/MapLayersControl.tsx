
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

const mapTypeOptions : OptionBase[] = [
    'online-raster-xyz',
    'mapsforge',
    'raster-MBtiles',
    'hillshading',
].map( key => ( {
    key,
    label: 'map.typeDesc.' + key,
} ) );

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
    updateLayer: ( newItem: LayerConfig ) => void,
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
    updateLayer: ( newItem: LayerConfig ) => void,
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
    updateLayer: ( newItem: LayerConfig ) => void,
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
    updateLayer: ( newItem: LayerConfig ) => void,
    setEditLayer: ( newItem: LayerConfig ) => void,
} ) => {

    const theme = useTheme();

    return <View
        style={ {
            width,
            height: itemHeight,
            justifyContent:'space-between',
            alignItems: 'center',
            flexDirection: 'row',
            marginLeft: -30,
            paddingLeft: 3,
            paddingRight: 18,
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

    const updateLayer = ( newItem : LayerConfig ) => {
        if ( editLayer && editLayer.key === newItem.key ) {
            setEditLayer( newItem );
        }
        const itemIndex = layers.findIndex( item => item.key === newItem.key );
        if ( -1 !== itemIndex ) {
            const newItems = [...layers];
            newItems[itemIndex] = newItem;
            setLayers( newItems );
        } else {
            setLayers( [
                newItem,
                ...layers,
            ] );
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

                    { [...mapTypeOptions].map( ( opt : OptionBase, index: number ) => {
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

                {/* <View style={ { marginTop: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center' } }>
                    <Text style={ { minWidth: labelMinWidth + 12 } }>{ t( 'visibility' ) }</Text>
                    <VisibleControl
                        item={ editLayer }
                        updateLayer={ updateLayer }
                    />
                </View> */}

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

                { 'hillshading' === editLayer.type && <View>

                    {/*
                    source hgtDirPath
                    zoomMin
                    zoomMax
                    shadingAlgorithm
                    shadingAlgorithmOptions
                    magnitude
                    cacheSize */}

                </View> }

                <View style={ { marginTop: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-end' } }>
                    <ButtonHighlight
                        style={ { marginLeft: 'auto' } }
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
                    ><Text>{ t( 'Remove layer' ) }</Text></ButtonHighlight>
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
                    onDragRelease={ ( newItems : LayerConfig[] ) => setLayers( newItems ) }
                />
            </View>

            { ! layers.length && <Text style={ { marginLeft: 18, marginBottom: 35 } } >There are no map layers currently???</Text>}

            <View
                style={ {
                    justifyContent: 'flex-end',
                    flexDirection: 'row',
                } }
            >
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