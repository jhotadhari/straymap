/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
import { FC, memo, useCallback, useContext, useMemo } from 'react';
import { FlatList } from 'react-native-gesture-handler';
import { ListRenderItem, StyleSheet } from 'react-native';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../../store/hooks';
import { selectSelected } from '../../selectors';
import { queryLinesWithoutGeom } from '../../db/queryFns';
import ListRow, { ListRowProps } from './ListRow';
import DrawerContext from '../../../drawers/DrawerContext';
import { Line, LineStats } from '../../types';
import useRoute from '../../../routing/hooks/useRoute';

const keyExtractor = (line: { id: number }) => line.id.toString();

const ListRowMemo = memo(
	(props: ListRowProps) => <ListRow {...props} />,
	(prevProps, nextProps) => {
		return (
			prevProps.isRoutingLine === nextProps.isRoutingLine &&
			// prevProps.stats === nextProps.stats &&
			prevProps.line?.title === nextProps.line?.title
		);
	}
);

const SelectedLinesList: FC = () => {
	const { width } = useContext(DrawerContext);
	const selectedIds = useAppSelector(selectSelected);

	const { data: lines } = useQuery({
		queryKey: ['lines', selectedIds],
		queryFn: queryLinesWithoutGeom,
		gcTime: 1000 * 60 * 5, // The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration.
	});

	const { line_id: routingLineId, stats: routingStats } =
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
			routingLineId,
			routingStats,
		]
	);

	const styleList = useMemo(() => [styles.list, { width }], [width]);

	return (
		<FlatList
			style={styleList}
			scrollEnabled={true}
			initialNumToRender={15}
			data={lines ?? []}
			keyExtractor={keyExtractor}
			renderItem={renderItem}
		/>
	);
};

const styles = StyleSheet.create({
	list: { flex: 1 },
});

export default SelectedLinesList;
