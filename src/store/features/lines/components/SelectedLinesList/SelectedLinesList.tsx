/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
import { FC, memo, useCallback, useContext } from 'react';
import { FlatList } from 'react-native-gesture-handler';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../../hooks';
import { selectSelectedInfos } from '../../selectors';
import { queryLinesWithoutGeom } from '../../db/queryFns';
import ListRow, { ListRowProps } from './ListRow';
import DrawerContext from '../../../drawers/DrawerContext';
import { ListRenderItem } from 'react-native';
import { Line, LineStats } from '../../types';
import { get } from 'lodash-es';
import useRoute from '../../../routing/hooks/useRoute';

const keyExtractor = (line: { id: number }) => line.id.toString();

const ListRowMemo = memo(
	(props: ListRowProps) => <ListRow {...props} />,
	(prevProps, nextProps) => {
		return (
			prevProps.visible === nextProps.visible &&
			prevProps.isRoutingLine === nextProps.isRoutingLine &&
			// prevProps.stats === nextProps.stats &&
			prevProps.line?.title === nextProps.line?.title
		);
	}
);

const SelectedLinesList: FC = () => {
	const { width } = useContext(DrawerContext);
	const { selectedIds, visibleMap } = useAppSelector(selectSelectedInfos);

	const { data: lines } = useQuery({
		queryKey: ['lines', selectedIds],
		queryFn: queryLinesWithoutGeom,
		gcTime: 1000 * 60 * 5, // The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration.
	});

	const {
		line_id: routingLineId,
		stats: routingStats,
	} =
		useRoute([
			'line_id',
			'stats',
		]) || {};

	const renderItem: ListRenderItem<Omit<Line, 'geometry'>> = useCallback(
		({ item: line, index }) => {
			return (
				<ListRowMemo
					key={line.id}
					line={line}
					idx={index}
					visible={!!get(visibleMap, line?.id)}
					isRoutingLine={line.id === routingLineId}
					stats={
						line.id !== routingLineId
							? undefined
							: (routingStats as LineStats | undefined)
					}
				/>
			);
		},
		[
			visibleMap,
			routingLineId,
			routingStats,
		]
	);

	return (
		<FlatList
			style={{
				width,
				flex: 1,
			}}
			scrollEnabled={true}
			initialNumToRender={15}
			data={lines ?? []}
			keyExtractor={keyExtractor}
			renderItem={renderItem}
		/>
	);
};

export default SelectedLinesList;
