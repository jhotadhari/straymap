/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
import { FC, memo, useCallback, useContext, useMemo } from 'react';
import { FlashList } from '@shopify/flash-list';
import type { ListRenderItem } from '@shopify/flash-list';
import { StyleSheet, View } from 'react-native';
import { Divider } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { useAppSelector, useSystemLineIds } from '../../../../store/hooks';
import { selectSelected, selectDrawerSort } from '../../selectors';
import { selectFollowingLineId } from '../../../lineFollow/selectors';
import { queryLinesWithoutGeom } from '../../db/queryFns';
import useLineIdUnderCenter from '../../hooks/useLineIdUnderCenter';
import ListRow, { ListRowProps } from './ListRow';
import DrawerContext from '../../../drawers/DrawerContext';
import { Line } from '../../types';
import { compareLinesForSort } from '../../utils/sortLines';
import LoadingIndicator from '../../../../components/generic/primitives/LoadingIndicator';

type LineWithoutGeom = Omit<Line, 'geometry'>;

type DrawerListItem = { type: 'line'; line: LineWithoutGeom } | { type: 'divider'; key: string };

const keyExtractor = (item: DrawerListItem) =>
	item.type === 'line' ? item.line.id.toString() : item.key;

const ListRowMemo = memo(
	(props: ListRowProps) => <ListRow {...props} />,
	(prevProps, nextProps) => {
		return (
			prevProps.systemFeatureKey === nextProps.systemFeatureKey &&
			prevProps.isUnderCenter === nextProps.isUnderCenter &&
			prevProps.line?.title === nextProps.line?.title &&
			prevProps.line?.custom_date === nextProps.line?.custom_date &&
			prevProps.line?.tags === nextProps.line?.tags &&
			prevProps.line?.stats === nextProps.line?.stats
		);
	}
);

const SelectedLinesList: FC = () => {
	const { width } = useContext(DrawerContext);
	const selectedIds = useAppSelector(selectSelected);
	const underCenterLineIds = useLineIdUnderCenter();
	const drawerSort = useAppSelector(selectDrawerSort);
	const followingLineId = useAppSelector(selectFollowingLineId);

	const { data: lines, isLoading } = useQuery({
		queryKey: ['lines', selectedIds],
		queryFn: queryLinesWithoutGeom,
		gcTime: 1000 * 60 * 5, // The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration.
	});

	const systemLineIds = useSystemLineIds();

	// Sort the list client-side: prioritized sections (followed route,
	// system routes) are listed first, each section ordered by the
	// configured column/direction. Full-bleed dividers separate the
	// sections so the grouping is visible (same look as the location
	// drawer panel's section divider).
	const displayItems = useMemo<DrawerListItem[]>(() => {
		const source = lines ?? [];
		const systemIds = new Set(Object.values(systemLineIds));

		const followedLines: LineWithoutGeom[] = [];
		const systemLines: LineWithoutGeom[] = [];
		const ordinaryLines: LineWithoutGeom[] = [];

		for (const line of source) {
			if (drawerSort.prioritizeFollowed && line.id === followingLineId) {
				followedLines.push(line);
			} else if (drawerSort.prioritizeSystem && systemIds.has(line.id)) {
				systemLines.push(line);
			} else {
				ordinaryLines.push(line);
			}
		}

		const sortFn = compareLinesForSort(drawerSort.columnKey, drawerSort.direction);
		followedLines.sort(sortFn);
		systemLines.sort(sortFn);
		ordinaryLines.sort(sortFn);

		const items: DrawerListItem[] = [];
		const pushSection = (section: LineWithoutGeom[]) => {
			if (!section.length) {
				return;
			}
			if (items.length) {
				items.push({ type: 'divider', key: `divider-${items.length}` });
			}
			for (const line of section) {
				items.push({ type: 'line', line });
			}
		};
		pushSection(followedLines);
		pushSection(systemLines);
		pushSection(ordinaryLines);

		return items;
	}, [
		lines,
		systemLineIds,
		followingLineId,
		drawerSort,
	]);

	const renderItem: ListRenderItem<DrawerListItem> = useCallback(
		({ item, index }) => {
			if (item.type === 'divider') {
				return <Divider style={styles.sectionDivider} />;
			}
			const line = item.line;
			const systemFeatureKey =
				Object.entries(systemLineIds).find(([, id]) => id === line.id)?.[0] ?? null;
			return (
				<ListRowMemo
					key={line.id}
					line={line}
					idx={index}
					systemFeatureKey={systemFeatureKey}
					isUnderCenter={underCenterLineIds.has(line.id)}
				/>
			);
		},
		[systemLineIds, underCenterLineIds]
	);

	const styleList = useMemo(() => [styles.list, { width }], [width]);

	return (
		<>
			{isLoading ? (
				<View style={styles.loadingContainer}>
					<LoadingIndicator size="large" />
				</View>
			) : (
				<FlashList
					style={styleList}
					scrollEnabled={true}
					data={displayItems}
					keyExtractor={keyExtractor}
					renderItem={renderItem}
				/>
			)}
		</>
	);
};

const styles = StyleSheet.create({
	list: { flex: 1 },
	loadingContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	sectionDivider: {
		// Full-bleed: extends through the rows' 16px padding so the
		// line spans the entire drawer width, visibly splitting the
		// prioritized sections from the rest of the list.
		marginHorizontal: -16,
		marginVertical: 24,
	},
});

export default SelectedLinesList;
