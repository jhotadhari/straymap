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
import { useAppDispatch } from '../../../hooks';
import { addUiItemKey } from '../slice';

const Settings: FC<{ style?: ViewStyle }> = ({ style }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const settingsPages = useMemo(
		() =>
			getUiItemsByKey([
				'maps',
				'general',
				'appearance',
				'dashboard',
				'about',
			]),
		[]
	);

	return (
		<ScrollView style={style}>
			{settingsPages.map((item, index) => (
				<ListItem
					key={index}
					title={t(item.label)}
					icon={item?.icon}
					onPress={() => dispatch(addUiItemKey(item.key))}
				/>
			))}
		</ScrollView>
	);
};

export default Settings;
