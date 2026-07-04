/**
 * External dependencies
 */
import React, { useContext, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Button, Icon, useTheme } from 'react-native-paper';
import { ComposedGesture, GestureDetector, GestureType } from 'react-native-gesture-handler';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { featureRegistry } from '../../FeatureRegistry';
import DrawerContext from '../DrawerContext';
import { DrawerPanel } from '../types';
import { DRAWER_HANDLE_SIZE, DRAWER_ICON_SIZE } from '../constants';

const DrawerHandle = ({
	itemKey,
	panEnabled,
	gesture,
	overwriteDrawerItem,
	onPress,
	style,
}: {
	panEnabled: boolean;
	itemKey?: string;
	gesture: ComposedGesture | GestureType;
	overwriteDrawerItem?: DrawerPanel;
	onPress?: () => void;
	style?: ViewStyle;
}) => {
	const theme = useTheme();

	const { side, activeItemKey } = useContext(DrawerContext);

	const drawerItem = useMemo(
		() =>
			overwriteDrawerItem ??
			get(featureRegistry.getDrawerPanels() as { [itemKey: string]: DrawerPanel }, [
				itemKey ?? '',
			]),
		[itemKey, overwriteDrawerItem]
	);

	const { IconComponent, iconSource } = useMemo(() => {
		const IconComponent = get(drawerItem, 'IconComponent');
		const iconSource = IconComponent ? undefined : get(drawerItem, 'iconSource');
		return {
			IconComponent,
			iconSource,
		};
	}, [drawerItem]);

	const isActive = itemKey && itemKey === activeItemKey;

	const color = useMemo(() => {
		return isActive
			? theme.colors.onBackground
			: theme.dark
				? theme.colors.background
				: theme.colors.onBackground;
	}, [isActive, theme]);

	const containerStyle: ViewStyle = useMemo(
		() => ({
			width: DRAWER_HANDLE_SIZE,
			height: DRAWER_HANDLE_SIZE + DRAWER_HANDLE_SIZE / 2,
			justifyContent: 'center',
			alignItems: 'center',
			...style,
		}),
		[style]
	);

	const styleHandle = useMemo(
		() => [
			styles.handle,
			{
				backgroundColor: isActive ? theme.colors.background : 'transparent',
				borderColor: theme.dark ? theme.colors.background : theme.colors.onBackground,
			},
			'left' === side && styles.handleLeft,
			'right' === side && styles.handleRight,
		],
		[
			isActive,
			theme,
			side,
		]
	);

	const handlesNode = useMemo(() => {
		return (
			<View style={styleHandle}>
				<Button
					compact={true}
					{...{
						...(onPress && { onPress }),
					}}
				>
					{IconComponent && <IconComponent color={color} />}
					{iconSource && (
						<Icon
							source={iconSource}
							size={DRAWER_ICON_SIZE}
							color={color}
						/>
					)}
				</Button>
			</View>
		);
	}, [
		IconComponent,
		iconSource,
		color,
		styleHandle,
		onPress,
	]);

	return (
		<View style={containerStyle}>
			{!panEnabled && handlesNode}
			{panEnabled && (
				<GestureDetector gesture={gesture as any}>{handlesNode}</GestureDetector>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	handle: {
		width: DRAWER_HANDLE_SIZE,
		height: DRAWER_HANDLE_SIZE,
		borderWidth: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	handleLeft: {
		borderTopRightRadius: '50%',
		borderBottomRightRadius: '50%',
		borderLeftWidth: 0,
	},
	handleRight: {
		borderTopLeftRadius: '50%',
		borderBottomLeftRadius: '50%',
		borderRightWidth: 0,
	},
});

export default DrawerHandle;
