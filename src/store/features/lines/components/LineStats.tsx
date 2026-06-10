/**
 * External dependencies
 */
import { FC, useMemo, ReactNode, ElementType, PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Icon } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../hooks';
import { LineStats as LineStatsType } from '../types';
import { selectUnitPrefs } from '../../general/selectors';
import { formatDistance, formatHeightDepth } from '../../../../lib/formatting';

const Stat: FC<{
	value: number;
	unitPrefKey: string;
	iconSource?: string;
	round?: number;
	prependStr?: string;
}> = ({ value, unitPrefKey, iconSource, round, prependStr }) => {
	const unitPrefs = useAppSelector(selectUnitPrefs);
	const formatted = useMemo(() => {
		switch (unitPrefKey) {
			case 'distance':
				return formatDistance(value, {
					...unitPrefs[unitPrefKey]!,
					...(undefined !== round && { round }),
				});
			case 'heightDepth':
				return formatHeightDepth(value, {
					...unitPrefs[unitPrefKey]!,
					...(undefined !== round && { round }),
				});
		}
	}, [
		unitPrefs[unitPrefKey],
		value,
		unitPrefKey,
		round,
	]);
	return (
		formatted &&
		formatted.length > 0 && (
			<View style={styles.stat}>
				{prependStr && <Text>{prependStr}</Text>}
				{iconSource && (
					<Icon
						source={iconSource}
						size={16}
					/>
				)}
				<Text>{formatted}</Text>
			</View>
		)
	);
};

const LineStats: FC<{
	stats: LineStatsType;
	round?: number;
	NodeWrapper?: ElementType<PropsWithChildren>;
}> = ({ stats, round, NodeWrapper }) => {
	const nodes = useMemo(() => {
		const newNodes: { [key: string]: ReactNode } = {};

		if (stats?.length) {
			newNodes['distance'] = (
				<Stat
					key="distance"
					value={stats.length}
					round={round}
					unitPrefKey="distance"
				/>
			);
		}
		if (stats?.uphill) {
			newNodes['uphill'] = (
				<Stat
					key="uphill"
					value={stats.uphill}
					round={round}
					unitPrefKey="heightDepth"
					iconSource="arrow-up"
				/>
			);
		}
		if (stats?.downhill) {
			newNodes['downhill'] = (
				<Stat
					key="downhill"
					value={stats.downhill}
					round={round}
					unitPrefKey="heightDepth"
					iconSource="arrow-down"
				/>
			);
		}
		if (stats?.minZ) {
			newNodes['minZ'] = (
				<Stat
					key="minZ"
					prependStr="min"
					value={stats.minZ}
					round={round}
					unitPrefKey="heightDepth"
					iconSource="arrow-down"
				/>
			);
		}
		if (stats?.maxZ) {
			newNodes['maxZ'] = (
				<Stat
					key="maxZ"
					prependStr="max"
					value={stats.maxZ}
					round={round}
					unitPrefKey="heightDepth"
					iconSource="arrow-up"
				/>
			);
		}

		return newNodes;
	}, [stats, round]);

	if (undefined === NodeWrapper) {
		return Object.values(nodes);
	} else {
		return Object.keys(nodes).map((key) => <NodeWrapper key={key}>{nodes[key]}</NodeWrapper>);
	}
};

const styles = StyleSheet.create({
	stat: {
		flexDirection: 'row',
		alignItems: 'center',
		flexWrap: 'nowrap',
	},
});

export default LineStats;
