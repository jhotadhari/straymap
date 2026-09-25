/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import {
	ComposedGesture,
	Gesture,
	GestureDetector,
	GestureType,
} from 'react-native-gesture-handler';
import Animated, {
	Extrapolation,
	interpolate,
	interpolateColor,
	runOnJS,
	useAnimatedStyle,
	type SharedValue,
} from 'react-native-reanimated';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import BottomDrawerContext from '../BottomDrawerContext';
import BottomDrawerMenu from './BottomDrawerMenu';
import { getBottomDrawerItem } from '../dynamicItems';
import { useAppSelector } from '../../../store/hooks';
import { selectItemKeys } from '../selectors';
import { MenuActionOption } from '../../../types';
import { useProfileItemLabels } from '../../altitudeProfile/hooks/useProfileItemLabels';
import {
	BOTTOM_DRAWER_HANDLE_HEIGHT,
	BOTTOM_DRAWER_HANDLE_WIDTH,
	BOTTOM_DRAWER_ICON_SIZE,
	BOTTOM_DRAWER_GRAB_HEIGHT,
	BOTTOM_DRAWER_GRAB_WIDTH,
	BOTTOM_DRAWER_MORPH_DISTANCE,
	BOTTOM_DRAWER_TOUCH_AREA_WIDTH,
} from '../constants';

const BottomDrawerHandle: FC<{
	gesture: ComposedGesture | GestureType;
	heightSv: SharedValue<number>;
}> = ({ gesture, heightSv }) => {
	const theme = useTheme();

	const itemKeys = useAppSelector(selectItemKeys);

	const { activeItemKey, setActiveItemKey, expand, getIsFullyCollapsed } =
		useContext(BottomDrawerContext);

	const [menuVisible, setMenuVisible] = useState(false);
	const anchorRef = useRef<View>(null);

	// The single handle shows the active content. Fall back to the first
	// available content while nothing has been activated yet.
	const itemKey = activeItemKey ?? itemKeys[0];

	const profileLabels = useProfileItemLabels();

	const drawerItem = useMemo(() => getBottomDrawerItem(itemKey ?? ''), [itemKey]);

	const { IconComponent, iconSource } = useMemo(() => {
		return {
			IconComponent: get(drawerItem, 'IconComponent'),
			iconSource: get(drawerItem, 'iconSource'),
		};
	}, [drawerItem]);

	// ── Morph animation (pill ↔ grab line), driven by the drawer's height ──
	// The layer is anchored at the drawer's top edge (static translateY).
	// The handle is bottom-aligned and shrinks as it opens; a slight downward
	// translateY keeps the fully-open line vertically centered on the drawer
	// content's top border, while the closed pill keeps its 1px junction
	// overlap.
	const handleStyle = useAnimatedStyle(() => {
		const p = heightSv.value;
		return {
			backgroundColor: interpolateColor(
				p,
				[0, BOTTOM_DRAWER_MORPH_DISTANCE],
				[theme.colors.background, theme.colors.outline]
			),
			width: interpolate(
				p,
				[0, BOTTOM_DRAWER_MORPH_DISTANCE],
				[BOTTOM_DRAWER_HANDLE_WIDTH, BOTTOM_DRAWER_GRAB_WIDTH],
				Extrapolation.CLAMP
			),
			height: interpolate(
				p,
				[0, BOTTOM_DRAWER_MORPH_DISTANCE],
				[BOTTOM_DRAWER_HANDLE_HEIGHT, BOTTOM_DRAWER_GRAB_HEIGHT],
				Extrapolation.CLAMP
			),
			transform: [
				{
					translateY: interpolate(
						p,
						[0, BOTTOM_DRAWER_MORPH_DISTANCE],
						[0, BOTTOM_DRAWER_GRAB_HEIGHT / 2 - 1],
						Extrapolation.CLAMP
					),
				},
			],
			borderBottomWidth: interpolate(
				p,
				[0, BOTTOM_DRAWER_MORPH_DISTANCE],
				[0, 1],
				Extrapolation.CLAMP
			),
			borderTopLeftRadius: interpolate(
				p,
				[0, BOTTOM_DRAWER_MORPH_DISTANCE],
				[BOTTOM_DRAWER_HANDLE_WIDTH / 2, BOTTOM_DRAWER_GRAB_HEIGHT / 2],
				Extrapolation.CLAMP
			),
			borderTopRightRadius: interpolate(
				p,
				[0, BOTTOM_DRAWER_MORPH_DISTANCE],
				[BOTTOM_DRAWER_HANDLE_WIDTH / 2, BOTTOM_DRAWER_GRAB_HEIGHT / 2],
				Extrapolation.CLAMP
			),
			borderBottomLeftRadius: interpolate(
				p,
				[0, BOTTOM_DRAWER_MORPH_DISTANCE],
				[0, BOTTOM_DRAWER_GRAB_HEIGHT / 2],
				Extrapolation.CLAMP
			),
			borderBottomRightRadius: interpolate(
				p,
				[0, BOTTOM_DRAWER_MORPH_DISTANCE],
				[0, BOTTOM_DRAWER_GRAB_HEIGHT / 2],
				Extrapolation.CLAMP
			),
		};
	}, [theme]);

	const iconStyle = useAnimatedStyle(() => ({
		opacity: interpolate(
			heightSv.value,
			[0, BOTTOM_DRAWER_MORPH_DISTANCE * 0.66],
			[1, 0],
			Extrapolation.CLAMP
		),
	}));

	// ── Gestures: tap toggles, vertical pan drags, long-press opens the menu ──
	const handleToggle = useCallback(() => {
		expand(getIsFullyCollapsed());
	}, [expand, getIsFullyCollapsed]);

	const tapGesture = useMemo(
		() =>
			Gesture.Tap().onEnd((_event, success) => {
				if (success) {
					runOnJS(handleToggle)();
				}
			}),
		[handleToggle]
	);

	const longPressGesture = useMemo(
		() =>
			Gesture.LongPress()
				.minDuration(350)
				// onStart only fires once the long-press activates (movement fails it).
				.onStart(() => {
					runOnJS(setMenuVisible)(true);
				}),
		[]
	);

	const composedGesture = useMemo(
		() => Gesture.Race(gesture as any, longPressGesture, tapGesture),
		[
			gesture,
			longPressGesture,
			tapGesture,
		]
	);

	const menuOptions = useMemo(
		() =>
			itemKeys.map((key): MenuActionOption => {
				const item = getBottomDrawerItem(key);
				return {
					key,
					label: item?.label ?? profileLabels[key] ?? key,
					leadingIcon: item?.iconSource,
					IconComponent: item?.IconComponent,
					cb: () => {
						setActiveItemKey(key);
						if (getIsFullyCollapsed()) {
							expand(true);
						}
					},
				};
			}),
		[
			itemKeys,
			profileLabels,
			setActiveItemKey,
			getIsFullyCollapsed,
			expand,
		]
	);

	const handleContainerStyle: ViewProps['style'] = useMemo(
		() => ({
			width: BOTTOM_DRAWER_TOUCH_AREA_WIDTH,
			height: BOTTOM_DRAWER_HANDLE_HEIGHT,
			justifyContent: 'flex-end',
			alignItems: 'center',
		}),
		[]
	);

	const styleHandle = useMemo(
		() => [
			styles.handle,
			{
				backgroundColor: theme.colors.background,
				borderColor: theme.colors.outline,
			},
		],
		[theme]
	);

	return (
		<>
			<Animated.View
				style={styles.layer}
				pointerEvents="box-none"
			>
				<GestureDetector gesture={composedGesture as any}>
					<View style={handleContainerStyle}>
						{/* Plain (non-collapsable) wrapper anchors the popover to the
							visual handle's rect — an Animated.View ref would yield the
							component instance, not a measurable host node. */}
						<View
							ref={anchorRef}
							collapsable={false}
						>
							<Animated.View style={[styleHandle, handleStyle]}>
								<Animated.View style={[styles.iconWrapper, iconStyle]}>
									{IconComponent && (
										<IconComponent
											color={theme.colors.onBackground}
											size={BOTTOM_DRAWER_ICON_SIZE}
										/>
									)}
									{iconSource && (
										<Icon
											source={iconSource}
											size={BOTTOM_DRAWER_ICON_SIZE}
											color={theme.colors.onBackground}
										/>
									)}
								</Animated.View>
							</Animated.View>
						</View>
					</View>
				</GestureDetector>
			</Animated.View>

			<BottomDrawerMenu
				visible={menuVisible}
				setVisible={setMenuVisible}
				from={anchorRef}
				options={menuOptions}
				activeKey={activeItemKey}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	layer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: BOTTOM_DRAWER_HANDLE_HEIGHT,
		alignItems: 'center',
		// Poke up above the drawer's top edge so the handle overlaps the map.
		// -1px overlap closes the junction with the drawer content (no gap).
		transform: [{ translateY: -(BOTTOM_DRAWER_HANDLE_HEIGHT - 1) }],
	},
	iconWrapper: {
		width: BOTTOM_DRAWER_ICON_SIZE,
		height: BOTTOM_DRAWER_ICON_SIZE,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
	},
	handle: {
		borderWidth: 1,
		borderBottomWidth: 0,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default BottomDrawerHandle;
