/**
 * External dependencies
 */
import React, { useCallback, useContext, useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import { Button, Icon, useTheme } from 'react-native-paper';
import { ComposedGesture, GestureDetector, GestureType } from 'react-native-gesture-handler';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import * as drawerItems from '../items';
import DrawerContext from '../DrawerContext';
import { useAppDispatch } from '../../../hooks';
import { removeItemKey } from '../drawersSlice';
import { DrawerItem } from '../types';

const handleSize = 50;

const DrawerHandle = ({
	index,
	itemKey,
	gesture,
	overwriteDrawerItem,
	onPress,
	onLongPress,
}: {
	index: number;
	itemKey?: string;
	gesture: ComposedGesture | GestureType;
	overwriteDrawerItem?: DrawerItem;
	onPress?: false | ( () => void );
	onLongPress?: false | ( () => void );
}) => {
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const { side, activeItemKey, setActiveItemKey, getIsFullyCollapsed, expand } =
		useContext(DrawerContext);

	const drawerItem = useMemo(
		() => overwriteDrawerItem ?? get(drawerItems as { [itemKey: string]: DrawerItem }, [itemKey ?? '']),
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

	const style: ViewStyle = useMemo(
		() => ({
			position: 'absolute',
			width: handleSize,
			height: handleSize,
			justifyContent: 'center',
			alignItems: 'center',
			top: index * handleSize + (index + 1) * (handleSize / 2),
			backgroundColor: isActive ? theme.colors.background : 'transparent',
			borderColor: theme.dark ? theme.colors.background : theme.colors.onBackground,
			borderWidth: 1,
			...('left' === side && {
				right: 0,
				transform: [
					{ translateX: '100%' },
				],
				borderTopRightRadius: '50%',
				borderBottomRightRadius: '50%',
				borderLeftWidth: 0,
			}),
			...('right' === side && {
				left: 0,
				transform: [
					{ translateX: '-100%' },
				],
				borderTopLeftRadius: '50%',
				borderBottomLeftRadius: '50%',
				borderRightWidth: 0,
			}),
		}),
		[
			index,
			isActive,
			theme,
			side,
		]
	);

	const handlePress = useCallback(() => {
		if ( onPress instanceof Function ) {
			onPress();
			return;
		} else if ( false === onPress ) {
			return;
		}

		if (isActive) {
			expand(getIsFullyCollapsed());
		} else if (itemKey) {
			setActiveItemKey(itemKey);
			if (getIsFullyCollapsed()) {
				expand(true);
			}
		}
	}, [isActive, itemKey, onPress]);

	const handleLongPress = useCallback(() => {
		// ??? should enable for sorting items.

		// ??? Should prompt some warning before removing


		if ( onLongPress instanceof Function ) {
			onLongPress();
			return;
		} else if ( false === onLongPress ) {
			return;
		}

		if (isActive) {
			expand(false);
		}

		itemKey &&
			dispatch(
				removeItemKey({
					side,
					itemKey,
				})
			);

	}, [
		isActive,
		side,
		itemKey,
		onLongPress,
	]);

	return (
		<GestureDetector
			key={index}
			gesture={gesture}
		>
			<View style={style}>
				<Button
					onPress={handlePress}
					onLongPress={handleLongPress}
					compact={true}
				>
					{IconComponent && <IconComponent color={color} />}
					{iconSource && (
						<Icon
							source={iconSource}
							size={25}
							color={color}
						/>
					)}
				</Button>

				{isActive && IconActions && (
					<View
						style={{
							position: 'absolute',
							left: '-100%', // ??? turn around for otherside
							transform: [{ translateX: -20 }], // ??? turn around for otherside
						}}
					>
						<IconActions
							style={{
								color,
								backgroundColor: theme.colors.background,
							}}
						/>
					</View>
				)}
			</View>
		</GestureDetector>
	);
};

export default DrawerHandle;
