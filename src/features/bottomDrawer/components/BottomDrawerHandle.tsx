/**
 * External dependencies
 */
import React, { useContext, useMemo } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';
import { ComposedGesture, GestureDetector, GestureType } from 'react-native-gesture-handler';
import { get } from 'lodash-es';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { featureRegistry } from '../../FeatureRegistry';
import BottomDrawerContext from '../BottomDrawerContext';
import { BottomDrawerItem } from '../types';
import {
	BOTTOM_DRAWER_HANDLE_HEIGHT,
	BOTTOM_DRAWER_HANDLE_WIDTH,
	BOTTOM_DRAWER_ICON_SIZE,
	BOTTOM_DRAWER_DEBUG,
} from '../constants';

const BottomDrawerHandle = ({
	itemKey,
	gesture,
	onPress,
}: {
	itemKey: string;
	gesture: ComposedGesture | GestureType;
	onPress?: () => void;
}) => {
	const { t } = useTranslation();

	const { activeItemKey } = useContext(BottomDrawerContext);

	const drawerItem = useMemo(
		() =>
			get(featureRegistry.getBottomDrawerItems() as { [itemKey: string]: BottomDrawerItem }, [
				itemKey ?? '',
			]),
		[itemKey]
	);

	const { IconComponent, iconSource, label } = useMemo(() => {
		return {
			IconComponent: get(drawerItem, 'IconComponent'),
			iconSource: get(drawerItem, 'iconSource'),
			label: get(drawerItem, 'label'),
		};
	}, [drawerItem]);

	const isActive = itemKey && itemKey === activeItemKey;

	const color = useMemo(
		() => (isActive ? BOTTOM_DRAWER_DEBUG.handleIconActive : BOTTOM_DRAWER_DEBUG.handleIcon),
		[isActive]
	);

	const containerStyle: ViewProps['style'] = useMemo(
		() => ({
			width: BOTTOM_DRAWER_HANDLE_WIDTH,
			height: BOTTOM_DRAWER_HANDLE_HEIGHT,
			justifyContent: 'center',
			alignItems: 'center',
		}),
		[]
	);

	const styleHandle = useMemo(
		() => [
			styles.handle,
			{
				backgroundColor: isActive
					? BOTTOM_DRAWER_DEBUG.handleActiveBg
					: BOTTOM_DRAWER_DEBUG.handleInactiveBg,
				borderColor: BOTTOM_DRAWER_DEBUG.handleBorder,
			},
		],
		[isActive]
	);

	return (
		<View style={containerStyle}>
			{/* RNGH 3.x mixed v2/v3 types: ComposedGesture (v3) | GestureType (v2) doesn't resolve against GestureDetector's union; as any is required */}
			<GestureDetector gesture={gesture as any}>
				<View style={styleHandle}>
					<Button
						compact={true}
						{...{
							...(onPress && { onPress }),
						}}
					>
						{IconComponent && (
							<View style={styles.iconComponentWrapper}>
								<IconComponent
									color={color}
									size={BOTTOM_DRAWER_ICON_SIZE}
								/>
							</View>
						)}
						{iconSource && (
							<Icon
								source={iconSource}
								size={BOTTOM_DRAWER_ICON_SIZE}
								color={color}
							/>
						)}
						{!iconSource && !IconComponent && label && (
							<Text style={{ color }}>{t(label)}</Text>
						)}
					</Button>
				</View>
			</GestureDetector>
		</View>
	);
};

const styles = StyleSheet.create({
	iconComponentWrapper: {
		width: BOTTOM_DRAWER_ICON_SIZE,
		height: BOTTOM_DRAWER_ICON_SIZE,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
	},
	handle: {
		width: BOTTOM_DRAWER_HANDLE_WIDTH,
		height: BOTTOM_DRAWER_HANDLE_HEIGHT,
		borderWidth: 1,
		borderTopLeftRadius: '50%',
		borderTopRightRadius: '50%',
		borderBottomWidth: 0,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default React.memo(BottomDrawerHandle);
