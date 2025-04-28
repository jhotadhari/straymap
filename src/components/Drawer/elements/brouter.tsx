/**
 * External dependencies
 */
import React, { useContext, useState } from 'react';
import {
    Button,
    Icon,
    Menu,
    Text,
    useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { PixelRatio, ScrollView, TextStyle, View } from "react-native";
import rnUuid from 'react-native-uuid';
import { MapEventResponse, MapLayerMarkerModule, MapLayerPathSlopeGradientModule } from 'react-native-mapsforge-vtm';
import formatcoords from 'formatcoords';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

/**
 * Internal dependencies
 */
import IconIcomoon from '../../generic/IconIcomoon';
import { AppContext, RoutingContext } from '../../../Context';
import { get, pick } from 'lodash-es';
import MenuItem from '../../generic/MenuItem';
import ButtonHighlight from '../../generic/ButtonHighlight';
import { DrawerState } from '../../../types';
import ModalWrapper from '../../generic/ModalWrapper';
import { sprintf } from 'sprintf-js';

const DisplayComponent = ({
	drawerWidth,
	drawerHeight,
	drawerSide,
	expand,
} : {
	drawerWidth: number;
	drawerHeight: number;
	drawerSide: string;
    expand: DrawerState['expand'];
} ) => {


    const {
        savedExported,
        setSavedExported,
        isRouting,
        setIsRouting,
        points,
        segments,
    } = useContext( RoutingContext );

    const theme = useTheme();
    const { t } = useTranslation();

	const [modalVisible, setModalVisible] = useState( false );
    const [scrollEnabled,setScrollEnabled] = useState( true );

    return <ScrollView
        scrollEnabled={ scrollEnabled }
        style={ {
            backgroundColor: theme.colors.background,
            height: drawerHeight,
            width: drawerWidth,
            position: 'absolute',
            marginTop: 3,
            paddingHorizontal: 20
        } }
    >

        { modalVisible && <ModalWrapper
            visible={ modalVisible }
            onDismiss={ () => setModalVisible( false ) }
            onHeaderBackPress={ () => setModalVisible( false ) }
            header={ 'sicher???' }
        >
            <View style={ { marginTop: 20 } }>
                <Text style={ { marginBottom: 20 } }>{ 'sicher das du routing abbrechen möchtest???' }</Text>
                { Object.keys( savedExported || {} ).map( key => ! get( savedExported, key )
                    ? <Text key={ key } style={ { marginBottom: 20 } }>{ sprintf( 'The route is not %s. ???', key ) }</Text>
                    : null
                ) }
            </View>

            <View style={ { marginTop: 20, marginBottom: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } }>
                <ButtonHighlight
                    onPress={ () => setModalVisible( false ) }
                    mode="contained"
                    buttonColor={ get( theme.colors, 'successContainer' ) }
                    textColor={ get( theme.colors, 'onSuccessContainer' ) }
                ><Text>{ t( 'continue???' ) }</Text></ButtonHighlight>

                <ButtonHighlight
                    onPress={ () => {
                        expand( false );
                        setModalVisible( false );
                        setIsRouting && setIsRouting( false );
                    } }
                    mode="contained"
                    buttonColor={ theme.colors.errorContainer }
                    textColor={ theme.colors.onErrorContainer }
                ><Text>{ t( 'cancel???' ) }</Text></ButtonHighlight>
            </View>
        </ModalWrapper> }

        <ButtonHighlight
            style={ { marginBottom: 20 } }
            mode='outlined'
            onPress={ () => {
                if ( isRouting ) {
                    if ( points && points.length && Object.values( savedExported || {} ).includes( false ) ) {
                        setModalVisible( true );
                    } else {
                        expand( false );
                        setIsRouting && setIsRouting( false );
                    }
                } else {
                    expand( false );
                    setIsRouting && setIsRouting( true );
                }
            } }
        >
            <Text>{ t( isRouting ? 'stopRouting???' : 'startRouting???'  ) }</Text>
        </ButtonHighlight>

        { ! isRouting && <ButtonHighlight
            style={ { marginBottom: 20 } }
            mode='outlined'
            onPress={ () => null }
        >
            <Text>{ t( 'load TODO???'  ) }</Text>
        </ButtonHighlight> }

        { isRouting && <View style={ {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 20,
        } }>
            <ButtonHighlight
                mode='outlined'
                onPress={ () => null }
            >
                <Text>{ t( 'save TODO???'  ) }</Text>
            </ButtonHighlight>

            <ButtonHighlight
                mode='outlined'
                onPress={ () => null }
            >
                <Text>{ t( 'export TODO???'  ) }</Text>
            </ButtonHighlight>
        </View> }


        { points && [...points].map( ( point, index ) => {

            const segment = segments ? segments.find( segment =>
                segment.fromId === point.id
            ) : undefined;

            return <View key={ index } style={ { marginBottom: 10 } }>

                <View style={ { flexDirection: 'row' } }>

                    <Text style={ { marginRight: 10 } }>{ index }</Text>

                    <Text>{ formatcoords( point.location ).format( 'dd',{
                        decimalPlaces: 4,
                    } ) }</Text>

                </View>

                { segment && <View style={ { } }>
                    {/* <Text>ok</Text> */}
                    { segment?.errorMsg && <Text style={ { } }>{ 'Error' + ': ' + segment?.errorMsg }</Text> }
                    { segment?.isFetching && <Text style={ { } }>{ 'fetching...' }</Text> }
                    { ! segment?.isFetching && segment?.positions && <Text style={ { } }>{ 'positions' + ': ' + segment?.positions.length }</Text> }
                </View> }

            </View>;
        } ) }
    </ScrollView>;
};

const IconComponent = ({ color }: { color: string }) => {
    return <IconIcomoon style={{ color }} name="routes_search" size={25} />;
};

const IconActions = ( {
    style,
    currentMapEvent,
} : {
    style: TextStyle,
    currentMapEvent: MapEventResponse;
}) => {

    const {
        mapHeight,
        mapViewNativeNodeHandle,
    } = useContext( AppContext );

    const {
        isRouting,
        points,
        segments,
        setPoints,
        markerLayerUuid,
        pathLayerUuids,
		triggeredMarkerIdx,
		setTriggeredMarkerIdx,
		triggeredSegment,
		setTriggeredSegment,
    } = useContext( RoutingContext );

    const { width } = useSafeAreaFrame();
    const theme = useTheme();
    const { t } = useTranslation();
    const [menuVisible,setMenuVisible] = useState( false );

    if ( ! isRouting ) {
        return null;
    }

    const dismissMenu = () => {
        setMenuVisible( false );
        setTriggeredMarkerIdx && setTriggeredMarkerIdx( undefined );
        setTriggeredSegment && setTriggeredSegment( undefined );
    };

    const options = [
        {
            value: 'appendPoint',
            label: 'appendPoint',
            onPress: () => {
				dismissMenu()
                if ( setPoints && points && currentMapEvent?.center ) {
                    setPoints( [
                        ...points,
                        {
                            id: rnUuid.v4(),
                            location: currentMapEvent?.center,
                        }
                    ] );
                }
			},
            leadingIcon: 'plus',
        },
        {
            value: 'movePoint',
            label: 'movePoint ' + ( triggeredMarkerIdx ? triggeredMarkerIdx : '' ),
            onPress: () => {
				dismissMenu()
                if ( setPoints && points && points.length > 0 ) {

                    console.log( 'debug triggeredMarkerIdx', triggeredMarkerIdx ); // debug
                    // const newPoints = [...points];
                    // newPoints.splice( -1, 1 );
                    // setPoints( newPoints );
                }
			},
            disabled: () => ! points || ! points.length || undefined === triggeredMarkerIdx,
            leadingIcon: 'arrow-all',
        },
        {
            value: 'cutSegment',
            label: 'cutSegment',
            onPress: () => {
				dismissMenu()
                if (
                    setPoints
                    && points
                    && points.length > 0
                    && segments
                    && undefined !== triggeredSegment?.index
                    && segments.length > triggeredSegment?.index
                ) {
                    const segment = segments[triggeredSegment?.index];
                    const pointToIdIdx = points.findIndex( point => point.id === segment.toId );
                    if ( -1 !== pointToIdIdx ) {
                        const newPoints = [...points];
                        newPoints.splice(
                            pointToIdIdx,
                            0,
                            {
                                id: rnUuid.v4(),
                                location: triggeredSegment.nearestPoint,
                            }
                        )
                        setPoints( newPoints );
                    }
                }
			},
            disabled: () => ! points || ! points.length || undefined === triggeredSegment,
            leadingIcon: 'content-cut',
        },
        {
            value: 'deletePoint',
            label: 'deletePoint ' + ( undefined !== triggeredMarkerIdx ? triggeredMarkerIdx : '' ),
            onPress: () => {
				dismissMenu()
                if (
                    setPoints
                    && points
                    && undefined !== triggeredMarkerIdx
                    && points.length >= triggeredMarkerIdx + 1
                ) {
                    const newPoints = [...points];
                    newPoints.splice( triggeredMarkerIdx, 1 );
                    setPoints( newPoints );
                }
			},
            disabled: () => ! points || ! points.length || undefined === triggeredMarkerIdx,
            leadingIcon: 'minus',
        },
        {
            value: 'deleteLastPoint',
            label: 'deleteLastPoint',
            onPress: () => {
				dismissMenu()
                if ( setPoints && points && points.length > 0 ) {
                    const newPoints = [...points];
                    newPoints.splice( -1, 1 );
                    setPoints( newPoints );
                }
			},
            disabled: () => ! points || ! points.length,
            leadingIcon: 'minus',
        },
    ];

    return <Menu
        contentStyle={ {
            borderColor: theme.colors.outline,
            borderWidth: 1,
            marginLeft: -100,   // ??? turn around for other side
            marginTop: -5,
        } }
        visible={ menuVisible }
        onDismiss={ dismissMenu }
        anchor={ <Button
            onPress={ () => {
                if ( menuVisible ) {
                    dismissMenu();
                } else {
                    setMenuVisible( true );
                    if ( mapViewNativeNodeHandle ) {
                        const left = PixelRatio.getPixelSizeForLayoutSize( width ) / 2;
                        const top = PixelRatio.getPixelSizeForLayoutSize( mapHeight || 0 ) / 2;
                        if (  markerLayerUuid ) {
                            MapLayerMarkerModule.triggerEvent(
                                mapViewNativeNodeHandle,
                                markerLayerUuid,
                                left,
                                top
                            ).catch( ( err: any ) => console.log( 'ERROR', err ) );
                        }
                        if (  pathLayerUuids ) {
                            [...pathLayerUuids].map( routingPathLayerUuid => {
                                MapLayerPathSlopeGradientModule.triggerEvent(
                                    mapViewNativeNodeHandle,
                                    routingPathLayerUuid,
                                    left,
                                    top
                                ).catch( ( err: any ) => console.log( 'ERROR', err ) );
                            } );
                        }
                    }
                }
            } }
            style={ style }
        >
            <Icon
                source={ 'menu' }
                size={ 25 }
                color={ style?.color as string | undefined }
            />
        </Button> }
    >
        { options && [...options].map( opt => {
            const disabled = opt?.disabled ? opt?.disabled() : false;
            return <MenuItem
                key={ opt.value }
                leadingIcon={ opt?.leadingIcon }
                onPress={ opt.onPress }
                title={ t( opt.label ) }
                style={ disabled ? { backgroundColor: theme.colors.surfaceDisabled } : undefined }
                textStyle={ disabled ? { color: theme.colors.onSurfaceDisabled } : undefined }
                iconColor={ disabled ? theme.colors.onSurfaceDisabled : undefined }
            />;
        } ) }




    </Menu>;
};

export default {
    key: 'brouter',
    label: 'brouter',
    DisplayComponent,
    IconComponent,
    IconActions,

    // ControlComponent,
    // hasStyleControl: true,
    // shouldSetHgtDirPath: true,
    // defaultMinWidth: 75,
    // responseInclude: { center: 2 },
};
