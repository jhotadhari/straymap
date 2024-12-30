/**
 * External dependencies
 */
import React, {
	Dispatch,
	SetStateAction,
	useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    TouchableHighlight,
    useWindowDimensions,
	View,
} from 'react-native';
import {
	Icon,
	Menu,
	Text,
	useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import rnUuid from 'react-native-uuid';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { AppContext } from '../../Context';
import { GeneralSettings, DashboardElementConf, OptionBase, DashboardStyle } from '../../types';
import ListItemModalControl from '../ListItemModalControl';
import ButtonHighlight from '../ButtonHighlight';
import DraggableGrid from 'react-native-draggable-grid';
import InfoButton from '../InfoButton';
import { defaults, modalWidthFactor } from '../../constants';
import { Dashboard } from '.';
import ModalWrapper from '../ModalWrapper';
import RadioListItem from '../RadioListItem';
import { NumericRowControl } from '../NumericRowControls';
import * as dashboardElementComponents from "./elements";
import MenuItem from '../MenuItem';
import InfoRowControl from '../InfoRowControl';

const itemHeight = 50;

// ??? should construct options from elements
const elementTypeOptions : OptionBase[] = [
    {
        key: 'lineBreak',
        label: 'lineBreak',
    },
    {
        key: 'zoomLevel',
        label: 'zoomLevel',
    },
    {
        key: 'centerCoordinates',
        label: 'centerCoordinates',
    },
    {
        key: 'centerAltitude',
        label: 'centerAltitude',
    },
];

const styleAlignOptions : OptionBase[] = [
    {
        key: 'center',
        label: 'center',
    },
    {
        key: 'left',
        label: 'left',
    },
    {
        key: 'right',
        label: 'right',
    },
    {
        key: 'around',
        label: 'around',
    },
    {
        key: 'between',
        label: 'between',
    },
    {
        key: 'evenly',
        label: 'evenly',
    },
];

const getDefaultWidth = ( key?: string | null ) => {
    switch( key ) {
        case 'centerCoordinates':
            return 200;
        default:
            return 75;
    };
};

const getNewElement = () : DashboardElementConf => ( {
    key: rnUuid.v4(),
    type: null,
} );

const DraggableItem = ( {
    item,
    width,
    setEditElement,
} : {
    item: DashboardElementConf;
    width: number;
    setEditElement: Dispatch<SetStateAction<null | DashboardElementConf>>;
} ) => {

    const { t } = useTranslation();
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

        <View style={ {
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'row',
            flexGrow: 1,
            marginLeft: 5,
            marginRight: 5,
        } } >
            <Text>[{ t( get( elementTypeOptions.find( opt => opt.key === item.type ), 'label', '' ) ) }]</Text>
        </View>

        <TouchableHighlight
            underlayColor={ theme.colors.elevation.level3 }
            onPress={ () => setEditElement( item ) }
            style={ { padding: 10, borderRadius: theme.roundness } }
        >
            <Icon
                source="cog"
                size={ 25 }
            />
        </TouchableHighlight>

    </View>;
};

const StyleControl = ( {
    editElement,
    updateElement,
} : {
    editElement: null | DashboardElementConf;
    updateElement: ( newElement : DashboardElementConf ) => void;
} ) => {

	const { t } = useTranslation();
    const theme = useTheme();

    const presetStyle = () => {
        if ( ! editElement?.style ) {
            const newEditElement = {
                ...editElement,
                style: {
                    fontSize: theme.fonts.bodyMedium.fontSize,
                    minWidth: getDefaultWidth( editElement?.type ),
                },
            };
            updateElement( newEditElement as DashboardElementConf );
        }
    };
    useEffect( () => presetStyle(), [] );
    useEffect( () => presetStyle(), [editElement?.style] );

    return editElement?.style ? <View>
        <NumericRowControl
            label={ t( 'fontSize' ) }
            optKey={ 'fontSize' }
            options={ get( editElement, 'style', {} ) }
            setOptions={ newStyle => {
                const newEditElement = {
                    ...editElement,
                    style: newStyle,
                };
                updateElement( newEditElement as DashboardElementConf );
            } }
            validate={ val => val > 0 }
        />

        <NumericRowControl
            label={ t( 'minWidth' ) }
            optKey={ 'minWidth' }
            options={ get( editElement, 'style', {} ) }
            setOptions={ newStyle => {
                const newEditElement = {
                    ...editElement,
                    style: newStyle,
                };
                updateElement( newEditElement as DashboardElementConf );
            } }
            validate={ val => val >= 0 }
        />
    </View> : null;
};

const DashboardControl = () => {

	const { width } = useWindowDimensions();
    const theme = useTheme();
	const { t } = useTranslation();

	const {
		generalSettings,
		setGeneralSettings,
		currentMapEvent,
	} = useContext( AppContext );

    const [menuVisible,setMenuVisible] = useState( false );

	const [dashboardElementConfigs,setDashboardElementConfigs] = useState<DashboardElementConf[] >( get( generalSettings, ['dashboardElements','elements'], defaults.generalSettings.dashboardElements.elements ) );
	const dashboardElementConfigRef = useRef( dashboardElementConfigs );
    useEffect( () => {
        dashboardElementConfigRef.current = dashboardElementConfigs;
    }, [dashboardElementConfigs] );

	const [dashboardStyle,setDashboardStyle] = useState<DashboardStyle>( get( generalSettings, ['dashboardElements','style'], defaults.generalSettings.dashboardElements.style ) );
	const dashboardStyleRef = useRef( dashboardStyle );
    useEffect( () => {
        dashboardStyleRef.current = dashboardStyle;
    }, [dashboardStyle] );

    const save = () => generalSettings && setGeneralSettings && setGeneralSettings( ( generalSettings: GeneralSettings ) => ( {
        ...generalSettings,
        ...( dashboardElementConfigRef.current && { dashboardElements: {
            ...get( generalSettings, 'dashboardElements' ),
            elements: dashboardElementConfigRef.current,
            style: dashboardStyleRef.current,
        } } ),
    } ) );
    useEffect( () => save, [] );    // Save on unmount.

    const [editElement, setEditElement] = useState<null | DashboardElementConf>( null );

	const [modalVisible, setModalVisible] = useState( false );

    useEffect( () => {
        setModalVisible( !! editElement );
    }, [editElement] );

    const updateElement = ( newElement : DashboardElementConf ) => {
        if ( editElement && editElement.key === newElement.key ) {
            setEditElement( ( editElement: ( null | DashboardElementConf ) ) => editElement
                ? {...editElement, ...newElement}
                : null
            );
        }
        const itemIndex = dashboardElementConfigs.findIndex( item => item.key === newElement.key );
        if ( -1 !== itemIndex ) {
            const newElements = [...dashboardElementConfigs];
            newElements[itemIndex] = newElement;
            setDashboardElementConfigs( newElements );
        } else {
            const newElements = [...dashboardElementConfigs, newElement];
            setDashboardElementConfigs( newElements );
        }
    };

    const renderItem = ( item : DashboardElementConf ) => <View key={ item.key }><DraggableItem
        item={ item }
        setEditElement={ setEditElement }
        width={ width * modalWidthFactor }
    /></View>;

    const ControlComponent = editElement && editElement?.type
        ? get( dashboardElementComponents, [editElement.type as string,'ControlComponent'] )
        : null

	return <View>

        { editElement && <ModalWrapper
            visible={ modalVisible }
            modalStyle={ {
                marginTop: -60, // ??? why -60?
            } }
            backgroundBlur={ false }
            onDismiss={ () => {
                setModalVisible( false );
                setEditElement( null );
            } }
            header={ editElement.type
                ? sprintf( t( 'edit"X"' ), t( get( elementTypeOptions.find( opt => opt.key === editElement.type ), 'label', '' ) ) )
                : t( 'dashboardElementNew' )
            }
        >
            { ! editElement.type && <View>
                <Text style={ { marginBottom: 18 } }>{ sprintf( t( 'selectXType' ), t( 'dashboardElement') ) }</Text>

                    { [...elementTypeOptions].map( ( opt : OptionBase, index: number ) => {
                        const onPress = () => {
                            updateElement( {
                                ...editElement,
                                type: opt.key,
                            } );
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

            { editElement.type && <View>

                { ControlComponent && <ControlComponent
                    editElement={ editElement }
                    updateElement={ updateElement }
                    unitPrefs={ generalSettings?.unitPrefs }
                /> }

                { get( dashboardElementComponents, [editElement.type as string,'hasStyleControl'] ) && <StyleControl
                    editElement={ editElement }
                    updateElement={ updateElement }
                /> }

            </View> }

            { editElement.type && <View style={ { marginTop: 20, marginBottom: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } }>
                <ButtonHighlight
                    onPress={ () => {
                        setEditElement( null );
                        setModalVisible( false );
                    } }
                    mode="contained"
                    buttonColor={ get( theme.colors, 'successContainer' ) }
                    textColor={ get( theme.colors, 'onSuccessContainer' ) }
                ><Text>{ t( 'ok' ) }</Text></ButtonHighlight>

                <ButtonHighlight
                    onPress={ () => {
                        const layerIndex = dashboardElementConfigs.findIndex( element => element.key === editElement.key )
                        if ( layerIndex !== -1 ) {
                            const newElements = [...dashboardElementConfigs];
                            newElements.splice( layerIndex, 1 );
                            setDashboardElementConfigs( newElements );
                            setEditElement( null );
                            setModalVisible( false );
                        }
                    } }
                    mode="contained"
                    buttonColor={ theme.colors.errorContainer }
                    textColor={ theme.colors.onErrorContainer }
                ><Text>{ sprintf( t( 'removeX' ), t( 'element', { count: 1 } ) ) }</Text></ButtonHighlight>
            </View> }

        </ModalWrapper> }

        <ListItemModalControl
            anchorLabel={ t( 'dashboardElement', { count: 0 } ) }
            anchorIcon={ ( { color, style } ) => <MaterialIcons style={ style } name="dashboard" size={ 25 } color={ color } /> }
            header={ t( 'dashboardElement', { count: 0 } ) }
            hasHeaderBackPress={ true }
            belowModal={ currentMapEvent && generalSettings?.unitPrefs ? <View style={ {
                width,
                marginTop: 20,
                borderColor: theme.colors.outline,
                borderWidth: 1,
                borderRadius: theme.roundness,
            } } >
                <Dashboard
                    elements={ dashboardElementConfigs }
                    dashboardStyle={ dashboardStyle }
                    currentMapEvent={ currentMapEvent }
                    unitPrefs={ generalSettings?.unitPrefs }
                />
            </View> : null }
        >

            <View style={ {
                height: itemHeight * dashboardElementConfigs.length + 8,
                width: width * modalWidthFactor,
            } } >
                <DraggableGrid
                    itemHeight={ itemHeight }
                    numColumns={ 1 }
                    renderItem={ renderItem }
                    data={ dashboardElementConfigs.filter( el => !! el.key ) }
                    onDragRelease={ ( newElements : DashboardElementConf[] ) => setDashboardElementConfigs( newElements ) }
                />
            </View>

            { ! dashboardElementConfigs.length && <Text style={ { marginLeft: 18, marginBottom: 35 } } >{ t( 'dashboardElementsNone' ) }</Text> }

            <View
                style={ {
                    justifyContent: 'space-between',
                    flexDirection: 'row',
                    marginBottom: 25,
                    // width: width * modalWidthFactor,
                } }
            >

                <InfoButton
                    label={ t( 'dashboardElement', { count: 0 } ) }
                    headerPlural={ true }
                    backgroundBlur={ false }
                    Info={ <Text>{ 'bla bla ??? info text' }</Text> }
                    buttonProps={ {
                        style: { marginTop: 0, marginBottom: 0 },
                        icon: "information-variant",
                        mode: "outlined",
                        iconColor: theme.colors.primary,
                    } }
                />

                <ButtonHighlight
                    // style={ { marginRight: 20 } }
                    icon={ ( { color } ) => <MaterialIcons name="dashboard-customize" size={ 25 } color={ color } /> }
                    mode="outlined"
                    onPress={ () => setEditElement( getNewElement() ) }
                >
                    { t( 'dashboardElementNew' ) }
                </ButtonHighlight>
            </View>

            <InfoRowControl
                label={ t( 'alignment' ) }
                // Info={ <Text>{ 'bla bla ??? info text' }</Text> }
                style={ { marginTop: 0, marginBottom: 0 } }
            >
                <Menu
                    contentStyle={ {
                        borderColor: theme.colors.outline,
                        borderWidth: 1,
                    } }
                    visible={ menuVisible }
                    onDismiss={ () => setMenuVisible( false ) }
                    anchor={ <ButtonHighlight style={ { marginTop: 3, alignItems: 'flex-start' } } onPress={ () => setMenuVisible( true ) } >
                        <Text>{ t( get( styleAlignOptions.find( opt => opt.key === dashboardStyle.align ), 'label', '' ) ) }</Text>
                    </ButtonHighlight> }
                >
                    { styleAlignOptions && [...styleAlignOptions].map( opt => <MenuItem
                        key={ opt.key }
                        onPress={ () => {
                            setMenuVisible( false );
                            setDashboardStyle( {
                                ...dashboardStyle,
                                align: opt.key,

                            } );
                        } }
                        title={ t( opt.label ) }
                        active={ opt.key === dashboardStyle.align }
                    /> ) }
                </Menu>
            </InfoRowControl>

        </ListItemModalControl>

    </View>;
};

export default DashboardControl;