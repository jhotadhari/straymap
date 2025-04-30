/**
 * External dependencies
*/
import { LayoutChangeEvent, View } from "react-native";
import React, { Dispatch, SetStateAction, useContext, useEffect, useMemo, useState } from "react";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { ComposedGesture, Gesture, GestureDetector, GestureType } from "react-native-gesture-handler";
import { Button, Icon, useTheme } from "react-native-paper";
import { clamp, get } from "lodash-es";
import { CartesianChart, Line, PointsArray, Scale, Scatter } from "victory-native";
import { Circle, listFontFamilies, matchFont, Path } from "@shopify/react-native-skia";
/**
 * Internal dependencies
*/
import { BottomBarHeight, LocationExtended } from "../types";
import { AppContext, MapContext, RoutingContext } from "../Context";

const handleSize = 50;

const AltitudeProfileHandle = ( {
    gesture,
    getIsFullyCollapsed,
    expand,
} : {
    gesture: ComposedGesture | GestureType;
	getIsFullyCollapsed: () => boolean;
	expand: ( expanded: boolean ) => void;
} ) => {

    const theme = useTheme();

    return <GestureDetector gesture={ gesture }>
        <View style={ {
            position: 'absolute',
            width: handleSize,
            height: handleSize,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.onBackground,
            borderWidth: 1,
            borderTopRightRadius: '50%',
            borderTopLeftRadius: '50%',
            borderBottomWidth: 0,
            top: 0,
            left: '50%',
            transform: [
                { translateY: '-100%' },
                { translateX: '-50%' },
            ],
        } }>
            <Button
                style={ {
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                } }
                onPress={ () => expand( getIsFullyCollapsed() ) }
                compact={ true }
            >
                <Icon
                    source={ 'chart-areaspline-variant' }
                    // source={ 'cog' }
                    size={ 25 }
                    color={ theme.colors.onBackground }
                />
            </Button>
        </View>
    </GestureDetector>;
};

interface LocationForChart extends LocationExtended {
    pointAlt?: number,
    currentAlt?: number,
};

const AltitudeProfileInner = ( {
    height,
    outerWidth,
} : {
    height: number;
    outerWidth: number;
} ) => {

    const {
        segments,
        nearestSimplifiedCoord,
    } = useContext( RoutingContext );

    const theme = useTheme();

    const font = matchFont( {
        fontFamily: listFontFamilies()[0],
        fontSize: 12,
    } );

    // data: concatenated segment?.coordinatesSimplified with accumulated distance.
    const [data,setData] = useState<null | Record<string, any>[]>( null );

    useEffect( () => {
        let lastDist: number = 0;
        const newData = segments && segments?.length ? [...segments].map( ( segment, index ) => {
            if ( ! segment?.coordinatesSimplified ) {
                return false;
            }
            // coords with accumulated distance.
            const coordsAdjusted: LocationForChart[] = 0 === index ? [...segment?.coordinatesSimplified] : [...segment?.coordinatesSimplified].map( coord => ( {
                ...coord,
                distance: ( coord.distance || 0 ) + lastDist,
            } ) );

            // Should render points.
            coordsAdjusted[0] = {
                ...coordsAdjusted[0],
                pointAlt: coordsAdjusted[0].alt,
            };
            if ( index === segments.length -1 ) {
                coordsAdjusted[coordsAdjusted.length-1] = {
                    ...coordsAdjusted[coordsAdjusted.length-1],
                    pointAlt: coordsAdjusted[coordsAdjusted.length-1].alt,
                };
            }
            // accumulate distance
            lastDist += get( segment?.coordinatesSimplified[segment?.coordinatesSimplified.length-1], 'distance', 0 );
            return coordsAdjusted;
        } ).filter( segment => !! segment ).flat() : [];
        setData( newData );
    }, [segments] );

    const getDataIndexFromNearestSimplifiedCoord = () : number | undefined => {
        if ( nearestSimplifiedCoord && segments ) {
            let dataIndex = 0;

            let counter = 0;
            while ( counter < nearestSimplifiedCoord?.segmentIndex ) {

                dataIndex += get( segments, [counter,'coordinatesSimplified'], [] ).length;
                counter += 1;
            }

            return dataIndex + nearestSimplifiedCoord.featureIndex;
        }
    };

    const dataIndex = getDataIndexFromNearestSimplifiedCoord();
    const dataWithCurrent = data && undefined !== dataIndex ? [...data] : undefined;
    dataWithCurrent && undefined !== dataIndex && dataWithCurrent.splice( dataIndex, 1, {
        ...dataWithCurrent[dataIndex],
        currentAlt: dataWithCurrent[dataIndex]?.alt,
    } );

    const axisOpts = useMemo( () => ( {
        lineWidth: 1,
        font,
        lineColor: theme.colors.onSurfaceDisabled,
        labelColor: theme.colors.onBackground,
        labelPosition: 'outset' as 'outset',
        enableRescaling: true,
    } ), [] );

    return <View
        style={ {
            position: 'absolute',
            height,
            width: outerWidth,
        } }
    >
        { dataWithCurrent && <CartesianChart
            data={ dataWithCurrent }
            padding={ 10 }
            xKey='distance'
            yKeys={ [
                'alt',
                'pointAlt',
                ...( undefined !== dataIndex ? ['currentAlt'] : [] ),
                'slope',
            ] }
            yAxis={ [
                {
                    ...axisOpts,
                    yKeys: [
                        'alt',
                        'pointAlt',
                        ...( undefined !== dataIndex ? ['currentAlt'] : [] ),
                    ],
                },
                {
                    ...axisOpts,
                    yKeys: ['slope'],
                    axisSide: 'right',
                    formatYLabel: labelNb => Math.round( labelNb ) + '',
                },
            ] }
            xAxis={ {
                ...axisOpts,
                formatXLabel: labelNb => ( labelNb / 1000 ) + '',
            } }
        >
            { ( { points: dataPoints } ) => {

                return <View>

                    <Line
                        points={ dataPoints.slope }
                        color="green"
                        strokeWidth={ 2 }
                    />
                    <Line
                        points={ dataPoints.alt }
                        color="red"
                        strokeWidth={ 2 }
                    />

                    <Scatter
                        points={ dataPoints.pointAlt }
                        radius={ 5 }
                        style="fill"
                        color="yellow"
                    />

                    { undefined !== dataIndex && <Scatter
                        points={ dataPoints.currentAlt }
                        radius={ 5 }
                        style="fill"
                        color="pink"
                    /> }
                </View>;
            } }
        </CartesianChart> }
    </View>;
};

const AltitudeProfile = ( {
    height = 200,
    outerWidth,
    setBottomBarHeight,
} : {
    height?: number;
    outerWidth: number;
    setBottomBarHeight?: Dispatch<SetStateAction<BottomBarHeight>>;
} ) => {


    const {
        segments,
    } = useContext( RoutingContext );

    const translationY = useSharedValue( 0 );

    const prevTranslationY = useSharedValue( 0 );
    const theme = useTheme();

    const animatedStyles = useAnimatedStyle( () => ( {
        height: translationY.value,
    } ) );

    const setTranslationY = ( newVal: number ) => {
        translationY.value = newVal;
    };

    const expand = ( expanded: boolean ) => setTranslationY( expanded
        ? height
        : 0
    );

    const gesture = Gesture.Pan()
        .minDistance( 1 )
        .onStart( () => {
            prevTranslationY.value = translationY.value;
        } )
        .onUpdate( ( event ) => {
            setTranslationY( clamp(
                prevTranslationY.value - event.translationY,
                0,
                height
            ) );
        } )
        .runOnJS( true );

    const getIsFullyCollapsed = () => translationY.value === 0;

    return <Animated.View
            style={ [animatedStyles, {
                width: outerWidth,
                backgroundColor: theme.colors.background,
            }] }
            onLayout={ ( e: LayoutChangeEvent ) => {
                if ( e?.nativeEvent?.layout && setBottomBarHeight ) {
                    const { height } = e.nativeEvent.layout;
                    setBottomBarHeight( bottomBarHeight => ( {
                        ...bottomBarHeight,
                        altitudeProfile: height,
                    } ) );
                }
            } }
        >
            <AltitudeProfileHandle
                gesture={ gesture }
                getIsFullyCollapsed={ getIsFullyCollapsed }
                expand={ expand }
            />

            { segments && segments?.length > 0 && <AltitudeProfileInner
                height={ height }
                outerWidth={ outerWidth }
            /> }

        </Animated.View>;
};

export default AltitudeProfile;