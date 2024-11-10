
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
    RadioButton,
    TextInput,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import DraggableGrid from 'react-native-draggable-grid';

/**
 * Internal dependencies
 */
import { uuid } from '../utils';
import { MapConfig, MapConfigOptionsAny, OptionBase } from '../types';
import ButtonHighlight from './ButtonHighlight';
import ModalWrapper from './ModalWrapper';
import { debounce, get } from 'lodash-es';
import MapsControlOnlineRasterXYZ from './MapsControlOnlineRasterXYZ';
import { AppContext } from '../Context';

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

const getNewItem = () : MapConfig => ( {
    key: uuid.create(),
    name: '',
    visible: false,
    type: null,
    options: {
        zoomMin: 1,
        zoomMax: 20,
    },
} );

const fillMapConfigOptionsWithDefauls = ( type : string, options : MapConfigOptionsAny ) : MapConfigOptionsAny => {
    switch( type ) {
        case 'online-raster-xyz':
            return {
                ...options,
                ...( null === get( options, 'cacheSize', null ) && { cacheSize: 0 } ),
            };
        case 'mapsforge':
            return {
                ...options,
            };
        case 'raster-MBtiles':
            return {
                ...options,
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
    updateItem,
    style,
} : {
    item: MapConfig;
    updateItem: ( newItem: MapConfig ) => void,
    style?: ViewStyle,
} ) => {
    const theme = useTheme();
    return <TouchableHighlight
        underlayColor={ theme.colors.elevation.level3 }
        onPress={ () => updateItem( {
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

const NameControl = ( {
    item,
    updateItem,
} : {
    item: MapConfig;
    updateItem: ( newItem: MapConfig ) => void,
} ) => {
    const theme = useTheme();

    const [value,setValue] = useState( item.name );

    const doUpdate = debounce( () => {
        updateItem( {
            ...item,
            name: value,
        } );
    }, 300 );
    useEffect( () => {
        doUpdate();
    }, [value] );

    return <View style={ { marginTop: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center' } }>
        <Text style={ { minWidth: labelMinWidth + 12 } }>Name/ID:</Text>
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
    </View>;
};

const DraggableItem = ( {
    item,
    width,
    updateItem,
    setEditItem,
} : {
    item: MapConfig;
    width: number;
    updateItem: ( newItem: MapConfig ) => void,
    setEditItem: ( newItem: MapConfig ) => void,
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
            updateItem={ updateItem }
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
            onPress={ () => setEditItem( item ) }
            style={ { padding: 10, borderRadius: theme.roundness } }
        >
            <Icon
                source="cog"
                size={ 25 }
            />
        </TouchableHighlight>

    </View>;
};

const MapsControl = () => {

    const { width } = useWindowDimensions();
	const { t } = useTranslation();
	const theme = useTheme();

    const {
		mapSettings,
		setMapSettings,
    } = useContext( AppContext );

    const [layers,setLayers] = useState<MapConfig[]>( mapSettings?.layers || [] );
    const layersRef = useRef<MapConfig[]>( layers );
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
    const [editItem, setEditItem] = useState<null | MapConfig>( null );

    useEffect( () => {
        if ( editItem ) {
            setModalVisible( true );
        }
    }, [editItem] );

    const updateItem = ( newItem : MapConfig ) => {
        if ( editItem && editItem.key === newItem.key ) {
            setEditItem( newItem );
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

    const renderItem = ( item : MapConfig ) => <View key={ item.key }><DraggableItem
        item={ item }
        width={ width }
        updateItem={ updateItem }
        setEditItem={ setEditItem }
    /></View>;

    return <View>

        { editItem && <ModalWrapper
            visible={ modalVisible }
            onDismiss={ () => {
                setModalVisible( false );
                setEditItem( null );
            } }
            header={ editItem.type ? t( 'map.layerEdit' ) : t( 'map.addNewLayerShort' ) }
        >
            { ! editItem.type && <View>
                <Text style={ { marginBottom: 18 } }>{ t( 'map.selectType' ) }</Text>

                    { [...mapTypeOptions].map( ( opt : OptionBase, index: number ) => {
                        const onPress = () => {
                            updateItem( {
                                ...editItem,
                                type: opt.key,
                                options: fillMapConfigOptionsWithDefauls( opt.key, editItem.options ),
                            } );
                            // setModalDismissable( false );
                        };
                        return <TouchableHighlight
                            key={ opt.key }
                            onPress={ onPress }
                            underlayColor={ theme.colors.elevation.level3 }

                            style={ {
                                padding: 6,
                                marginLeft: -6,
                                marginRight: -6,
                                borderRadius: theme.roundness,
                            } }
                        >
                            <View
                                style={ {
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                } }
                            >
                                <View style={ { flexGrow: 1} }>
                                    <Text style={ { ...theme.fonts.bodyLarge } } >{ t( opt.key ) }</Text>
                                    <Text style={ { ...theme.fonts.bodySmall } } >{ t( opt.label ) }</Text>
                                </View>
                                <RadioButton value={ opt.key } onPress={ onPress } />
                            </View>
                        </TouchableHighlight>
                    } ) }
            </View> }

            { editItem.type && <View>

                <View style={ { marginBottom: 10, flexDirection: 'row' } }>
                    <Text style={ { minWidth: labelMinWidth + 12 } }>{ t( 'map.mapType' ) }:</Text>
                    <Text>{ editItem.type }</Text>
                </View>

                <NameControl
                    item={ editItem }
                    updateItem={ updateItem }
                />

                <View style={ { marginTop: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center' } }>
                    <Text style={ { minWidth: labelMinWidth + 12 } }>{ t( 'visibility' ) }:</Text>
                    <VisibleControl
                        item={ editItem }
                        updateItem={ updateItem }
                    />
                </View>

                { 'online-raster-xyz' === editItem.type && <MapsControlOnlineRasterXYZ
                    editItem={ editItem }
                    updateItem={ updateItem }
                /> }

                { 'mapsforge' === editItem.type && <View>

                    {/*
                    source mapFile
                    renderTheme
                    renderStyle
                    renderOverlays
                    zoomMin
                    zoomMax */}

                </View> }

                { 'raster-MBtiles' === editItem.type && <View>

                    {/*
                    source mapFile
                    zoomMin
                    zoomMax */}

                </View> }

                { 'hillshading' === editItem.type && <View>

                    {/*
                    source hgtDirPath
                    zoomMin
                    zoomMax
                    shadingAlgorithm
                    shadingAlgorithmOptions
                    magnitude
                    cacheSize */}

                </View> }


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
                    onDragRelease={ ( newItems : MapConfig[] ) => setLayers( newItems ) }
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
                    onPress={ () => setEditItem( getNewItem() ) }
                >
                    { t( 'map.addNewLayer' ) }
                </ButtonHighlight>
            </View>
        </List.Accordion>

    </View>;
};

export default MapsControl;