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
import { PixelRatio, TextStyle, View } from "react-native";
import rnUuid from 'react-native-uuid';
import { MapEventResponse, MapLayerMarkerModule, MapLayerPathSlopeGradientModule } from 'react-native-mapsforge-vtm';
import formatcoords from 'formatcoords';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

/**
 * Internal dependencies
 */
import IconIcomoon from '../../generic/IconIcomoon';
import { AppContext } from '../../../Context';
import { pick } from 'lodash-es';
import MenuItem from '../../generic/MenuItem';

const DisplayComponent = ({
    // currentMapEvent,
    // dashboardElement,
    // style = {},
    // unitPrefs,
    // dashboardStyle,
}: {

} ) => {


    const {
        routingPoints,
        routingSegments,
    } = useContext( AppContext );

    const { t } = useTranslation();


    return <View style={{
        // minWidth: get( dashboardElement, ['style','minWidth'], undefined ),
        // ...style,
    }}>
        { routingPoints && [...routingPoints].map( ( point, index ) => {

            const segment = routingSegments ? routingSegments.find( segment =>
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
    </View>;
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
        routingPoints,
        routingSegments,
        setRoutingPoints,
        mapViewNativeNodeHandle,
        mapHeight,
        routingMarkerLayerUuid,
        routingPathLayerUuids,
		routingTriggeredMarkerIdx,
		setRoutingTriggeredMarkerIdx,
		routingTriggeredSegment,
		setRoutingTriggeredSegment,
    } = useContext( AppContext );

    const { width } = useSafeAreaFrame();
    const theme = useTheme();
    const { t } = useTranslation();
    const [menuVisible,setMenuVisible] = useState( false );

    const dismissMenu = () => {
        setMenuVisible( false );
        setRoutingTriggeredMarkerIdx && setRoutingTriggeredMarkerIdx( undefined );
        setRoutingTriggeredSegment && setRoutingTriggeredSegment( undefined );
    };

    const options = [
        {
            value: 'appendPoint',
            label: 'appendPoint',
            onPress: () => {
				dismissMenu()
                if ( setRoutingPoints && routingPoints && currentMapEvent?.center ) {
                    setRoutingPoints( [
                        ...routingPoints,
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
            label: 'movePoint ' + ( routingTriggeredMarkerIdx ? routingTriggeredMarkerIdx : '' ),
            onPress: () => {
				dismissMenu()
                if ( setRoutingPoints && routingPoints && routingPoints.length > 0 ) {

                    console.log( 'debug routingTriggeredMarkerIdx', routingTriggeredMarkerIdx ); // debug
                    // const newPoints = [...routingPoints];
                    // newPoints.splice( -1, 1 );
                    // setRoutingPoints( newPoints );
                }
			},
            disabled: () => ! routingPoints || ! routingPoints.length || undefined === routingTriggeredMarkerIdx,
            leadingIcon: 'arrow-all',
        },
        {
            value: 'cutSegment',
            label: 'cutSegment',
            onPress: () => {
				dismissMenu()
                if (
                    setRoutingPoints
                    && routingPoints
                    && routingPoints.length > 0
                    && routingSegments
                    && undefined !== routingTriggeredSegment?.index
                    && routingSegments.length > routingTriggeredSegment?.index
                ) {
                    const segment = routingSegments[routingTriggeredSegment?.index];
                    const pointToIdIdx = routingPoints.findIndex( point => point.id === segment.toId );
                    if ( -1 !== pointToIdIdx ) {
                        const newPoints = [...routingPoints];
                        newPoints.splice(
                            pointToIdIdx,
                            0,
                            {
                                id: rnUuid.v4(),
                                location: routingTriggeredSegment.nearestPoint,
                            }
                        )
                        setRoutingPoints( newPoints );
                    }
                }
			},
            disabled: () => ! routingPoints || ! routingPoints.length || undefined === routingTriggeredSegment,
            leadingIcon: 'content-cut',
        },
        {
            value: 'deletePoint',
            label: 'deletePoint ' + ( undefined !== routingTriggeredMarkerIdx ? routingTriggeredMarkerIdx : '' ),
            onPress: () => {
				dismissMenu()
                if (
                    setRoutingPoints
                    && routingPoints
                    && undefined !== routingTriggeredMarkerIdx
                    && routingPoints.length >= routingTriggeredMarkerIdx + 1
                ) {
                    const newPoints = [...routingPoints];
                    newPoints.splice( routingTriggeredMarkerIdx, 1 );
                    setRoutingPoints( newPoints );
                }
			},
            disabled: () => ! routingPoints || ! routingPoints.length || undefined === routingTriggeredMarkerIdx,
            leadingIcon: 'minus',
        },
        {
            value: 'deleteLastPoint',
            label: 'deleteLastPoint',
            onPress: () => {
				dismissMenu()
                if ( setRoutingPoints && routingPoints && routingPoints.length > 0 ) {
                    const newPoints = [...routingPoints];
                    newPoints.splice( -1, 1 );
                    setRoutingPoints( newPoints );
                }
			},
            disabled: () => ! routingPoints || ! routingPoints.length,
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
                        if (  routingMarkerLayerUuid ) {
                            MapLayerMarkerModule.triggerEvent(
                                mapViewNativeNodeHandle,
                                routingMarkerLayerUuid,
                                left,
                                top
                            ).catch( ( err: any ) => console.log( 'ERROR', err ) );
                        }
                        if (  routingPathLayerUuids ) {
                            [...routingPathLayerUuids].map( routingPathLayerUuid => {
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
