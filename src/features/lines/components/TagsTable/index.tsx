/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import type { ListRenderItem } from '@shopify/flash-list';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { without } from 'lodash-es';
import { BlurView } from '@react-native-community/blur';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
	selectTagsSort,
	selectTagsFilters,
	selectTagsFilterLogic,
	selectTagsTableColumns,
} from '../../selectors';
import { Tag } from '../../types';
import { tableStyles } from '../tableResources';
import { cellConfigs } from './sharedDeps';
import TagTableHeader from './TableHeader';
import TagTableRow from './TableRow';
import TagHeader from './Header';
import TagFooter from './Footer';
import { queryTagsWithLineCounts } from '../../db/queryFns';
import { HeaderContext, FooterContext, ColumnHeaderMenuContext } from './Context';
import TagFilterModals from './FilterModals';
import TagEditModal from '../TagEditModal/TagEditModal';
import CreateTagModal from '../CreateTagModal';
import { setTagTemp } from '../../slice';
import LoadingIndicator from '../../../../components/generic/primitives/LoadingIndicator';
import BidirectionalScrollHost from '../../../../components/generic/wrapper/BidirectionalScrollHost';
import { useFixedRowHeight } from '../../hooks/useFixedRowHeight';

const HEADER_ID = -1;

const keyExtractor = (tag: Tag & { line_count: number }) => tag.id.toString();

const TagTableRowMemo = memo(TagTableRow, (prevProps, nextProps) => {
	return (
		prevProps.isChecked === nextProps.isChecked &&
		prevProps.tag?.label === nextProps.tag?.label &&
		prevProps.tag?.line_count === nextProps.tag?.line_count &&
		prevProps.tag?.data?.color === nextProps.tag?.data?.color &&
		prevProps.onEditTag === nextProps.onEditTag
	);
});

const TagsTable: FC = () => {
	const theme = useTheme();

	const sort = useAppSelector(selectTagsSort);
	const filters = useAppSelector(selectTagsFilters);
	const filterLogic = useAppSelector(selectTagsFilterLogic);

	const { data: tags, isLoading } = useQuery({
		queryKey: ['tagsTable', { sort, filters, filterLogic }],
		queryFn: queryTagsWithLineCounts,
		gcTime: 1000 * 60 * 5,
	});

	const dataWithHeader = useMemo(() => {
		if (!tags) return [];
		return [{ id: HEADER_ID } as Tag & { line_count: number }, ...tags];
	}, [tags]);

	const tagIds = useMemo(() => tags?.map((tag) => tag.id) ?? [], [tags]);

	const { isFixedHeight, rowHeight } = useFixedRowHeight(tags?.length ?? 0);

	const tableColumns = useAppSelector(selectTagsTableColumns);

	const contentMinWidth = useMemo(() => {
		const actionCol = 100;
		const visible = tableColumns.filter((c: any) => c.visible);
		const cols = visible.reduce(
			(sum: number, c: any) => sum + ((cellConfigs as any)[c.key]?.style?.width ?? 100),
			0
		);
		return actionCol + cols;
	}, [tableColumns]);

	const [checkedIds, setCheckedIds] = useState<number[]>([]);
	const [addModalVisible, setAddModalVisible] = useState(false);

	// Reset checked rows when filters change
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

	const dispatch = useAppDispatch();

	const handleEditTag = useCallback(
		(tag: Tag & { line_count: number }) => {
			dispatch(setTagTemp({ id: tag.id, label: tag.label, data: tag.data }));
		},
		[dispatch]
	);

	const handleOpenCreate = useCallback(() => {
		setAddModalVisible(true);
	}, []);

	const handleDismissAdd = useCallback(() => {
		setAddModalVisible(false);
	}, []);

	const styleCell = useMemo(
		() => [tableStyles.cell, { borderColor: theme.colors.surfaceVariant }],
		[theme]
	);

	const renderItem: ListRenderItem<Tag & { line_count: number; timestamp?: string }> =
		useCallback(
			({ item: tag, index }) => {
				if (tag.id === HEADER_ID) {
					return (
						<TagTableHeader
							styleCell={styleCell}
							onCreatePress={handleOpenCreate}
						/>
					);
				}
				return (
					<TagTableRowMemo
						styleCell={styleCell}
						key={tag.id}
						tag={tag}
						idx={index}
						isChecked={checkedIds.includes(tag.id)}
						toggleCheckedId={toggleCheckedId}
						onEditTag={handleEditTag}
						isFixedHeight={isFixedHeight}
						rowHeight={rowHeight}
					/>
				);
			},
			[
				checkedIds,
				styleCell,
				toggleCheckedId,
				handleEditTag,
				isFixedHeight,
				rowHeight,
			]
		);

	return (
		<ColumnHeaderMenuContext.Provider value={{ openFilterForColumn }}>
			<View style={tableStyles.container}>
				<HeaderContext.Provider value={{ checkedIds }}>
					<TagHeader />
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
							style={{
								alignSelf: 'flex-start',
								minWidth: contentMinWidth,
							}}
						/>
					</BidirectionalScrollHost>
				</View>

				<FooterContext.Provider
					value={{
						checkedIds,
						tagIds,
						tagsCount: tags?.length || 0,
						tags: tags ?? [],
						setCheckedIds,
					}}
				>
					<TagFooter />
				</FooterContext.Provider>

				<TagFilterModals
					visible={columnFilterModalVisible}
					initialColumnKey={columnFilterInitialKey}
					onDismiss={dismissColumnFilterModal}
				/>
			</View>

			<TagEditModal />

			<CreateTagModal
				visible={addModalVisible}
				onDismiss={handleDismissAdd}
			/>
		</ColumnHeaderMenuContext.Provider>
	);
};

const styles = StyleSheet.create({
	flexOne: { flex: 1 },
	empty: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 48,
	},
});

export default TagsTable;
