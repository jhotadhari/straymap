/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import customThemes from '../../../../../themes';
import ListItemMenuControl from '../../../../../components/generic/controls/ListItemMenuControl';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { setTheme } from '../../appearanceSlice';
import { selectTheme } from '../../selectors';

const ThemeControl: FC = () => {
	const { t } = useTranslation();

	const options = useMemo(
		() => [
			{
				key: 'system',
				label: 'systemSetting',
			},
			...Object.keys(customThemes).map((customThemeKey: string) => ({
				key: customThemeKey,
				label: customThemes[customThemeKey]?.label || '',
			})),
		],
		[]
	);

	const selectedTheme = useAppSelector(selectTheme);

	const dispatch = useAppDispatch();

	const handleChange = useCallback((newVal: string) => dispatch(setTheme(newVal)), []);

	return (
		<ListItemMenuControl
			anchorLabel={t('selectTheme')}
			anchorLabelAppendSelected={true}
			options={options}
			setValue={handleChange}
			value={selectedTheme}
			anchorIcon={({ color, style }) => (
				<View style={style}>
					<Icon
						source="invert-colors"
						color={color}
						size={25}
					/>
				</View>
			)}
		/>
	);
};

export default ThemeControl;
