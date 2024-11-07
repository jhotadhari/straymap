
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
	View,
} from 'react-native';
import {
	useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';

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
                color: theme.colors.onBackground,
                marginBottom: 10,
            } }
        >{ t( 'test' ) }</Text>


		<Text>Thats the about page ???</Text>
	</View>;

};

export default About;