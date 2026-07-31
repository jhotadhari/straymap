/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import type { ListRenderItem } from '@shopify/flash-list';
import { FC, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { uniq, without } from 'lodash-es';
import { BlurView } from '@react-native-community/blur';
import { useMap } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
	selectSelected,
	selectLinesFilterLogic,
	selectLinesFilters,
	selectLinesSort,
	selectLinesTableColumns,
} from '../../selectors';
import { Line, LineStats } from '../../types';
import { tableStyles } from '../tableResources';
import { cellConfigs } from './sharedDeps';
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
import LinesFilterModals from './FilterModals';
import LoadingIndicator from '../../../../components/generic/primitives/LoadingIndicator';
import { bbox as turfBbox } from '@turf/turf';
import { AppContext } from '../../../../Context';
import { MAP_ANIMATION_PADDING_PX } from '../../../../constants';
import BidirectionalScrollHost from '../../../../components/generic/wrapper/BidirectionalScrollHost';
import { useFixedRowHeight } from '../../hooks/useFixedRowHeight';

const HEADER_ID = -1;

const HEADER_SENTINEL = { id: HEADER_ID } as Omit<Line, 'geometry'>;

const keyExtractor = (line: { id: number }) => line.id.toString();

const TableRowMemo = memo(
	(props: TableRowProps) => <TableRow {...props} />,
	(prevProps, nextProps) => {
		return (
			prevProps.isOnMap === nextProps.isOnMap &&
			prevProps.isChecked === nextProps.isChecked &&
			prevProps.isRoutingLine === nextProps.isRoutingLine &&
			prevProps.line?.title === nextProps.line?.title &&
			prevProps.line?.tags === nextProps.line?.tags &&
			prevProps.isFixedHeight === nextProps.isFixedHeight &&
			prevProps.rowHeight === nextProps.rowHeight
		);
	}
);

const LinesTable: FC = () => {
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const { mapViewNativeNodeHandle } = useContext(AppContext);

	const { flyToBounds } = useMap(mapViewNativeNodeHandle);

	const onMapIds = useAppSelector(selectSelected);

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

	const sort = useAppSelector(selectLinesSort);
	const filters = useAppSelector(selectLinesFilters);
	const filterLogic = useAppSelector(selectLinesFilterLogic);

	const { data: lines, isLoading } = useQuery({
		queryKey: ['lines', { sort, filters, filterLogic }],
		queryFn: queryLinesWithoutGeom,
		gcTime: 1000 * 60 * 5, // The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration.
	});

	// The sentinel at index 0 is made sticky via stickyHeaderIndices={[0]}
	// on FlashList below. We embed the header as a data item rather than
	// rendering it as a sibling View because BidirectionalScrollHost
	// extends HorizontalScrollView which only supports a single child.
	// Wrapping TableHeader + FlashList in an intermediate <View> does NOT
	// work — BidirectionalScrollHost relies on the single-child guarantee
	// for its child-scrollable discovery (findScrollChild) and touch
	// dispatch. A wrapper View breaks both.
	const dataWithHeader = useMemo(() => {
		if (!lines) return [HEADER_SENTINEL];
		return [HEADER_SENTINEL, ...lines];
	}, [lines]);

	const lineIds = useMemo(() => lines?.map((line) => line.id) ?? [], [lines]);

	const { isFixedHeight, rowHeight } = useFixedRowHeight(lines?.length ?? 0);

	const tableColumns = useAppSelector(selectLinesTableColumns);

	const contentMinWidth = useMemo(() => {
		const actionCol = 100;
		const visible = tableColumns.filter((c: any) => c.visible);
		const cols = visible.reduce(
			(sum: number, c: any) => sum + ((cellConfigs as any)[c.key]?.style?.width ?? 100),
			0
		);
		return actionCol + cols;
	}, [tableColumns]);

	const flashListStyle: ViewStyle = useMemo(
		() => ({
			alignSelf: 'flex-start',
			minWidth: contentMinWidth,
		}),
		[contentMinWidth]
	);

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
			tableStyles.cell,
			{
				borderColor: theme.colors.surfaceVariant,
			},
		],
		[
			theme,
		]
	);

	const activateRoutingDrawerItem = useActivateDrawerItem('routing');

	const handleRoutingBtnPress = useCallback(
		(line: Omit<Line, 'geometry'>) => {
			activateRoutingDrawerItem();
			// Close LinesTable.
			dispatch(setUiItemKeys([]));
			// flyToBounds
			if (line?.envelope) {
				const bbox = turfBbox(line.envelope);
				flyToBounds(bbox, { paddingPx: MAP_ANIMATION_PADDING_PX });
			}
		},
		[
			dispatch,
			activateRoutingDrawerItem,
			flyToBounds,
		]
	);

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
			if (line.id === HEADER_ID) {
				return <TableHeader styleCell={styleCell} />;
			}
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
					isFixedHeight={isFixedHeight}
					rowHeight={rowHeight}
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
			isFixedHeight,
			rowHeight,
			styleCell,
			toggleOnMapId,
		]
	);

	return (
		<ColumnHeaderMenuContext.Provider value={{ openFilterForColumn }}>
			<View style={tableStyles.container}>
				<HeaderContext.Provider
					value={{
						checkedIds,
					}}
				>
					<Header />
				</HeaderContext.Provider>

				<View style={tableStyles.container}>
					{isLoading && (
						<BlurView
							style={tableStyles.loadingContainer}
							blurAmount={1}
							blurType={theme.dark ? 'dark' : 'light'}
						>
							<View style={tableStyles.loadingContainer}>
								<LoadingIndicator size="large" />
							</View>
						</BlurView>
					)}
					<BidirectionalScrollHost style={styles.flexOne}>
						<FlashList
							stickyHeaderIndices={[0]}
							scrollEnabled={false}
							data={dataWithHeader}
							keyExtractor={keyExtractor}
							renderItem={renderItem}
							{...(isFixedHeight && {
								overrideItemLayout: (layout: { span?: number; size?: number }) => {
									layout.size = rowHeight;
								},
							})}
							style={flashListStyle}
						/>
					</BidirectionalScrollHost>
				</View>

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

				<LinesFilterModals
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
