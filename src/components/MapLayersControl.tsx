/**
 * External dependencies
 */
import {
    Dispatch,
    SetStateAction,
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
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import DraggableGrid from 'react-native-draggable-grid';
import { get } from 'lodash-es';
import rnUuid from 'react-native-uuid';

/**
 * react-native-mapsforge-vtm dependencies
 */
import { LayerHillshading } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { LayerConfig, LayerConfigOptionsAny, LayerOption, MapSettings, MapsforgeProfile, OptionBase } from '../types';
import InfoRowControl from './InfoRowControl';
import ButtonHighlight from './ButtonHighlight';
import ModalWrapper from './ModalWrapper';
import MapLayerControlOnlineRasterXYZ from './MapLayerControlOnlineRasterXYZ';
import { AppContext, SettingsMapsContext } from '../Context';
import MapLayerControlRasterMBTiles from './MapLayerControlRasterMBTiles';
import RadioListItem from './RadioListItem';
import MapLayerControlHillshading from './MapLayerControlHillshading';
import InfoButton from './InfoButton';
import NameRowControl from './NameRowControl';
import MapLayerControlMapsforge from './MapLayerControlMapsforge';


export const mapTypeOptions : LayerOption[] = [
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

const itemHeight = 50;
const labelMinWidth = 90;

const getNewLayer = () : LayerConfig => ( {
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
                ...( null === get( options, 'enabledZoomMin', null ) && { enabledZoomMin: 1 } ),
                ...( null === get( options, 'enabledZoomMax', null ) && { enabledZoomMax: 20 } ),
                ...( null === get( options, 'profile', null ) && { profile: 'default' } ),
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
    style,
} : {
    item: LayerConfig;
    style?: ViewStyle,
} ) => {
    const theme = useTheme();

    const { updateLayer } = useContext( SettingsMapsContext );

    return <TouchableHighlight
        underlayColor={ theme.colors.elevation.level3 }
        onPress={ () => updateLayer && updateLayer( {
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
} : {
    item: LayerConfig;
} ) => {
	const { t } = useTranslation();
    return <InfoRowControl
        label={ t( 'visibility' ) }
        Info={ <Text>{ 'bla bla ??? info text' }</Text> }
    >
        <VisibleControl
            item={ item }
        />
    </InfoRowControl>;
};

const DraggableItem = ( {
    item,
    width,
} : {
    item: LayerConfig;
    width: number;
} ) => {

    const theme = useTheme();

    const {
        setEditLayer,
        updateLayer,
    } = useContext( SettingsMapsContext );

    return setEditLayer && updateLayer ? <View
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

    </View> : null;
};

const MapLayersControl = () => {

    const { width } = useWindowDimensions();
	const { t } = useTranslation();
	const theme = useTheme();

    const {
        editLayer,
        setEditLayer,
        updateLayer,
        layers,
        setLayers,
        saveLayers,

        setEditProfile,
        profiles,
    } = useContext( SettingsMapsContext );

	const [expanded, setExpanded] = useState( true );
	const [modalVisible, setModalVisible] = useState( false );

    useEffect( () => {
        setModalVisible( !! editLayer );
    }, [editLayer] );

    const renderItem = ( item : LayerConfig ) => <View key={ item.key }><DraggableItem
        item={ item }
        width={ width }
    /></View>;

    return <View>

        { editLayer && <ModalWrapper
            visible={ modalVisible }
            onDismiss={ () => {
                setModalVisible( false );
                setEditLayer && setEditLayer( null );
            } }
            header={ editLayer.type ? t( 'map.layerEdit' ) : t( 'map.addNewLayerShort' ) }
        >
            { ! editLayer.type && <View>
                <Text style={ { marginBottom: 18 } }>{ t( 'map.selectType' ) }</Text>

                    { [...mapTypeOptions].map( ( opt : LayerOption, index: number ) => {
                        const onPress = () => {
                            updateLayer && updateLayer( {
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

            { editLayer.type && updateLayer && setEditLayer && setLayers && <View>

                <View style={ { marginBottom: 10, flexDirection: 'row' } }>
                    <Text style={ { minWidth: labelMinWidth + 12 } }>{ t( 'map.mapType' ) }:</Text>
                    <Text>{ editLayer.type }</Text>
                </View>

                <NameRowControl
                    item={ editLayer }
                    update={ updateLayer as ( newItem: { name: string } ) => void }
                    Info={ <Text>{ 'bla blaa ??? info text' }</Text> }
                />

                <VisibleRowControl
                    item={ editLayer }
                />

                { 'online-raster-xyz' === editLayer.type && <MapLayerControlOnlineRasterXYZ
                    editLayer={ editLayer }
                    updateLayer={ updateLayer }
                /> }

                { 'mapsforge' === editLayer.type && <MapLayerControlMapsforge
                    editLayer={ editLayer }
                    updateLayer={ updateLayer }
                    setEditProfile={ setEditProfile }
                    profiles={ profiles }
                /> }

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

        { saveLayers && setEditLayer && setLayers && <List.Accordion
            title={ t( 'map.layer', { count: 0 } ) }
            left={ props => <List.Icon {...props} icon="map" /> }
            expanded={ expanded }
            onPress={ () => {
                if ( expanded ) {
                    saveLayers();
                }
                setExpanded( ! expanded )
            } }
            // style={ expanded ? { marginBottom: 20 } : {} }
        >

            <View style={ {
                height: itemHeight * layers.length + 8 ,
                width,
            } } >
                <DraggableGrid
                    itemHeight={ itemHeight }
                    numColumns={ 1 }
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
                    marginBottom: 25,
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
                    onPress={ () => setEditLayer( getNewLayer() ) }
                >
                    { t( 'map.addNewLayer' ) }
                </ButtonHighlight>
            </View>
        </List.Accordion> }

    </View>;
};

export default MapLayersControl;