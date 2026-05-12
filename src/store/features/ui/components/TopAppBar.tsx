/**
 * External dependencies
 */
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme, Appbar, Menu, Icon } from 'react-native-paper';
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

const TopAppBarMenu = ({ items }: { items: UiItem[] }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const theme = useTheme();

	const [menuVisible, setMenuVisible] = useState(false);

	const isBusy = useAppSelector(selectIsBusy);

	const uiItemsKeys = useAppSelector(selectUiItemKeys);

	const closeMenu = useCallback(() => setMenuVisible(false), []);
	const toggleMenu = useCallback(() => setMenuVisible((menuVisible) => !menuVisible), []);

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

const TopAppBar = ({
	setTopAppBarHeight,
}: {
	setTopAppBarHeight: Dispatch<SetStateAction<number>>;
}) => {
	const { t } = useTranslation();

	const theme = useTheme();

	const dispatch = useAppDispatch();

	const uiItemsKeys = useAppSelector(selectUiItemKeys);

	const appBarTitle = useMemo(
		() =>
			getUiItemsByKey(uiItemsKeys)
				.map((item) => t(item.label))
				.join(' / '),
		[uiItemsKeys]
	);

	const menuItems = useMemo(
		() =>
			getUiItemsByKey([
				'settings',
				'about',
			]),
		[]
	);

	const backAction = useCallback(() => {
		dispatch(setUiItemKeys([...uiItemsKeys].slice(0, Math.max(0, uiItemsKeys.length - 1))));
		return true;
	}, [uiItemsKeys]);

	useEffect(() => {
		const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
		return () => backHandler.remove();
	}, [backAction]);

	return (
		<Appbar
			onLayout={(e) => {
				const { height } = e.nativeEvent.layout;
				setTopAppBarHeight(height);
			}}
			style={[
				styles.justifyBetween,
				styles.zObove,
			]}
		>
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

			<Appbar.Content title={appBarTitle} />

			<TopAppBarMenu items={menuItems} />
		</Appbar>
	);
};

const styles = StyleSheet.create({
	justifyBetween: {
		justifyContent: 'space-between',
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
