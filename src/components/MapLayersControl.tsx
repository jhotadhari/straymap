/**
 * External dependencies
 */
import {
    Dispatch,
    SetStateAction,
    useContext,
    useEffect,
    useState,
} from 'react';
import {
	View,
    TouchableHighlight,
    ViewStyle,
} from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
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
import { LayerConfig, LayerConfigOptionsAny, LayerOption } from '../types';
import InfoRowControl from './generic/InfoRowControl';
import ButtonHighlight from './generic/ButtonHighlight';
import ModalWrapper from './generic/ModalWrapper';
import MapLayerControlOnlineRasterXYZ from './MapLayerControlOnlineRasterXYZ';
import { SettingsMapsContext } from '../Context';
import MapLayerControlRasterMBTiles from './MapLayerControlRasterMBTiles';
import RadioListItem from './generic/RadioListItem';
import MapLayerControlHillshading from './MapLayerControlHillshading';
import InfoButton from './generic/InfoButton';
import NameRowControl from './generic/NameRowControl';
import MapLayerControlMapsforge from './MapLayerControlMapsforge';
import useUiState from '../compose/useUiState';
import { fillLayerConfigOptionsWithDefaults } from '../utils';

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

const VisibleControl = ( {
    item,
    style,
    updateLayer,
} : {
    item: LayerConfig;
    style?: ViewStyle,
    updateLayer?: ( newLayer: LayerConfig ) => void;
} ) => {
    const theme = useTheme();

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
    updateLayer,
} : {
    item: LayerConfig;
    updateLayer?: ( newLayer: LayerConfig ) => void;
} ) => {
	const { t } = useTranslation();
    return <InfoRowControl
        label={ t( 'visibility' ) }
        Info={ t( 'hint.maps.visibility' ) }
    >
        <VisibleControl
            item={ item }
            updateLayer={ updateLayer }
        />
    </InfoRowControl>;
};

const DraggableItem = ( {
    item,
    width,
    reverse,
} : {
    item: LayerConfig;
    width: number;
    reverse: boolean;
} ) => {

    const theme = useTheme();

    const [isToWide,setIsToWide] = useState( false );

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
            flexDirection: reverse ? 'row-reverse' : 'row',
            paddingLeft: reverse ? 14 : 24,
            paddingRight: reverse ? 24 : 14,
        } }
        key={ item.key }
    >

        <VisibleControl
            item={ item }
            updateLayer={ updateLayer }
            style={ {
                padding: 10,
                ...( reverse && { marginRight: -10 } ),
                ...( ! reverse && { marginLeft: -10 } ),
            } }
        />

        <View style={ {
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: reverse ? 'row-reverse' : 'row',
            flexGrow: 1,
            marginLeft: 5,
            marginRight: 5,
        } } >
            <Text>{ item.name }</Text>
            { ! isToWide && <Text>[{ item.type }]</Text>}
        </View>

        <TouchableHighlight
            underlayColor={ theme.colors.elevation.level3 }
            onPress={ () => setEditLayer( item ) }
            style={ { padding: 10, borderRadius: theme.roundness } }
            onLayout={ ( event ) => {
                if (
                    ( reverse && ( event.nativeEvent.layout.x < 0 ) )
                    || ( ! reverse && ( event.nativeEvent.layout.x + event.nativeEvent.layout.width > width ) )
                ) {
                    setIsToWide( true );
                }
            } }

        >
            <Icon
                source="cog"
                size={ 25 }
            />
        </TouchableHighlight>

    </View> : null;
};

const MapLayersControl = ( {
    setScrollEnabled,
    width,
    reverseDraggableItem,
    newLabel,
    uiStateKey = 'mapLayersExpanded',
} : {
    setScrollEnabled: Dispatch<SetStateAction<boolean>>;
    width?: number;
    reverseDraggableItem?: boolean;
    newLabel?: string;
    uiStateKey?: string;
} ) => {

    const { width: width_ } = useSafeAreaFrame();
	width = width ? width : width_;

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

    const {
        value: expanded,
        setValue: setExpanded,
    } = useUiState( uiStateKey );

	const [modalVisible, setModalVisible] = useState( false );

    useEffect( () => {
        setModalVisible( !! editLayer );
    }, [editLayer] );

    const renderItem = ( item : LayerConfig ) => <View key={ item.key }><DraggableItem
        item={ item }
        width={ width }
        reverse={ !! reverseDraggableItem }
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
                    Info={ t( 'hint.nameId' ) }
                />

                <VisibleRowControl
                    item={ editLayer }
                    updateLayer={ updateLayer }
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
            left={ props => <View style={ {
                marginLeft:   7,
                marginRight: -7,
                justifyContent: 'center',
            } }><List.Icon {...props } icon="layers-triple" /></View> }
            expanded={ expanded }
            onPress={ () => {
                if ( expanded ) {
                    saveLayers();
                }
                setExpanded( ! expanded )
            } }
            titleStyle={ theme.fonts.bodyMedium }
            // style={ expanded ? { marginBottom: 20 } : {} }
        >

            <View style={ {
                height: itemHeight * layers.length + 8 ,
                width,
            } } >
                <DraggableGrid
                    style={ {
                        marginLeft: -40, // revert paper paddingLeft 40
                    } }
                    itemHeight={ itemHeight }
                    numColumns={ 1 }
                    renderItem={ renderItem }
                    data={ layers }
                    onDragStart={ () => setScrollEnabled( false ) }
                    onDragRelease={ ( newLayers : LayerConfig[] ) => {
                        setScrollEnabled( true );
                        setLayers( newLayers );
                    } }
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
                    Info={ t( 'hint.maps.layers' ) }
                    buttonProps={ {
                        style: { marginTop: 0, marginBottom: 0, marginLeft: -23 },
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
                    { newLabel }
                </ButtonHighlight>
            </View>
        </List.Accordion> }

    </View>;
};

export default MapLayersControl;