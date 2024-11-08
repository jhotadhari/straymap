
/**
 * External dependencies
 */
import React, {
	FC,
	useContext,
} from 'react';
import {
	Text,
	useWindowDimensions,
	Animated,
	useAnimatedValue,
	View,
    Pressable,
} from 'react-native';
import {
	useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import VectorDrawable from '@klarna/react-native-vector-drawable';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';

const About : FC = () => {

	const theme = useTheme();

	const { t } = useTranslation();

	const { width } = useWindowDimensions();

    const catScale = useAnimatedValue( 1 );
    const earthRotate = useAnimatedValue( 0 );
    const animate = () => {
        Animated.sequence( [
            Animated.timing( earthRotate, {
                toValue: -20,
                duration: 150,
                useNativeDriver: true,
            } ),
            Animated.timing( earthRotate, {
                toValue: 20,
                duration: 150,
                useNativeDriver: true,
            } ),
            Animated.timing( earthRotate, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            } ),
        ] ).start();
        Animated.sequence( [
            Animated.timing( catScale, {
                toValue: 1.3,
                duration: 175,
                useNativeDriver: true,
            } ),
            Animated.timing( catScale, {
                toValue: 1,
                duration: 175,
                useNativeDriver: true,
            } )
        ] ).start();
    };

    const {
        mapHeight,
    } = useContext( AppContext )

	return <View style={ {
        backgroundColor: theme.colors.background,
        height: mapHeight,
        width,
        position: 'absolute',
        zIndex: 9,
        justifyContent: 'space-evenly',
        alignItems: 'center',
    } } >

        <Text
            style={ {
                color: theme.colors.onBackground,
                marginBottom: 10,
            } }
        >{ t( 'test' ) }</Text>


		<Text>Thats the about page ???</Text>

        <Pressable
            style={ {
                width,
                height: width,
                justifyContent: 'center',
                alignItems: 'center',
            } }
            onPress={ animate }
        >
            <Animated.View style={ {
                position: 'absolute',
                justifyContent: 'center',
                alignItems: 'center',
                transform: [ {
                    rotate: earthRotate.interpolate( {
                        inputRange: [-360, 360],
                        outputRange: ['-360deg', '360deg'],
                    } ) } ],
            } } >
                <VectorDrawable
                    resourceName="ic_launcher_background"
                    style={ {
                        width: width * 0.8,
                        height: width * 0.8,
                    } }
                />
            </Animated.View>

            <Animated.View style={ {
                position: 'absolute',
                width,
                height: width,
                transform: [ { scale: catScale } ],
            } } >
                <VectorDrawable
                    resourceName="ic_launcher_foreground"
                    style={ {
                        width,
                        height: width,
                    } }
                />
            </Animated.View>
        </Pressable>

	</View>;

};

export default About;