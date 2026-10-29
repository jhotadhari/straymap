/**
 * External dependencies
 */
import { FC, ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { pick } from 'lodash-es';

/**
 * Internal dependencies
 */
import LineStats from './LineStats';
import { LineStats as LineStatsType } from '../../types';
import { RenderPart } from './sharedDeps';

const LineStatsCompactRows: FC<{
	stats: LineStatsType;
	reverse?: boolean;
	/** Optional node appended to the first (distance) statistics row. */
	firstRowExtra?: ReactNode;
}> = ({ stats, reverse, firstRowExtra }) => {
	const statsPerRow = useMemo(
		() => [
			pick(stats, ['length']),
			pick(stats, ['downhill', 'uphill']),
			pick(stats, ['minZ', 'maxZ']),
		],
		[stats]
	);

	const style: StyleProp<ViewStyle> = useMemo(
		() => [
			styles.row,
			reverse && {
				justifyContent: 'flex-end',
			},
		],
		[reverse]
	);

	const styleStat: StyleProp<ViewStyle> = useMemo(
		() => [
			styles.stat,
			reverse && {
				justifyContent: 'flex-end',
			},
		],
		[reverse]
	);

	return (
		<>
			{statsPerRow.map((st, idx) => (
				<View
					key={idx}
					style={style}
				>
					{idx === 0 && reverse && firstRowExtra}
					<LineStats
						stats={st}
						round={0}
						renderParts={statsRenderParts}
						styleStat={styleStat}
					/>
					{idx === 0 && !reverse && firstRowExtra}
				</View>
			))}
		</>
	);
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
