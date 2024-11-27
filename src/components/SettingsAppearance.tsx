
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
	ScrollView,
} from 'react-native';
import {
	Icon,
	useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import ListItemMenuControl from './ListItemMenuControl';
import CenterControl from './CenterControl';

const SettingsAppearance : FC = () => {

	const theme = useTheme();
	const { width } = useWindowDimensions();
	const { t } = useTranslation();
    const {
        mapHeight,
        selectedTheme,
        setSelectedTheme,
        themeOptions,
    } = useContext( AppContext )

	return <ScrollView style={ {
        backgroundColor: theme.colors.background,
        height: mapHeight,
        width,
        position: 'absolute',
        zIndex: 9,
    } } >

		<ListItemMenuControl
			anchorLabel={ t( 'selectTheme' ) }
			options={ themeOptions }
			setValue={ setSelectedTheme }
			value={ selectedTheme }
			anchorIcon={ ( { color, style } ) => <View style={ style }><Icon
				source="invert-colors"
				color={ color }
				size={ 25 }
			/></View> }
		/>

		<CenterControl/>

	</ScrollView>;
};

export default SettingsAppearance;