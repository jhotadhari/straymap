/**
 * External dependencies
 */
import { FC, useCallback, useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme, Text, Icon } from 'react-native-paper';
import { omit, pick } from 'lodash-es';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../../hooks';
import { Line, LineStats as LineStatsType } from '../../types';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { setLineSelected, setLineTemp } from '../../slice';
import LineStats from '../LineStats';
import TagBadge from '../TagBadge';
import IconRouting from '../../../routing/drawerPanels/routing/IconComponent';
import useRoute from '../../../routing/hooks/useRoute';
import useActivateDrawerItem from '../../../drawers/hooks/useActivateDrawerItem';
import { DRAWER_ICON_SIZE } from '../../../../../constants';
import { sharedStyles } from './sharedDeps';

export interface ListRowProps {
	line: Omit<Line, 'geometry'>;
	idx: number;
	isRoutingLine: boolean;
	stats?: LineStatsType;
}

const ListRow: FC<ListRowProps> = ({ line, idx }) => {
	const dispatch = useAppDispatch();

	const activateRoutingDrawerItem = useActivateDrawerItem('routing');

	const theme = useTheme();

	const style: ViewStyle = useMemo(
		() => ({
			...(!idx && { paddingTop: 0 }),
			...(idx % 2 === 1 && { backgroundColor: theme.colors.surfaceDisabled }),
		}),
		[idx, theme]
	);

	const handleEditPress = useCallback(() => {
		dispatch(setLineTemp({ id: line.id }));
	}, [dispatch, line.id]);
	const toggleSelected = useCallback(
		() => dispatch(setLineSelected(line.id)),
		[dispatch, line.id]
	);
	const { line_id: routingLineId, stats: routingStats } = useRoute(['line_id', 'stats']) || {};

	const stats = (line.id !== routingLineId ? line?.stats : routingStats) ?? {};

	const handleActivateRouting = useCallback(
		() => activateRoutingDrawerItem(),
		[activateRoutingDrawerItem]
	);

	return (
		<View style={[sharedStyles.row, style]}>
			{line.id !== routingLineId && (
				<ButtonHighlight
					style={sharedStyles.noShrink}
					mode="text"
					compact={true}
					onPress={toggleSelected}
				>
					<Icon
						source={'map-minus'}
						size={DRAWER_ICON_SIZE}
					/>
				</ButtonHighlight>
			)}

			{line.id === routingLineId && (
				<ButtonHighlight
					style={sharedStyles.noShrink}
					mode="text"
					compact={true}
					onPress={handleActivateRouting}
				>
					<IconRouting color={theme.colors.primary} />
				</ButtonHighlight>
			)}

			<View style={sharedStyles.rowColCenter}>
				<View style={sharedStyles.rowColCenterRow}>
					{line.title && <Text>{line.title}</Text>}
					<Text>{line.created_at}</Text>
				</View>

				<View style={sharedStyles.rowColCenterRow}>
					<LineStats
						stats={omit(stats, ['minZ', 'maxZ'])}
						round={0}
					/>
				</View>
				<View style={sharedStyles.rowColCenterRow}>
					<LineStats
						stats={pick(stats, ['minZ', 'maxZ'])}
						round={0}
					/>
				</View>

				{line?.tags && line?.tags.length > 0 && (
					<View style={sharedStyles.rowColCenterRow}>
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
					mode="text"
					compact={true}
					onPress={handleEditPress}
				>
					<Icon
						source={'cog'}
						size={DRAWER_ICON_SIZE}
					/>
				</ButtonHighlight>
			</View>
		</View>
	);
};
export default ListRow;
