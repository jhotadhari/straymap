
/**
 * External dependencies
 */
import React, {
	FC,
	useContext,
} from 'react';
import {
	View,
	ScrollView,
} from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import {
	Icon,
	useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import ListItemMenuControl from './generic/ListItemMenuControl';
import CenterControl from './CenterControl';

const SettingsAppearance : FC = () => {

	const theme = useTheme();
	const { width } = useSafeAreaFrame();
	const { t } = useTranslation();
    const {
        appInnerHeight,
        selectedTheme,
        setSelectedTheme,
        themeOptions,
    } = useContext( AppContext )

	return <ScrollView style={ {
        backgroundColor: theme.colors.background,
        height: appInnerHeight,
        width,
        position: 'absolute',
        zIndex: 9,
    } } >

		<ListItemMenuControl
			anchorLabel={ t( 'selectTheme' ) }
			anchorLabelAppendSelected={ true }
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