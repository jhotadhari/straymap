/**
 * External dependencies
 */
import { FC, useCallback, useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme, Text, Icon } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { useAppDispatch } from '../../../../store/hooks';
import { Line } from '../../types';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { setLineSelected, setLineTemp } from '../../slice';
import TagBadge from '../TagBadge';
import IconRouting from '../../../routing/drawerPanels/routing/IconComponent';
import useActivateDrawerItem from '../../../drawers/hooks/useActivateDrawerItem';
import { DRAWER_ICON_SIZE } from '../../../../constants';
import { sharedStyles } from './sharedDeps';
import LineStatsCompactRows from '../Stats/LineStatsCompactRows';

export interface ListRowProps {
	line: Omit<Line, 'geometry'>;
	idx: number;
	systemFeatureKey: string | null;
}

const ListRow: FC<ListRowProps> = ({ line, idx, systemFeatureKey }) => {
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
	const stats = line?.stats ?? {};

	const handleActivateRouting = useCallback(
		() => activateRoutingDrawerItem(),
		[activateRoutingDrawerItem]
	);

	return (
		<View style={[sharedStyles.row, style]}>
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

				{systemFeatureKey === null && (
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

				{systemFeatureKey === 'routing' && (
					<ButtonHighlight
						style={sharedStyles.noShrink}
						mode="text"
						compact={true}
						onPress={handleActivateRouting}
					>
						<IconRouting color={theme.colors.primary} />
					</ButtonHighlight>
				)}

				{systemFeatureKey !== null && systemFeatureKey !== 'routing' && (
					<ButtonHighlight
						style={sharedStyles.noShrink}
						mode="text"
						compact={true}
						disabled={true}
					>
						<Icon
							source={'lock'}
							size={DRAWER_ICON_SIZE}
						/>
					</ButtonHighlight>
				)}
			</View>

			<View style={sharedStyles.rowColCenter}>
				{line.title && (
					<View style={sharedStyles.rowColCenterRow}>
						<Text>{line.title}</Text>
					</View>
				)}
				<View style={sharedStyles.rowColCenterRow}>
					<Text>{line.custom_date}</Text>
				</View>

				<LineStatsCompactRows stats={stats} />

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
		</View>
	);
};

export default ListRow;
