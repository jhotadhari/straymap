
/**
 * External dependencies
 */
import {
    useEffect,
    useState,
} from 'react';
import {
	useWindowDimensions,
	View,
    TouchableHighlight,
} from 'react-native';
import {
    List,
	useTheme,
    Text,
    Icon,
    RadioButton,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import DraggableGrid from 'react-native-draggable-grid';

/**
 * Internal dependencies
 */
import { uuid } from '../utils';
import { OptionBase } from '../types';
import ButtonHighlight from './ButtonHighlight';
import ModalWrapper from './ModalWrapper';
import { get } from 'lodash-es';
import MapsControlOnlineRasterXYZ from './MapsControlOnlineRasterXYZ';

type MapConfig = {
    key: string;
    name: string;
    type: null | string;
    visible: boolean;
};

const mapTypeOptions : OptionBase[] = [
    'online-raster-xyz',
    'mapsforge',
    'raster-MBtiles',
    'hillshading',
].map( key => ( {
    key,
    label: 'map.typeDesc.' + key,
} ) );

const initialItems : MapConfig[] = [
    {
        key: 'egal',
        name: 'egal',
        visible: true,
        type: 'online-raster-xyz',
    },
    {
        key: 'auchegal',
        name: 'auch egal',
        visible: true,
        type: 'mapsforge',
    },
    {
        key: 'wirklichegal',
        name: 'wirklich egal',
        visible: false,
        type: 'raster-MBtiles',
    },
    {
        key: 'bla',
        name: 'bla',
        visible: true,
        type: 'hillshading',
    },
];

const itemHeight = 50;

const getNewItem = () : MapConfig => ( {
    key: uuid.create(),
    name: '',
    visible: true,
    type: null,
} );

const DraggableItem = ( {
    item,
    width,
    updateItem,
} : {
    item: MapConfig;
    width: number;
    updateItem: ( newItem: MapConfig ) => void,
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

        <TouchableHighlight
            underlayColor={ theme.colors.elevation.level3 }
            onPress={ () => updateItem( {
                ...item,
                visible: ! item.visible,
            } ) }
            style={ { padding: 10, borderRadius: theme.roundness } }
        >
            <Icon
                source={ item.visible ? 'eye-outline' : 'eye-off-outline' }
                size={ 25 }
            />
        </TouchableHighlight>

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
            onPress={ () => null }
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
    const [items,setItems] = useState<MapConfig[]>( initialItems );

	const { width } = useWindowDimensions();
	const { t } = useTranslation();

	const theme = useTheme();

    // const {
    // } = useContext( AppContext )

	const [expanded, setExpanded] = useState( true );

	const [modalVisible, setModalVisible] = useState( false );
	const [modalDismissable, setModalDismissable] = useState( true );
	const [askToDismiss, setAskToDismiss] = useState( false );

    const [editItem, setEditItem] = useState<null | MapConfig>( null );

    console.log( 'debug editItem', editItem ); // debug

    useEffect( () => {
        if ( editItem ) {
            setModalVisible( true );
        }
    }, [editItem] );

    const updateItem = ( newItem : MapConfig ) => {
        if ( editItem && editItem.key === newItem.key ) {
            setEditItem( newItem );
        }
        const itemIndex = items.findIndex( item => item.key === newItem.key );
        if ( -1 !== itemIndex ) {
            const newItems = [...items];
            newItems[itemIndex] = newItem;
            setItems( newItems );
        }
    };

    const renderItem = ( item : MapConfig ) => <View key={ item.key }><DraggableItem
        item={ item }
        width={ width }
        updateItem={ updateItem }
    /></View>;

    return <View>

        { editItem && <ModalWrapper
            visible={ modalVisible }
            onDismiss={ () => modalDismissable ? setModalVisible( false ) : setAskToDismiss( true ) }
            header={ t( 'settings.mapsAddNew' ) }
            headerPrepend={ editItem.type && <TouchableHighlight
                underlayColor={ theme.colors.elevation.level3 }
                style={ {
                    padding: 5,
                    borderRadius: theme.roundness,
                    marginRight: 10,
                } }
                onPress={ () => {
                    if ( askToDismiss ) {
                        setAskToDismiss( false );
                    } else {
                        updateItem( {
                            ...editItem,
                            type: null,
                        } );
                        setModalDismissable( true );
                    }
                } }
            ><Icon
                source="arrow-left"
                size={ 25 }
            /></TouchableHighlight> }
        >
            { askToDismiss && <View>
                <Text style={ { marginTop: 24, marginBottom: 40 }}>{ t( 'map.askCancel' ) } { t( 'changesWillBeLost' ) }</Text>

                <View style={ {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                } }>

                    <ButtonHighlight
                        onPress={ () => {
                            setAskToDismiss( false );
                        } }
                        mode="contained"
                        buttonColor={ get( theme.colors, 'successContainer' ) }
                        textColor={ get( theme.colors, 'onSuccessContainer' ) }
                    ><Text>{ t( 'keepEdit' ) }</Text></ButtonHighlight>

                    <ButtonHighlight
                        onPress={ () => {
                            setAskToDismiss( false );
                            setEditItem( null );
                            setModalDismissable( true );
                            setModalVisible( false );
                        } }
                        mode="contained"
                        buttonColor={ theme.colors.errorContainer }
                        textColor={ theme.colors.onErrorContainer }
                    ><Text>{ t( 'cancel' ) }</Text></ButtonHighlight>

                </View>
            </View> }

            { ! askToDismiss && ! editItem.type && <View>
                <Text style={ { marginBottom: 18 } }>{ t( 'map.selectType' ) }</Text>

                    { [...mapTypeOptions].map( ( opt : OptionBase, index: number ) => {
                        const onPress = () => {
                            updateItem( { ...editItem, type: opt.key } );
                            setModalDismissable( false );
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

            { ! askToDismiss && editItem.type && <View>
                <Text style={ { marginBottom: 18 } }>{ t( 'map.mapType' ) }: { editItem.type }</Text>


                { 'online-raster-xyz' === editItem.type && <MapsControlOnlineRasterXYZ/> }

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
            title={ t( 'settings.maps' )}
            left={ props => <List.Icon {...props} icon="map" /> }
            expanded={ expanded }
            onPress={ () => setExpanded( ! expanded ) }

        >

            <View style={ {
                height: itemHeight * items.length + 8 ,
                width,
            } } >
                <DraggableGrid
                    itemHeight={ itemHeight }
                    numColumns={ 1 }
                    // renderItem={ DraggableItem }
                    renderItem={ renderItem }
                    data={ items }
                    onDragRelease={ ( newItems : MapConfig[] ) => setItems( newItems ) }
                />
            </View>

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
                    onPress={ () => {
                        setAskToDismiss( false );
                        setEditItem( getNewItem() );
                    } }
                >
                    { t( 'settings.mapsAddNew' ) }
                </ButtonHighlight>
            </View>
        </List.Accordion>

    </View>;
};

export default MapsControl;