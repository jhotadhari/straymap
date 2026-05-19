/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { ScrollView, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
/**
 * Internal dependencies
 */
import ListItem from '../../../../components/generic/ListItem';
import { getUiItemsByKey } from '../uiItems';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectUiItemKeys } from '../selectors';
import { setUiItemKeys } from '../uiSlice';

const Settings: FC<{ style?: ViewStyle }> = ({ style }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const uiItemsKeys = useAppSelector(selectUiItemKeys);

	const settingsPages = useMemo(
		() =>
			getUiItemsByKey([
				'maps',
				'general',
				'appearance',
				'dashboard',
			]),
		[]
	);

	return (
		<ScrollView style={style}>
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
		</ScrollView>
	);
};

export default Settings;
