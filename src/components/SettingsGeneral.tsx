
/**
 * External dependencies
 */
import React, {
	FC,
	useContext,
} from 'react';
import {
	ScrollView,
} from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * Internal dependencies
*/
import { AppContext } from '../Context';
import ListItemMenuControl from './generic/ListItemMenuControl';
import HardwareKeyControl from './HardwareKeyControl';
import { DashboardControl } from './Dashboard';
import UnitPrefControl from './UnitPrefControl';
import HgtControl from './HgtControl';

const SettingsGeneral : FC = () => {

	const theme = useTheme();
	const { width } = useSafeAreaFrame();
	const { t } = useTranslation();
    const {
        appInnerHeight,
		langOptions,
		changeLang,
		selectedLang,
    } = useContext( AppContext );

	return <ScrollView style={ {
        backgroundColor: theme.colors.background,
        height: appInnerHeight,
        width,
        position: 'absolute',
        zIndex: 9,
    } } >

		<ListItemMenuControl
			anchorLabel={ t( 'selectLang' ) }
			anchorLabelAppendSelected={ true }
			options={ langOptions }
			setValue={ changeLang }
			value={ selectedLang }
			anchorIcon={ ( { style, color } ) => <MaterialIcons style={ style } name="language" size={ 25 } color={ color } /> }
		/>

		<HardwareKeyControl/>

		<UnitPrefControl/>

		<DashboardControl/>

		<HgtControl/>

	</ScrollView>;
};

export default SettingsGeneral;