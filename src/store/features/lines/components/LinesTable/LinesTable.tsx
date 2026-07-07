/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
import { FC, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
	BackHandler,
	FlatList,
	ListRenderItem,
	ScrollView,
	StyleProp,
	StyleSheet,
	View,
	ViewStyle,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { uniq, without } from 'lodash-es';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectSelectedInfos, selectFilterLogic, selectFilters, selectSort } from '../../selectors';
import { Line, LineStats } from '../../types';
import { sharedStyles } from './sharedDeps';
import TableHeader from './TableHeader';
import TableRow, { TableRowProps } from './TableRow';
import Header from './Header';
import Footer from './Footer';
import { queryLinesWithoutGeom } from '../../db/queryFns';
import { setLineSelected, setLinesSelected } from '../../slice';
import { setUiItemKeys } from '../../../ui/slice';
import useRoute from '../../../routing/hooks/useRoute';
import useActivateDrawerItem from '../../../drawers/hooks/useActivateDrawerItem';
import { FooterContext, HeaderContext, ColumnHeaderMenuContext } from './Context';
import LineEditModal from '../LineEditModal/LineEditModal';
import FilterModals from './FilterModals';

const keyExtractor = (line: { id: number }) => line.id.toString();

// const ITEM_HEIGHT = 50;

const TableRowMemo = memo(
	(props: TableRowProps) => <TableRow {...props} />,
	(prevProps, nextProps) => {
		return (
			prevProps.isOnMap === nextProps.isOnMap &&
			prevProps.isChecked === nextProps.isChecked &&
			prevProps.isRoutingLine === nextProps.isRoutingLine &&
			prevProps.line?.title === nextProps.line?.title
		);
	}
);

const LinesTable: FC = () => {
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const { selectedIds: onMapIds } = useAppSelector(selectSelectedInfos);

	const [onMapIdsTemp, setOnMapIdsTemp] = useState(onMapIds);
	const toggleOnMapId = useCallback(
		(id: number) => {
			setOnMapIdsTemp((ids) => {
				if (ids.includes(id)) {
					return without(ids, id);
				} else {
					return [...ids, id];
				}
			});
		},
		[setOnMapIdsTemp]
	);
	const onMapIdsTempRef = useRef<number[] | undefined>(undefined);
	useEffect(() => {
		onMapIdsTempRef.current = onMapIdsTemp;
	}, [onMapIdsTemp]);
	useEffect(
		() => () => {
			onMapIdsTempRef?.current && dispatch(setLinesSelected(uniq(onMapIdsTempRef.current)));
		},
		[dispatch]
	);

	const sort = useAppSelector(selectSort);
	const filters = useAppSelector(selectFilters);
	const filterLogic = useAppSelector(selectFilterLogic);

	const { data: lines } = useQuery({
		queryKey: ['lines', { sort, filters, filterLogic }],
		queryFn: queryLinesWithoutGeom,
		gcTime: 1000 * 60 * 5, // The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration.
	});

	const lineIds = useMemo(() => lines?.map((line) => line.id) ?? [], [lines]);

	// Remove not existing ids from selection.
	useEffect(() => {
		if (lineIds.length) {
			const notExistingIds = without(onMapIdsTemp, ...lineIds);
			if (notExistingIds.length) {
				setOnMapIdsTemp(without(onMapIds, ...notExistingIds));
			}
		}
	}, [
		lineIds,
		onMapIdsTemp,
		onMapIds,
	]);

	const [checkedIds, setCheckedIds] = useState<number[]>([]);

	// Reset checked rows when filters change, since the visible row set changed.
	useEffect(() => {
		setCheckedIds([]);
	}, [filters]);

	// ── Column-header filter modal ────────────────────────────────────────

	const [columnFilterModalVisible, setColumnFilterModalVisible] = useState(false);
	const [columnFilterInitialKey, setColumnFilterInitialKey] = useState<string | undefined>(
		undefined
	);

	const openFilterForColumn = useCallback((columnKey: string) => {
		setColumnFilterInitialKey(columnKey);
		setColumnFilterModalVisible(true);
	}, []);

	const dismissColumnFilterModal = useCallback(() => {
		setColumnFilterModalVisible(false);
		setColumnFilterInitialKey(undefined);
	}, []);

	const toggleCheckedId = useCallback((id: number) => {
		setCheckedIds((ids) => {
			if (ids.includes(id)) {
				return without(ids, id);
			} else {
				return [...ids, id];
			}
		});
	}, []);

	const backAction = useCallback(() => {
		let bubble = true;
		if (checkedIds.length) {
			setCheckedIds([]);
			bubble = false;
		}
		return !bubble;
	}, [
		checkedIds.length,
	]);
	useEffect(() => {
		const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
		return () => backHandler.remove();
	}, [backAction]);

	const styleCell: StyleProp<ViewStyle> = useMemo(
		() => [
			sharedStyles.cell,
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
		activateRoutingDrawerItem();
		dispatch(setUiItemKeys([]));
	}, [dispatch, activateRoutingDrawerItem]);

	const renderHeader = useCallback(() => {
		return <TableHeader styleCell={styleCell} />;
	}, [styleCell]);

	const {
		id: routeId,
		line_id: routingLineId,
		stats: routingStats,
	} = useRoute([
		'id',
		'line_id',
		'stats',
	]) || {};

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
			styleCell,
			toggleOnMapId,
		]
	);

	return (
		<ColumnHeaderMenuContext.Provider value={{ openFilterForColumn }}>
			<View style={sharedStyles.container}>
				<HeaderContext.Provider
					value={{
						checkedIds,
					}}
				>
					<Header />
				</HeaderContext.Provider>

				<ScrollView horizontal={true}>
					<View style={styles.flexOne}>
						<FlatList
							stickyHeaderIndices={[0]}
							scrollEnabled={true}
							initialNumToRender={15}
							data={lines ?? []}
							keyExtractor={keyExtractor}
							ListHeaderComponent={renderHeader}
							renderItem={renderItem}
						/>
					</View>
				</ScrollView>

				<FooterContext.Provider
					value={{
						checkedIds,
						lineIds,
						linesCount: lines?.length || 0,
						setCheckedIds,
						setOnMapIdsTemp,
						routingLineId,
						routeId,
					}}
				>
					<Footer />

					<LineEditModalWrapper />
				</FooterContext.Provider>

				<FilterModals
					visible={columnFilterModalVisible}
					initialColumnKey={columnFilterInitialKey}
					onDismiss={dismissColumnFilterModal}
				/>
			</View>
		</ColumnHeaderMenuContext.Provider>
	);
};

const LineEditModalWrapper: FC = () => {
	const dispatch = useAppDispatch();

	const { setOnMapIdsTemp, setCheckedIds } = useContext(FooterContext);

	const selectLine = useCallback(
		(id: number, isSelected: boolean) => {
			setOnMapIdsTemp && isSelected && setOnMapIdsTemp((ids) => uniq([...ids, id]));
			setOnMapIdsTemp && !isSelected && setOnMapIdsTemp((ids) => uniq(without(ids, id)));
			dispatch(setLineSelected(id, isSelected));
		},
		[dispatch, setOnMapIdsTemp]
	);

	const handleDeleteSuccess = useCallback(
		(lineId?: number) => {
			setCheckedIds && lineId && setCheckedIds((ids) => uniq(without(ids, lineId)));
		},
		[setCheckedIds]
	);

	return (
		<LineEditModal
			selectLine={selectLine}
			onDeleteSuccess={handleDeleteSuccess}
		/>
	);
};

const styles = StyleSheet.create({
	flexOne: { flex: 1 },
});

export default LinesTable;
