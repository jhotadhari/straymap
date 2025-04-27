import { LayoutChangeEvent, View } from "react-native";
import { Dispatch, SetStateAction } from "react";

import { BottomBarHeight } from "../types";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { ComposedGesture, Gesture, GestureDetector, GestureType } from "react-native-gesture-handler";
import { Button, Icon, Text, useTheme } from "react-native-paper";
import { clamp } from "lodash-es";

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

const AltitudeProfileInner = ( {
    height,
} : {
    height: number;
} ) => {

    return <View
        style={ {
            position: 'absolute',
            padding: 10,
            height,
        } }
    >
        <Text>bla</Text>
        <Text>bla</Text>
        <Text>bla</Text>
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

            <AltitudeProfileInner
                height={ height }
            />

        </Animated.View>;
};

export default AltitudeProfile;