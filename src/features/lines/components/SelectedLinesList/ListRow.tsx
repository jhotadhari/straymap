/**
 * External dependencies
 */
import { FC, memo, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
	ScrollView,
	StyleProp,
	StyleSheet,
	TouchableHighlight,
	View,
	ViewStyle,
} from 'react-native';
import { useTheme, Text, Icon } from 'react-native-paper';
import { useMap } from 'react-native-mapsforge-vtm';
import Popover from 'react-native-popover-view';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import dayjs from '../../../../lib/dayjs';
import { useAppDispatch, useAppSelector, useLineColorRamps } from '../../../../store/hooks';
import { Line, LineStats as LineStatsType } from '../../types';
import DrawerContext from '../../../drawers/DrawerContext';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import MenuItem from '../../../../components/generic/wrapper/MenuItem';
import { setLineSelected, setLineTemp, setLineColor, setLineRamp } from '../../slice';
import { selectLineColor } from '../../selectors';
import { SLOPE_COLOR_RAMP } from '../../../routing/constants';
import TagBadge from '../TagBadge';
import IconRouting from '../../../routing/drawerPanels/routing/IconComponent';
import { selectIsRecording } from '../../../trackRecording/selectors';
import { selectFollowingLineId } from '../../../lineFollow/selectors';
import useActivateDrawerItem from '../../../drawers/hooks/useActivateDrawerItem';
import { DRAWER_ICON_SIZE, MAP_ANIMATION_PADDING_PX, PALETTE_COLORS } from '../../../../constants';
import { sharedStyles } from './sharedDeps';
import ColorRampColumn from './ColorRampColumn';
import ColorRampGradient from '../ColorRampGradient';
import LineStatsCompactRows from '../Stats/LineStatsCompactRows';
import FollowDistanceBadge from './FollowDistanceBadge';
import { bbox as turfBbox } from '@turf/turf';
import { AppContext } from '../../../../Context';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { selectDateTimeFormat } from '../../../general/selectors';
import IconCustom from '../../../../components/generic/primitives/IconCustom';
import RecordingCenterButton from '../LinesTable/RecordingCenterButton';

export interface ListRowProps {
	line: Omit<Line, 'geometry'>;
	idx: number;
	systemFeatureKey: string | null;
	isUnderCenter?: boolean;
}

// Shared by every stat-less ListRow — frozen so a future consumer
// mutating `stats` can't corrupt all rows at once (only ever read via
// lodash pick).
const EMPTY_STATS = Object.freeze({} as LineStatsType);

const ListRow: FC<ListRowProps> = ({ line, idx, systemFeatureKey, isUnderCenter }) => {
	const dispatch = useAppDispatch();

	const { t } = useTranslation();

	const isRecording = useAppSelector(selectIsRecording);
	const followingLineId = useAppSelector(selectFollowingLineId);
	const isFollowed = followingLineId === line.id;

	const { mapViewNativeNodeHandle } = useContext(AppContext);

	const { flyToBounds } = useMap(mapViewNativeNodeHandle);

	const activateRoutingDrawerItem = useActivateDrawerItem('routing');

	const { side } = useContext(DrawerContext);

	const theme = useTheme();

	const dateTimeFormat = useAppSelector(selectDateTimeFormat);

	const [colorMenuVisible, setColorMenuVisible] = useState(false);
	const colorAnchorRef = useRef<View>(null);

	// Subscribe to this row's colour only — the record-level selector
	// would re-render every row on any single colour change.
	const lineColor = useAppSelector(selectLineColor(line.id));
	const fallbackColor = PALETTE_COLORS[0].bg;

	// Lines rendered with LayerPathColorRamp (feature-declared per-line
	// colour ramp) show the ramp legend instead of the solid palette
	// colour. For non-system lines the ramp is user-toggleable; system
	// lines are feature-rendered and get no colour controls.
	const lineColorRamps = useLineColorRamps();
	const colorRamp = lineColorRamps[line.id];
	const isSystemLine = systemFeatureKey !== null;
	const isRecordingLine = systemFeatureKey === 'trackRecording';

	// The slope ramp requires elevation data — lines without Z would
	// render flat green, so the toggle is hidden unless already active.
	const hasElevation = line?.stats?.minZ != null;

	const dismissColorMenu = useCallback(() => setColorMenuVisible(false), []);

	const handleOpenColorMenu = useCallback(() => setColorMenuVisible(true), []);

	const handleColorSelect = useCallback(
		(color: string) => {
			dispatch(setLineColor({ lineId: line.id, color }));
			// Selecting a palette colour restores solid rendering.
			dispatch(setLineRamp({ lineId: line.id, rampKey: null }));
			dismissColorMenu();
		},
		[
			dispatch,
			line.id,
			dismissColorMenu,
		]
	);

	const handleToggleRamp = useCallback(() => {
		dispatch(
			setLineRamp({
				lineId: line.id,
				rampKey: colorRamp ? null : 'slope',
			})
		);
		dismissColorMenu();
	}, [
		dispatch,
		line.id,
		colorRamp,
		dismissColorMenu,
	]);

	const dynamicStyles = useMemo(
		() => ({
			container: [
				sharedStyles.row,
				!idx && { paddingTop: 0 },
				idx % 2 === 1 && { backgroundColor: theme.colors.surfaceDisabled },
				'left' === side && {
					flexDirection: 'row-reverse',
					justifyContent: 'flex-end',
					paddingRight: 16,
				},
				'right' === side && {
					justifyContent: 'flex-start',
					flexDirection: 'row',
					paddingLeft: 16,
				},
			] as StyleProp<ViewStyle>,
			rowColInfoRow: [
				sharedStyles.rowColInfoRow,
				'left' === side && {
					flexDirection: 'row-reverse',
				},
			] as StyleProp<ViewStyle>,
		}),
		[
			idx,
			theme,
			side,
		]
	);

	const handleEditPress = useCallback(() => {
		dispatch(setLineTemp({ id: line.id }));
	}, [dispatch, line.id]);

	const toggleSelected = useCallback(
		() => dispatch(setLineSelected(line.id)),
		[dispatch, line.id]
	);
	const stats = line?.stats ?? EMPTY_STATS;

	const styleColorColumnInner = useMemo(
		() => [
			sharedStyles.colorColumnInner,
			colorRamp
				? undefined
				: {
						backgroundColor: (isRecordingLine
							? PALETTE_COLORS[0].bg
							: (lineColor ?? fallbackColor)) as `#${string}`,
					},
		],
		[
			lineColor,
			fallbackColor,
			colorRamp,
			isRecordingLine,
		]
	);

	// Widen the color bar while the map center is over this line — the
	// column's total width is fixed, so the animation consumes padding
	// instead of shifting the row layout. Scaled (not width-animated):
	// reanimated width changes bypass Yoga and children keep their
	// laid-out sizes, so the ramp legend's SVG would not grow with them.
	const colorColumnAnimatedStyle = useAnimatedStyle(() => ({
		transform: [
			{
				scaleX: withTiming(isUnderCenter ? 3 : 1, { duration: 150 }),
			},
		],
		transformOrigin: 'left',
	}));

	const handleActivate = useCallback(() => {
		if (line?.envelope) {
			const bbox = turfBbox(line.envelope);
			// no need to close ui items,
			// because never ui items are visible simultanes with this component.
			// other occurrences of flyToBounds have to call `dispatch(setUiItemKeys([]));`.
			flyToBounds(bbox, { paddingPx: MAP_ANIMATION_PADDING_PX });
		}
	}, [
		line,
		flyToBounds,
	]);

	const handleActivateRouting = useCallback(() => {
		activateRoutingDrawerItem();
		handleActivate();
	}, [
		activateRoutingDrawerItem,
		handleActivate,
	]);

	const { nestedIconColor, ...buttonPropsAny } = useButtonProps({
		mode: 'text',
	});

	const popoverStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			borderWidth: 1,
			borderColor: theme.colors.outline,
		}),
		[theme]
	);

	return (
		<View style={dynamicStyles.container}>
			<TouchableHighlight
				onPress={isSystemLine ? undefined : handleOpenColorMenu}
				disabled={isSystemLine}
				style={
					'left' === side ? sharedStyles.colorColumnLeft : sharedStyles.colorColumnRight
				}
			>
				<View
					ref={colorAnchorRef}
					style={colorCircle.anchorWrapper}
				>
					<Animated.View
						style={[
							styleColorColumnInner,
							colorColumnAnimatedStyle,
						]}
					>
						{colorRamp && <ColorRampColumn ramp={colorRamp} />}
					</Animated.View>
				</View>
			</TouchableHighlight>

			{colorAnchorRef.current && (
				<Popover
					popoverStyle={popoverStyle}
					arrowSize={arrowSize}
					isVisible={colorMenuVisible}
					onRequestClose={dismissColorMenu}
					from={colorAnchorRef as React.RefObject<React.Component<{}, {}, any>>}
					animationConfig={animationConfig}
				>
					<ScrollView>
						{colorMenuVisible && (
							<View>
								{(colorRamp || hasElevation) && (
									<MenuItem
										active={!!colorRamp}
										IconComponent={() => (
											<View style={colorCircle.rampThumb}>
												<ColorRampGradient ramp={SLOPE_COLOR_RAMP} />
											</View>
										)}
										title={t('lines.colorRamp')}
										onPress={handleToggleRamp}
									/>
								)}
								{PALETTE_COLORS.map((palette) => (
									<MenuItem
										key={palette.bg}
										IconComponent={() => (
											<View
												style={[
													colorCircle.circle,
													{
														backgroundColor: palette.bg as `#${string}`,
													},
												]}
											/>
										)}
										onPress={() => handleColorSelect(palette.bg)}
									/>
								))}
							</View>
						)}
					</ScrollView>
				</Popover>
			)}

			<View style={sharedStyles.rowColInfo}>
				{line.title && (
					<View style={dynamicStyles.rowColInfoRow}>
						<Text
							numberOfLines={1}
							ellipsizeMode="tail"
						>
							{line.title}
						</Text>
					</View>
				)}
				<View style={dynamicStyles.rowColInfoRow}>
					<Text
						numberOfLines={1}
						ellipsizeMode="tail"
					>
						{line.custom_date ? dayjs(line.custom_date).format(dateTimeFormat) : ''}
					</Text>
				</View>

				<LineStatsCompactRows
					stats={stats}
					reverse={'left' === side}
					firstRowExtra={
						isFollowed ? <FollowDistanceBadge lineId={line.id} /> : undefined
					}
				/>

				{line?.tags && line?.tags.length > 0 && (
					<View style={dynamicStyles.rowColInfoRow}>
						{line.tags.map((tag) => (
							<TagBadge
								key={tag.id}
								tag={tag}
							/>
						))}
					</View>
				)}
			</View>

			<View style={sharedStyles.noShrink}>
				<ButtonHighlight
					{...buttonPropsAny}
					compact={true}
					onPress={handleEditPress}
				>
					<IconCustom
						name="route_cog"
						size={DRAWER_ICON_SIZE}
						color={nestedIconColor}
					/>
				</ButtonHighlight>

				{systemFeatureKey === null && (
					<ButtonHighlight
						{...buttonPropsAny}
						compact={true}
						onPress={toggleSelected}
					>
						<Icon
							source={'map-minus'}
							size={DRAWER_ICON_SIZE}
							color={nestedIconColor}
						/>
					</ButtonHighlight>
				)}

				{systemFeatureKey === 'trackRecording' && !isRecording && (
					// Paused recording: removing it from the map releases
					// the paused recording mode — re-adding renders it as
					// a normal line.
					<ButtonHighlight
						{...buttonPropsAny}
						compact={true}
						onPress={toggleSelected}
					>
						<Icon
							source={'map-minus'}
							size={DRAWER_ICON_SIZE}
							color={nestedIconColor}
						/>
					</ButtonHighlight>
				)}

				{systemFeatureKey === 'routing' && (
					<ButtonHighlight
						{...buttonPropsAny}
						compact={true}
						onPress={handleActivateRouting}
					>
						<IconRouting
							color={theme.colors.primary} // system lines primary.
						/>
					</ButtonHighlight>
				)}

				{systemFeatureKey !== null && systemFeatureKey !== 'routing' && isRecording && (
					// Recording indicator for the active track-recording line.
					// Centers the map on the last GNSS position and opens the
					// tracking drawer panel. Same button shell as the other
					// row icons so the dot stays centered under them.
					<RecordingCenterButton />
				)}
			</View>
		</View>
	);
};

const animationConfig = {
	duration: 0,
};
const arrowSize = { height: 0, width: 0 };

const colorCircle = StyleSheet.create({
	circle: {
		width: 24,
		height: 24,
		borderRadius: 12,
	},
	rampThumb: {
		width: 8,
		height: 24,
		borderRadius: 2,
		overflow: 'hidden',
	},
	anchorWrapper: {
		flex: 1,
		height: '100%',
		alignItems: 'flex-start',
	},
});

export default memo(ListRow);