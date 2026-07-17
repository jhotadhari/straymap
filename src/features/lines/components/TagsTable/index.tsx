/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, ListRenderItem, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { without } from 'lodash-es';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectTagsSort, selectTagsFilters, selectTagsFilterLogic } from '../../selectors';
import { Tag } from '../../types';
import { tableStyles } from '../tableStyles';
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

	const { data: tags } = useQuery({
		queryKey: ['tagsTable', { sort, filters, filterLogic }],
		queryFn: queryTagsWithLineCounts,
		gcTime: 1000 * 60 * 5,
	});

	const tagIds = useMemo(() => tags?.map((tag) => tag.id) ?? [], [tags]);

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
		() => [
			tableStyles.cell,
			{ borderColor: theme.colors.surfaceVariant },
		],
		[theme]
	);

	const renderHeader = useCallback(() => {
		return (
			<TagTableHeader
				styleCell={styleCell}
				onCreatePress={handleOpenCreate}
			/>
		);
	}, [styleCell, handleOpenCreate]);

	const renderItem: ListRenderItem<Tag & { line_count: number; timestamp?: string }> =
		useCallback(
			({ item: tag, index }) => {
				return (
					<TagTableRowMemo
						styleCell={styleCell}
						key={tag.id}
						tag={tag}
						idx={index}
						isChecked={checkedIds.includes(tag.id)}
						toggleCheckedId={toggleCheckedId}
						onEditTag={handleEditTag}
					/>
				);
			},
			[
				checkedIds,
				styleCell,
				toggleCheckedId,
				handleEditTag,
			]
		);

	return (
		<ColumnHeaderMenuContext.Provider value={{ openFilterForColumn }}>
			<View style={tableStyles.container}>
				<HeaderContext.Provider value={{ checkedIds }}>
					<TagHeader />
				</HeaderContext.Provider>

				<ScrollView horizontal>
					<View style={styles.flexOne}>
						<FlatList
							stickyHeaderIndices={[0]}
							scrollEnabled
							initialNumToRender={15}
							data={tags ?? []}
							keyExtractor={keyExtractor}
							ListHeaderComponent={renderHeader}
							renderItem={renderItem}
						/>
					</View>
				</ScrollView>

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
