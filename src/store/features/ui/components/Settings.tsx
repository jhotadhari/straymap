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
import { getHierarchyItemsByKey, settingsPages } from '../hierarchyItems';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectHierarchyItemKeys } from '../selectors';
import { setHierarchyItemKeys } from '../uiSlice';

const Settings: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { width } = useSafeAreaFrame();
	const { appInnerHeight } = useContext(AppContext);

	const dispatch = useAppDispatch();

	const hierarchyItemsKeys = useAppSelector(selectHierarchyItemKeys);

	// const hierarchyItems = useMemo(
	// 	() => getHierarchyItemsByKey(hierarchyItemsKeys),
	// 	[hierarchyItemsKeys]
	// );

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
					icon={item.left ? item.left : undefined}
					onPress={() =>
						dispatch(
							setHierarchyItemKeys([
								...hierarchyItemsKeys,
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
