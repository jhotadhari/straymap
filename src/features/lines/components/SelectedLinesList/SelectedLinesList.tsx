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
import { useAppSelector, useSystemLineIds } from '../../../../store/hooks';
import { selectSelected } from '../../selectors';
import { queryLinesWithoutGeom } from '../../db/queryFns';
import ListRow, { ListRowProps } from './ListRow';
import DrawerContext from '../../../drawers/DrawerContext';
import { Line } from '../../types';
const keyExtractor = (line: { id: number }) => line.id.toString();

const ListRowMemo = memo(
	(props: ListRowProps) => <ListRow {...props} />,
	(prevProps, nextProps) => {
		return (
			prevProps.systemFeatureKey === nextProps.systemFeatureKey &&
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

	const systemLineIds = useSystemLineIds();

	const renderItem: ListRenderItem<Omit<Line, 'geometry'>> = useCallback(
		({ item: line, index }) => {
			const systemFeatureKey =
				Object.entries(systemLineIds).find(([, id]) => id === line.id)?.[0] ?? null;
			return (
				<ListRowMemo
					key={line.id}
					line={line}
					idx={index}
					systemFeatureKey={systemFeatureKey}
				/>
			);
		},
		[systemLineIds]
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
