
/**
 * External dependencies
 */
import React, {
	FC,
	useContext,
} from 'react';
import {
	useWindowDimensions,
	ScrollView,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * Internal dependencies
*/
import { AppContext } from '../Context';
import ListItemMenuControl from './ListItemMenuControl';
import HardwareKeyControl from './HardwareKeyControl';

const SettingsGeneral : FC = () => {

	const theme = useTheme();
	const { width } = useWindowDimensions();
	const { t } = useTranslation();
    const {
        mapHeight,
		langOptions,
		changeLang,
		selectedLang,
    } = useContext( AppContext )

	return <ScrollView style={ {
        backgroundColor: theme.colors.background,
        height: mapHeight,
        width,
        position: 'absolute',
        zIndex: 9,
    } } >

		<ListItemMenuControl
			anchorLabel={ t( 'selectLang' ) }
			options={ langOptions }
			setValue={ changeLang }
			value={ selectedLang }
			anchorIcon={ ( { style, color } ) => <MaterialIcons style={ style } name="language" size={ 25 } color={ color } /> }
		/>

		<HardwareKeyControl/>

	</ScrollView>;
};

export default SettingsGeneral;