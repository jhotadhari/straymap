/**
 * External dependencies
 */
import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
    Button,
    Icon,
    Menu, useTheme
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { PixelRatio, TextStyle } from "react-native";
import rnUuid from 'react-native-uuid';
import { MapEventResponse, MapLayerMarkerModule, MapLayerPathSlopeGradientModule } from 'react-native-mapsforge-vtm';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { usePrevious } from 'victory-native';

/**
 * Internal dependencies
 */
import { AppContext, RoutingContext } from '../../../../Context';
import MenuItem from '../../../generic/MenuItem';
import { RoutingPoint } from '../../../../types';
import { runAfterInteractions } from '../../../../utils';

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
		movingPointIdx,
		setMovingPointIdx,
    } = useContext( RoutingContext );

    const { width } = useSafeAreaFrame();
    const theme = useTheme();
    const { t } = useTranslation();
    const [menuVisible,setMenuVisible] = useState( false );

    // open menu on start routing, hopefully after drawer has closed.
    const prevIsRouting = usePrevious( isRouting );
    useEffect( () => {
        if ( isRouting && ! prevIsRouting ) {
            runAfterInteractions(
                () => setMenuVisible( true ),
                750
            );
        }
    }, [isRouting, prevIsRouting] );

    const dismissMenu = ( cleanTriggeredMarkerIdx?: boolean, cleanTriggeredSegment?: boolean ) => {
        cleanTriggeredMarkerIdx = undefined === cleanTriggeredMarkerIdx ? true : cleanTriggeredMarkerIdx;
        cleanTriggeredSegment = undefined === cleanTriggeredSegment ? true : cleanTriggeredSegment;
        setMenuVisible( false );
        setTriggeredMarkerIdx && cleanTriggeredMarkerIdx && setTriggeredMarkerIdx( undefined );
        setTriggeredSegment && cleanTriggeredSegment && setTriggeredSegment( undefined );
    };

    const options = useMemo( () => ( [
        ...( undefined === movingPointIdx ? [{
            value: 'appendPoint',
            label: 'appendPoint',
            onPress: () => {
				dismissMenu();
                if ( setPoints && points && currentMapEvent?.center ) {
                    setPoints( [
                        ...points,
                        {
                            key: rnUuid.v4(),
                            location: currentMapEvent?.center,
                        }
                    ] );
                }
			},
            leadingIcon: 'plus',
        }] : [] ),
        ...( undefined === movingPointIdx ? [{
            value: 'movePoint',
            label: 'movePoint ' + ( triggeredMarkerIdx ? triggeredMarkerIdx + 1 : '' ),
            onPress: () => {
				dismissMenu( false );
                if ( setPoints && points && points.length > 0 ) {
                    setMovingPointIdx && undefined !== triggeredMarkerIdx && setMovingPointIdx( triggeredMarkerIdx );
                    setTriggeredMarkerIdx && setTriggeredMarkerIdx( undefined );
                }
			},
            disabled: () => ! points || ! points.length || undefined === triggeredMarkerIdx,
            leadingIcon: 'arrow-all',
        }] : [] ),
        ...( undefined === movingPointIdx ? [{
            value: 'cutSegment',
            label: 'cutSegment',
            onPress: () => {
				dismissMenu( true, false );
                if (
                    setPoints
                    && points
                    && points.length > 0
                    && segments
                    && undefined !== triggeredSegment?.index
                    && segments.length > triggeredSegment?.index
                ) {
                    const segment = segments[triggeredSegment?.index];
                    const pointToIdIdx = points.findIndex( point => point.key === segment.toKey );
                    if ( -1 !== pointToIdIdx ) {
                        const newPoints = [...points];
                        newPoints.splice(
                            pointToIdIdx,
                            0,
                            {
                                key: rnUuid.v4(),
                                location: triggeredSegment.nearestPoint,
                            }
                        )
                        setPoints( newPoints );
                        setTriggeredSegment && setTriggeredSegment( undefined );
                        setTimeout( () => setMovingPointIdx && setMovingPointIdx( pointToIdIdx ), 300 );
                    }
                }
			},
            disabled: () => undefined !== triggeredMarkerIdx || ( ! points || ! points.length || undefined === triggeredSegment ),
            leadingIcon: 'content-cut',
        }] : [] ),
        ...( undefined === movingPointIdx ? [{
            value: 'deletePoint',
            label: 'deletePoint ' + ( undefined !== triggeredMarkerIdx ? triggeredMarkerIdx + 1 : '' ),
            onPress: () => {
				dismissMenu();
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
        }] : [] ),
        ...( undefined === movingPointIdx ? [{
            value: 'deleteLastPoint',
            label: 'deleteLastPoint',
            onPress: () => {
				dismissMenu();
                if ( setPoints && points && points.length > 0 ) {
                    const newPoints = [...points];
                    newPoints.splice( -1, 1 );
                    setPoints( newPoints );
                }
			},
            disabled: () => ! points || ! points.length,
            leadingIcon: 'minus',
        }] : [] ),
        ...( undefined !== movingPointIdx ? [{
            value: 'setPointPosition',
            label: 'setPointPosition',
            onPress: () => {
                if ( setPoints && points && undefined !== movingPointIdx && currentMapEvent?.center ) {
                    const newPoints = [...points];
                    const newPoint : RoutingPoint = {
                        ...points[movingPointIdx],
                        key: rnUuid.v4(),
                        location: currentMapEvent?.center,
                    };
                    newPoints.splice( movingPointIdx, 1, newPoint );
                    setPoints( newPoints );
                    setMovingPointIdx && setMovingPointIdx( undefined );
                }
                dismissMenu();
			},
            disabled: () => ! points || ! points.length,
            leadingIcon: 'check',
        }] : [] ),
        ...( undefined !== movingPointIdx ? [{
            value: 'cancelMoving',
            label: 'cancelMoving',
            onPress: () => {
				dismissMenu();
                setMovingPointIdx && setMovingPointIdx( undefined );
			},
            disabled: () => ! points || ! points.length,
            leadingIcon: 'cancel',
        }] : [] ),
    ] ), [
        points,
        movingPointIdx,
        segments,
    ] );

    return isRouting ? <Menu
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
                    runAfterInteractions( () => {
                        setTimeout( () => {
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
                        }, 100 )
                    }, 100 );
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
        { menuVisible && options && [...options].map( opt => {
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
    </Menu> : null;
};

export default IconActions;