/**
 * External dependencies
 */
import React, { useContext, useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import { Button, Icon, useTheme } from 'react-native-paper';
import { ComposedGesture, GestureDetector, GestureType } from 'react-native-gesture-handler';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import * as drawerItems from '../items';
import DrawerContext from '../DrawerContext';
import { DrawerItem } from '../types';
import { handleSize, iconSize } from '../constants';

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
	overwriteDrawerItem?: DrawerItem;
	onPress?: () => void;
	style?: ViewStyle;
}) => {
	const theme = useTheme();

	const { side, activeItemKey } = useContext(DrawerContext);

	const drawerItem = useMemo(
		() =>
			overwriteDrawerItem ??
			get(drawerItems as { [itemKey: string]: DrawerItem }, [itemKey ?? '']),
		[itemKey, overwriteDrawerItem]
	);

	const IconActions = useMemo(() => get(drawerItem, 'IconActions'), [drawerItem]);

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
			width: handleSize,
			height: handleSize + handleSize / 2,
			justifyContent: 'center',
			alignItems: 'center',
			...style,
		}),
		[
			isActive,
			theme,
			side,
			style,
		]
	);

	const handlesNode = useMemo(() => {
		return (
			<View
				style={{
					width: handleSize,
					height: handleSize,
					backgroundColor: isActive ? theme.colors.background : 'transparent',
					borderColor: theme.dark ? theme.colors.background : theme.colors.onBackground,
					borderWidth: 1,
					justifyContent: 'center',
					alignItems: 'center',
					...('left' === side && {
						borderTopRightRadius: '50%',
						borderBottomRightRadius: '50%',
						borderLeftWidth: 0,
					}),
					...('right' === side && {
						borderTopLeftRadius: '50%',
						borderBottomLeftRadius: '50%',
						borderRightWidth: 0,
					}),
				}}
			>
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
							size={iconSize}
							color={color}
						/>
					)}
				</Button>

				{isActive && IconActions && (
					<View
						style={{
							position: 'absolute',
							...('left' === side && {
								left: '100%',
								transform: [{ translateX: 8 }],
							}),
							...('right' === side && {
								left: '-100%',
								transform: [{ translateX: -4 }],
							}),
						}}
					>
						<IconActions
							style={{
								color,
								backgroundColor: theme.colors.background,
								padding: 8,
								borderRadius: theme.roundness,
							}}
						/>
					</View>
				)}
			</View>
		);
	}, [
		IconComponent,
		iconSource,
		color,
		isActive,
		IconActions,
		theme,
		onPress,
	]);

	return (
		<View style={containerStyle}>
			{!panEnabled && handlesNode}
			{panEnabled && <GestureDetector gesture={gesture}>{handlesNode}</GestureDetector>}
		</View>
	);
};

export default DrawerHandle;
