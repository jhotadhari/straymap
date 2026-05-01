
/**
 * External dependencies
 */
import React, {
	FC,
	useCallback,
	useContext,
	useMemo,
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
import customThemes from '../themes';
import { AppContext } from '../Context';
import ListItemMenuControl from './generic/ListItemMenuControl';
import CenterControl from './CenterControl';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setTheme } from '../store/features/appearance/appearanceSlice';
import { selectTheme } from '../store/features/appearance/selectors';

const ThemeControl : FC = () => {

	const { t } = useTranslation();

	const options = useMemo( () => [
		{
			key: 'system',
			label: 'systemSetting',
		},
		...Object.keys( customThemes ).map( ( customThemeKey : string ) => (  {
			key: customThemeKey,
			label: customThemes[customThemeKey]?.label || '',
		} ) ),
	], [] );

	const selectedTheme = useAppSelector( selectTheme );

	const dispatch = useAppDispatch();

	const handleChange = useCallback( ( newVal: string ) => dispatch( setTheme( newVal ) ), [] );

	return <ListItemMenuControl
		anchorLabel={ t( 'selectTheme' ) }
		anchorLabelAppendSelected={ true }
		options={ options }
		setValue={ handleChange }
		value={ selectedTheme }
		anchorIcon={ ( { color, style } ) => <View style={ style }><Icon
			source="invert-colors"
			color={ color }
			size={ 25 }
		/></View> }
	/>;
};

const SettingsAppearance : FC = () => {

	const theme = useTheme();
	const { width } = useSafeAreaFrame();
    const {
        appInnerHeight,
    } = useContext( AppContext )

	return <ScrollView style={ {
        backgroundColor: theme.colors.background,
        height: appInnerHeight,
        width,
        position: 'absolute',
        zIndex: 9,
    } } >

		<ThemeControl/>

		<CenterControl/>

	</ScrollView>;
};

export default SettingsAppearance;