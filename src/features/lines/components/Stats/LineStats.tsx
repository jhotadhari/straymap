/**
 * External dependencies
 */
import { FC, useMemo, ReactNode, ElementType, PropsWithChildren } from 'react';
import { ViewProps } from 'react-native';

/**
 * Internal dependencies
 */
import { LineStats as LineStatsType } from '../../types';
import { defaultRenderParts, RenderPart } from './sharedDeps';
import LineStat from './LineStat';

const LineStats: FC<{
	stats: LineStatsType;
	round?: number;
	NodeWrapper?: ElementType<PropsWithChildren>;
	styleStat?: ViewProps['style'];
	renderParts: RenderPart[];
}> = ({ stats, round, NodeWrapper, styleStat, renderParts = defaultRenderParts }) => {
	const nodes = useMemo(() => {
		const newNodes: { [key: string]: ReactNode } = {};

		if (stats?.length) {
			newNodes['distance'] = (
				<LineStat
					key="distance"
					columnKey="length"
					value={stats.length}
					round={round}
					renderParts={renderParts}
					style={styleStat}
				/>
			);
		}
		if (stats?.uphill) {
			newNodes['uphill'] = (
				<LineStat
					key="uphill"
					columnKey="uphill"
					value={stats.uphill}
					round={round}
					renderParts={renderParts}
					style={styleStat}
				/>
			);
		}
		if (stats?.downhill) {
			newNodes['downhill'] = (
				<LineStat
					key="downhill"
					columnKey="downhill"
					value={stats.downhill}
					round={round}
					renderParts={renderParts}
					style={styleStat}
				/>
			);
		}
		if (stats?.minZ) {
			newNodes['minZ'] = (
				<LineStat
					key="minZ"
					columnKey="minZ"
					value={stats.minZ}
					round={round}
					renderParts={renderParts}
					style={styleStat}
				/>
			);
		}
		if (stats?.maxZ) {
			newNodes['maxZ'] = (
				<LineStat
					key="maxZ"
					columnKey="maxZ"
					value={stats.maxZ}
					round={round}
					renderParts={renderParts}
					style={styleStat}
				/>
			);
		}

		return newNodes;
	}, [
		stats,
		round,
		renderParts,
		styleStat,
	]);

	if (undefined === NodeWrapper) {
		return Object.values(nodes);
	} else {
		return Object.keys(nodes).map((key) => <NodeWrapper key={key}>{nodes[key]}</NodeWrapper>);
	}
};

export default LineStats;
