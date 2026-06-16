/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
import { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ListRenderItem, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { without } from 'lodash-es';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectSelectedInfos } from '../../selectors';
import { Line, LineStats } from '../../types';
import { styles } from './sharedDeps';
import TableHeader from './TableHeader';
import TableRow, { TableRowProps } from './TableRow';
import Header from './Header';
import Footer from './Footer';
import { queryLinesWithoutGeom } from '../../db/queryFns';
import { setLinesSelected } from '../../slice';
import { setUiItemKeys } from '../../../ui/slice';
import useRoute from '../../../routing/hooks/useRoute';
import useActivateDrawerItem from '../../../drawers/hooks/useActivateDrawerItem';

const keyExtractor = (line: { id: number }) => line.id.toString();

// const ITEM_HEIGHT = 50;

const TableRowMemo = memo(
	(props: TableRowProps) => <TableRow {...props} />,
	(prevProps, nextProps) => {
		return (
			prevProps.isOnMap === nextProps.isOnMap &&
			prevProps.isChecked === nextProps.isChecked &&
			prevProps.line?.title === nextProps.line?.title
		);
	}
);

const LinesTable: FC = () => {
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const { selectedIds: onMapIds } = useAppSelector(selectSelectedInfos);

	const [onMapIdsTemp, setOnMapIdsTemp] = useState(onMapIds);
	const toggleOnMapId = useCallback((id: number) => {
		setOnMapIdsTemp((ids) => {
			if (ids.includes(id)) {
				return without(ids, id);
			} else {
				return [...ids, id];
			}
		});
	}, []);
	const onMapIdsTempRef = useRef<number[] | undefined>(undefined);
	useEffect(() => {
		onMapIdsTempRef.current = onMapIdsTemp;
	}, [onMapIdsTemp]);
	useEffect(
		() => () => {
			onMapIdsTempRef?.current && dispatch(setLinesSelected(onMapIdsTempRef.current));
		},
		[]
	);

	const { data: lines } = useQuery({
		queryKey: ['lines'],
		queryFn: queryLinesWithoutGeom,
	});

	const [checkedIds, setCheckedIds] = useState<number[]>([]);
	const toggleCheckedId = useCallback((id: number) => {
		setCheckedIds((ids) => {
			if (ids.includes(id)) {
				return without(ids, id);
			} else {
				return [...ids, id];
			}
		});
	}, []);

	const styleCell: StyleProp<ViewStyle> = useMemo(
		() => [
			styles.cell,
			{
				// height: ITEM_HEIGHT,
				// overflow: 'hidden',
				borderColor: theme.colors.surfaceVariant,
			},
		],
		[
			theme,
		]
	);

	const activateRoutingDrawerItem = useActivateDrawerItem('routing');

	const handleRoutingBtnPress = useCallback(() => {
		activateRoutingDrawerItem(0.35);
		dispatch(setUiItemKeys([]));
	}, [activateRoutingDrawerItem]);

	const renderHeader = useCallback(() => {
		return <TableHeader styleCell={styleCell} />;
	}, [styleCell]);

	const { line_id: routingLineId, stats: routingStats } = useRoute(['line_id', 'stats']) || {};

	const renderItem: ListRenderItem<Omit<Line, 'geometry'>> = useCallback(
		({ item: line, index }) => {
			return (
				<TableRowMemo
					styleCell={styleCell}
					key={line.id}
					line={line}
					idx={index}
					isOnMap={onMapIdsTemp.includes(line.id)}
					handleRoutingBtnPress={handleRoutingBtnPress}
					toggleCheckedId={toggleCheckedId}
					toggleOnMapId={toggleOnMapId}
					isChecked={checkedIds.includes(line.id)}
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
			handleRoutingBtnPress,
			toggleCheckedId,
			onMapIdsTemp,
			checkedIds,
			routingLineId,
			routingStats,
		]
	);

	return (
		<View style={styles.container}>

			<Header checkedIds={checkedIds} />

			<ScrollView horizontal={true}>
				<View style={{ flex: 1 }}>
					<FlatList
						stickyHeaderIndices={[0]}
						scrollEnabled={true}
						initialNumToRender={15}
						data={lines ?? []}
						keyExtractor={keyExtractor}
						ListHeaderComponent={renderHeader}
						renderItem={renderItem}
						// getItemLayout={(data, index) => ({
						// 	length: ITEM_HEIGHT,
						// 	offset: ITEM_HEIGHT * index,
						// 	index,
						// })}
					/>
				</View>
			</ScrollView>

			<Footer
				checkedIds={checkedIds}
				linesCount={lines?.length || 0}
			/>
		</View>
	);
};

export default LinesTable;
