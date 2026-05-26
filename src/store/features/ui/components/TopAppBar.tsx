/**
 * External dependencies
 */
import { FC, Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTheme, Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { View, BackHandler, TouchableHighlight, StyleSheet, ScrollView } from 'react-native';

/**
 * Internal dependencies
 */
import type { UiItem } from '../types';
import MenuItem from '../../../../components/generic/MenuItem';
import { getUiItemsByKey } from '../uiItems';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectUiItemKeys, selectIsBusy } from '../selectors';
import { setUiItemKeys } from '../uiSlice';
import LoadingIndicator from '../../../../components/generic/LoadingIndicator';
import { AppContext } from '../../../../Context';
import { DashboardWrapped } from '../../dashboard/components/Dashboard';
import { selectItemsCount } from '../../dashboard/selectors';

const TopAppBarMenu: FC<{ handleMenuPress?: () => void }> = ({ handleMenuPress }) => {
	const theme = useTheme();

	const isBusy = useAppSelector(selectIsBusy);

	return (
		<TouchableHighlight
			style={styles.button}
			underlayColor={theme.colors.elevation.level3}
			onPress={handleMenuPress}
		>
			<View>
				{isBusy && <LoadingIndicator size={30} />}
				{!isBusy && (
					<Icon
						size={30}
						source="menu"
					/>
				)}
			</View>
		</TouchableHighlight>
	);
};

// const arrowSize = { height: 0, width: 0 };

const TopAppBar: FC = () => {
	const { t } = useTranslation();

	const { setTopAppBarHeight } = useContext(AppContext);

	const theme = useTheme();

	const dispatch = useAppDispatch();

	const uiItemsKeys = useAppSelector(selectUiItemKeys);

	const appBarTitle = useMemo(
		() =>
			getUiItemsByKey(uiItemsKeys)
				.map((item) => t(item.label))
				.join(' / '),
		[uiItemsKeys, t]
	);

	// const menuItems = useMemo(
	// 	() =>
	// 		getUiItemsByKey([
	// 			'settings',
	// 			'about',
	// 		]),
	// 	[t]
	// );

	const backAction = useCallback(() => {
		if (uiItemsKeys.length) {
			dispatch(setUiItemKeys([...uiItemsKeys].slice(0, Math.max(0, uiItemsKeys.length - 1))));
			return true;
		}
		return false;
	}, [uiItemsKeys]);

	useEffect(() => {
		const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
		return () => backHandler.remove();
	}, [backAction]);

	const topItemsCount = useAppSelector((state) => selectItemsCount(state, 'top'));

	const isDashboardSettings =
		uiItemsKeys.length && uiItemsKeys[uiItemsKeys.length - 1] === 'dashboard';

	const showTopDashboard = !uiItemsKeys.length || (topItemsCount > 0 && isDashboardSettings);

	const showMenuBtn = !uiItemsKeys.length || (topItemsCount > 0 && isDashboardSettings);

	const handleMenuPress = useCallback(() => {
		if (!uiItemsKeys.length) {
			dispatch(setUiItemKeys(['settings']));
		}
	}, [uiItemsKeys]);

	return (
		<View
			onLayout={(e) => {
				const { height } = e.nativeEvent.layout;
				setTopAppBarHeight && setTopAppBarHeight(height);
			}}
			style={[styles.bar, styles.zObove]}
		>
			{!showTopDashboard && (
				<Fragment>
					{uiItemsKeys.length && (
						<TouchableHighlight
							style={styles.button}
							underlayColor={theme.colors.elevation.level3}
							onPress={backAction}
						>
							<Icon
								source="arrow-left"
								size={30}
							/>
						</TouchableHighlight>
					)}

					<Text style={theme.fonts.headlineSmall}>{appBarTitle}</Text>
				</Fragment>
			)}

			{showTopDashboard && <DashboardWrapped position="top" />}

			{/* Fix app bar height. because the visible button is absolute and dosen't provide a height */}
			<View
				style={{
					right: 999,
				}}
			>
				<TopAppBarMenu />
			</View>

			{showMenuBtn && (
				<View
					style={{
						position: 'absolute',
						right: 4,
						zIndex: 9,
					}}
				>
					<TopAppBarMenu handleMenuPress={handleMenuPress} />
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	bar: {
		// justifyContent: 'space-between',
		flexDirection: 'row',
		alignItems: 'center',
		position: 'relative',
	},
	zObove: { zIndex: 999 },
	button: {
		padding: 10,
		marginLeft: 5,
		marginRight: 5,
	},
	menu: { minWidth: 175 },
});

export default TopAppBar;
