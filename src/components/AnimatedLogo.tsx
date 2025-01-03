
/**
 * External dependencies
 */
import React, {
    useEffect,
    useState,
} from 'react';
import {
	Animated,
	useAnimatedValue,
	View,
    Pressable,
    Easing,
} from 'react-native';
import {
	Text,
	useTheme,
} from 'react-native-paper';
import VectorDrawable from '@klarna/react-native-vector-drawable';

/**
 * Internal dependencies
 */
import { randomNumber } from '../utils';

const rotationInterpolateConfig = {
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
};

const strings = [
    'Love Bicycles',
    'Love Geography',
    'Love Antifa',
    'Love Diversity',
    'Love Equality',
    'Fuck Nazis',
    'Fuck Capitalism',
    'Fuck Fascism',
    'Fuck Xenophobia',
    'Fuck Borders',
    'Fuck Racism',
    'Fuck Flatearthlers',
];

const AnimatedLogo = ( {
    size,
    shouldShit,
    animateOnPress,
    animateLoop,
} : {
    size: number;
    shouldShit?: boolean;
    animateOnPress?: boolean;
    animateLoop?: boolean;
} ) => {

	const theme = useTheme();

    const [stringIndex,setStringIndex] = useState( 0 );
    const [stringIndexUsed,setStringIndexUsed] = useState<number[]>( [] );
    const getNewStringIndex = () : number => {
        const stringsAvailable = [...strings].filter( ( string, index ) => ! stringIndexUsed.includes( index ) );
        if ( ! stringsAvailable.length ) {
            return -1;
        }
        const stringIndexAvailable = Math.round( randomNumber( 0, stringsAvailable.length - 1 ) );
        const newStringIndex = strings.findIndex( string => string === stringsAvailable[stringIndexAvailable] );
        return ! textIsInitialized || newStringIndex !== stringIndex || stringsAvailable.length <= 1
            ? newStringIndex
            : getNewStringIndex();
    }
    useEffect( () => {
        if ( textIsInitialized ) {
            const maybeNewVal = [...stringIndexUsed, stringIndex ];
            setStringIndexUsed( maybeNewVal.length === strings.length ? [] : maybeNewVal );
        }
    }, [stringIndex] );

    const [textIsInitialized,setTextIsInitialized] = useState( false );
    const [textDims,setTextDims] = useState( [0,0] );
    const textOpacity = useAnimatedValue( 0 );
    const textX = useAnimatedValue( 10 );
    const textY = useAnimatedValue( 10 );

    const catScale = useAnimatedValue( 1.1 );
    const catTranslateY = useAnimatedValue( -5 );
    const landRotate = useAnimatedValue( 0 );
    const waterRotate = useAnimatedValue( 0 );

    // animate text
    useEffect( () => {
        if ( textIsInitialized ) {
            // text position
            Animated.timing( textX, {
                toValue: randomNumber( 0, size - textDims[0] ),
                duration: 150,
                useNativeDriver: true,
            } ).start();
            Animated.timing( textY, {
                toValue: randomNumber( 0, size - textDims[1] ),
                duration: 150,
                useNativeDriver: true,
            } ).start();
            // textOpacity
            Animated.sequence( [
                Animated.timing( textOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                } ),
                Animated.timing( textOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                } ),
                Animated.timing( textOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                } ),
            ] ).start();
        }
    }, [textDims.join( '' )] )

    const loopAnimate = () => {
        // water
        Animated.loop(
            Animated.sequence( [
                Animated.timing( waterRotate, {
                    toValue: 360,
                    duration: 2500,
                    useNativeDriver: true,
                    easing: Easing.linear,
                } ),
                Animated.timing( waterRotate, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                } ),
            ] )
        ).start();
    };

    const updateLoopAnimate = ( animateLoop: boolean ) => animateLoop && loopAnimate();
    useEffect( () => {
        updateLoopAnimate( !! animateLoop );
    }, [] )
    useEffect( () => {
        updateLoopAnimate( !! animateLoop );
    }, [animateLoop] )

    const onPressAnimate = () => {
        // water
        Animated.sequence( [
            Animated.timing( waterRotate, {
                toValue: 40,
                duration: 150,
                useNativeDriver: true,
            } ),
            Animated.timing( waterRotate, {
                toValue: -40,
                duration: 150,
                useNativeDriver: true,
            } ),
            Animated.timing( waterRotate, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            } ),
        ] ).start();
        // land
        Animated.sequence( [
            Animated.timing( landRotate, {
                toValue: -20,
                duration: 150,
                useNativeDriver: true,
            } ),
            Animated.timing( landRotate, {
                toValue: 15,
                duration: 150,
                useNativeDriver: true,
            } ),
            Animated.timing( landRotate, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            } ),
        ] ).start();
        // catScale
        Animated.sequence( [
            Animated.timing( catScale, {
                toValue: 1.25,
                duration: 175,
                useNativeDriver: true,
            } ),
            Animated.timing( catScale, {
                toValue: 1.1,
                duration: 175,
                useNativeDriver: true,
            } )
        ] ).start();
        // catTranslateY
        Animated.sequence( [
            Animated.timing( catTranslateY, {
                toValue: -15,
                duration: 175,
                useNativeDriver: true,
            } ),
            Animated.timing( catTranslateY, {
                toValue: -5,
                duration: 175,
                useNativeDriver: true,
            } )
        ] ).start();
    };

    return <Pressable
        style={ {
            width: size,
            height: size,
            justifyContent: 'center',
            alignItems: 'center',
        } }
        onPress={ () => {
            if ( shouldShit ) {
                setTextIsInitialized( true );
                setStringIndex( getNewStringIndex() );
            }
            animateOnPress && onPressAnimate();
        } }
    >

        <Animated.View style={ {
            position: 'absolute',
            justifyContent: 'center',
            alignItems: 'center',
            transform: [ { rotate: waterRotate.interpolate( rotationInterpolateConfig ) } ] }
        } >
            <VectorDrawable
                resourceName="world_map_water"
                style={ {
                    width: size * 0.8,
                    height: size * 0.8,
                } }
            />
        </Animated.View>

        <Animated.View style={ {
            position: 'absolute',
            justifyContent: 'center',
            alignItems: 'center',
            transform: [ { rotate: landRotate.interpolate( rotationInterpolateConfig ) } ] }
        } >
            <VectorDrawable
                resourceName="world_map_land"
                style={ {
                    width: size * 0.8,
                    height: size * 0.8,
                } }
            />
        </Animated.View>

        <Animated.View style={ {
            position: 'absolute',
            width: size,
            height: size,
            transform: [
                { scale: catScale },
                { translateY: catTranslateY },
            ],
        } } >
            <VectorDrawable
                resourceName="ic_launcher_foreground"
                style={ {
                    width: size,
                    height: size,
                } }
            />
        </Animated.View>

        { textIsInitialized && <Animated.View style={ {
            position: 'absolute',
            alignItems: 'flex-start',
            width: size,
            height: size,
            top: 0,
            left: 0,
            opacity: textOpacity,
            transform: [
                { translateX: textX },
                { translateY: textY },
            ],
        } } >
            <View
                onLayout={ e => setTextDims( [
                    e.nativeEvent.layout.width,
                    e.nativeEvent.layout.height,
                ] ) }
                style={ { padding: 10 } }
            >
                <Text
                    style={ {
                        ...theme.fonts.displayMedium,
                        textShadowColor: '#000',
                        textShadowOffset: { width: 5, height: 5 },
                        textShadowRadius: 10,
                        color: '#fff',
                    } }
                >
                    { strings[stringIndex] }
                </Text>
            </View>
        </Animated.View> }

    </Pressable>;
};

export default AnimatedLogo;