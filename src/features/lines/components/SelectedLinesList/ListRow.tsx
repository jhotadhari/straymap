/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme, Text, Icon } from 'react-native-paper';
import { useMap } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../../store/hooks';
import { Line } from '../../types';
import DrawerContext from '../../../drawers/DrawerContext';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { setLineSelected, setLineTemp } from '../../slice';
import TagBadge from '../TagBadge';
import IconRouting from '../../../routing/drawerPanels/routing/IconComponent';
import useActivateDrawerItem from '../../../drawers/hooks/useActivateDrawerItem';
import { DRAWER_ICON_SIZE, MAP_ANIMATION_PADDING_PX } from '../../../../constants';
import { sharedStyles } from './sharedDeps';
import LineStatsCompactRows from '../Stats/LineStatsCompactRows';
import { bbox as turfBbox } from '@turf/turf';
import { AppContext } from '../../../../Context';
import { useButtonProps } from '../../../../compose/useButtonProps';
import IconCustom from '../../../../components/generic/primitives/IconCustom';

export interface ListRowProps {
	line: Omit<Line, 'geometry'>;
	idx: number;
	systemFeatureKey: string | null;
}

const ListRow: FC<ListRowProps> = ({ line, idx, systemFeatureKey }) => {
	const dispatch = useAppDispatch();

	const { mapViewNativeNodeHandle } = useContext(AppContext);

	const { flyToBounds } = useMap(mapViewNativeNodeHandle);

	const activateRoutingDrawerItem = useActivateDrawerItem('routing');
	const activateTrackingDrawerItem = useActivateDrawerItem('trackRecording');

	const { side } = useContext(DrawerContext);

	const theme = useTheme();

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
	const stats = line?.stats ?? {};

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

	const handleActivateTracking = useCallback(() => {
		activateTrackingDrawerItem();
		handleActivate();
	}, [
		activateTrackingDrawerItem,
		handleActivate,
	]);

	const { nestedIconColor, ...buttonPropsAny } = useButtonProps({
		mode: 'text',
	});
	return (
		<View style={dynamicStyles.container}>
			<View style={sharedStyles.rowColInfo}>
				{line.title && (
					<View style={dynamicStyles.rowColInfoRow}>
						<Text>{line.title}</Text>
					</View>
				)}
				<View style={dynamicStyles.rowColInfoRow}>
					<Text>{line.custom_date}</Text>
				</View>

				<LineStatsCompactRows
					stats={stats}
					reverse={'left' === side}
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

				{systemFeatureKey !== null && systemFeatureKey !== 'routing' && (
					<ButtonHighlight
						{...buttonPropsAny}
						compact={true}
						onPress={handleActivateTracking}
					>
						<Icon
							source={'record-rec'} // same src/features/trackRecording/drawerPanels/trackRecordingDrawerItem.tsx
							size={DRAWER_ICON_SIZE}
							color={theme.colors.primary} // system lines primary.
						/>
					</ButtonHighlight>
				)}
			</View>
		</View>
	);
};

export default ListRow;
