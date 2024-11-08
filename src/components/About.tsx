
/**
 * External dependencies
 */
import React, {
	FC,
	useContext,
} from 'react';
import {
	useWindowDimensions,
	View,
} from 'react-native';
import {
	Text,
	useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import AnimatedLogo from './AnimatedLogo';

const About : FC = () => {

	const theme = useTheme();

	const { t } = useTranslation();

	const { width } = useWindowDimensions();

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
                marginBottom: 10,
            } }
        >{ t( 'test' ) }</Text>

        <AnimatedLogo size={ width } />

	</View>;

};

export default About;