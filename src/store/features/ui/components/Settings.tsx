/**
 * External dependencies
 */
import React, { FC, useContext, useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
/**
 * Internal dependencies
 */
import { AppContext } from '../../../../Context';
import ListItem from '../../../../components/generic/ListItem';
import { getUiItemsByKey } from '../uiItems';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectUiItemKeys } from '../selectors';
import { setUiItemKeys } from '../uiSlice';

const Settings: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { width } = useSafeAreaFrame();
	const { appInnerHeight } = useContext(AppContext);

	const dispatch = useAppDispatch();

	const uiItemsKeys = useAppSelector(selectUiItemKeys);

	const settingsPages = useMemo(
		() => getUiItemsByKey([
			'maps',
			'general',
			'appearance',
		]),
		[]
	);

	return (
		<View
			style={{
				backgroundColor: theme.colors.background,
				height: appInnerHeight,
				width,
				position: 'absolute',
				zIndex: 9,
			}}
		>
			{[...settingsPages].map((item, index) => (
				<ListItem
					key={index}
					title={t(item.label)}
					icon={item?.icon}
					onPress={() =>
						dispatch(
							setUiItemKeys([
								...uiItemsKeys,
								item.key,
							])
						)
					}
				/>
			))}
		</View>
	);
};

export default Settings;
