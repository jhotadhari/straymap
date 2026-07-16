/**
 * External dependencies
 */
import { FC, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { pick } from 'lodash-es';

/**
 * Internal dependencies
 */
import LineStats from './LineStats';
import { LineStats as LineStatsType } from '../../types';
import { RenderPart } from './sharedDeps';

const LineStatsCompactRows: FC<{
	stats: LineStatsType;
}> = ({ stats }) => {
	const statsPerRow = useMemo(
		() => [
			pick(stats, ['length']),
			pick(stats, ['downhill', 'uphill']),
			pick(stats, ['minZ', 'maxZ']),
		],
		[stats]
	);

	return statsPerRow.map((st, idx) => (
		<View
			key={idx}
			style={styles.row}
		>
			<LineStats
				stats={st}
				round={0}
				renderParts={statsRenderParts}
				styleStat={styles.stat}
			/>
		</View>
	));
};

const statsRenderParts = ['icon', 'value'] as RenderPart[];

const styles = StyleSheet.create({
	stat: {
		minWidth: 80,
	},
	row: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
});

export default LineStatsCompactRows;
