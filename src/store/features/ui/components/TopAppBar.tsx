/**
 * External dependencies
 */
import { FC, Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTheme, Appbar, Menu, Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { View, BackHandler, TouchableHighlight, StyleSheet } from 'react-native';

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

const TopAppBarMenu: FC<{ items: UiItem[] }> = ({ items }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const theme = useTheme();

	const [menuVisible, setMenuVisible] = useState(false);

	const isBusy = useAppSelector(selectIsBusy);

	const uiItemsKeys = useAppSelector(selectUiItemKeys);

	const closeMenu = useCallback(() => setMenuVisible(false), []);
	const toggleMenu = useCallback(() => setMenuVisible((menuVisible) => !menuVisible), []);

	const backAction = useCallback(() => {
		if (menuVisible) {
			closeMenu();
			return true;
		}
		return false;
	}, [menuVisible, closeMenu]);

	useEffect(() => {
		const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
		return () => backHandler.remove();
	}, [backAction]);

	const anchor = useMemo(
		() => (
			<TouchableHighlight
				style={styles.button}
				underlayColor={theme.colors.elevation.level3}
				onPress={toggleMenu}
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
		),
		[
			theme,
			isBusy,
		]
	);

	return (
		<Menu
			contentStyle={{
				borderColor: theme.colors.outline,
				borderWidth: 1,
			}}
			style={styles.menu}
			visible={menuVisible}
			onDismiss={() => closeMenu()}
			anchor={anchor}
		>
			{[...items].map((item, index) => {
				return (
					<MenuItem
						key={index}
						onPress={() => {
							dispatch(
								setUiItemKeys([
									item.key,
								])
							);
							closeMenu();
						}}
						leadingIcon={item?.icon}
						title={t(item.label)}
						active={uiItemsKeys.includes(item.key)}
					/>
				);
			})}
		</Menu>
	);
};

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
		[uiItemsKeys,t]
	);

	const menuItems = useMemo(
		() =>
			getUiItemsByKey([
				'settings',
				'about',
			]),
		[t]
	);

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

	const showTopDashboard =
		!uiItemsKeys.length ||
		(topItemsCount > 0 && uiItemsKeys[uiItemsKeys.length - 1] === 'dashboard');

	return (
		<View
			onLayout={(e) => {
				const { height } = e.nativeEvent.layout;
				setTopAppBarHeight && setTopAppBarHeight(height);
			}}
			style={[
				styles.bar,
				styles.zObove,
			]}
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
				<TopAppBarMenu items={menuItems} />
			</View>

			<View
				style={{
					position: 'absolute',
					right: 4,
					zIndex: 9,
				}}
			>
				<TopAppBarMenu items={menuItems} />
			</View>
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
