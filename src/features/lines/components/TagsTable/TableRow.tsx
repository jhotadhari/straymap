/**
 * External dependencies
 */
import { FC, useCallback, useMemo } from 'react';
import { StyleProp, StyleSheet, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';
import { useTheme, Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { TableColumn, Tag } from '../../types';
import { cellConfigs } from './sharedDeps';
import { tableStyles } from '../tableStyles';
import { getTagColor } from '../tagColor';
import { featureRegistry } from '../../../FeatureRegistry';
import { useAppSelector } from '../../../../store/hooks';
import { selectTagsTableColumns } from '../../selectors';
import IconButtonHighlight from '../../../../components/generic/primitives/IconButtonHighlight';

const DRAWER_ICON_SIZE = 20;

export interface TagTableRowProps {
	tag: Tag & { line_count: number; timestamp?: string };
	styleCell: StyleProp<ViewStyle>;
	idx: number;
	isChecked: boolean;
	toggleCheckedId: (id: number) => void;
	onEditTag: (tag: Tag & { line_count: number }) => void;
	isFixedHeight?: boolean;
	rowHeight?: number;
}

const TagTableRow: FC<TagTableRowProps> = ({
	tag,
	styleCell,
	idx,
	isChecked,
	toggleCheckedId,
	onEditTag,
	isFixedHeight,
	rowHeight,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const tableColumns: TableColumn[] = useAppSelector(selectTagsTableColumns);

	const visibleColumns = useMemo(
		() => tableColumns.filter((column) => column.visible),
		[tableColumns]
	);

	const toggleChecked = useCallback(() => {
		toggleCheckedId(tag.id);
	}, [tag.id, toggleCheckedId]);

	const handleEdit = useCallback(() => {
		onEditTag(tag);
	}, [tag, onEditTag]);

	const style = useMemo(
		() => [
			tableStyles.flexRow,
			{
				...(isChecked && {
					backgroundColor:
						idx % 2 === 1 ? theme.colors.inversePrimary : theme.colors.primaryContainer,
				}),
				...(isFixedHeight && {
					height: rowHeight,
					overflow: 'hidden' as const,
				}),
			},
		],
		[
			theme,
			idx,
			isChecked,
			isFixedHeight,
			rowHeight,
		]
	);

	const isSystemTag = useMemo(
		() => featureRegistry.getSystemTagLabels().includes(tag.label ?? ''),
		[tag.label]
	);

	const tagColor = useMemo(() => getTagColor(tag), [tag]);

	const formatDate = useCallback((ts?: string) => {
		if (!ts) return '';
		const d = new Date(ts);
		return d.toLocaleDateString();
	}, []);

	return (
		<TouchableWithoutFeedback onPress={toggleChecked}>
			<View style={style}>
				{/* Edit button column */}
				<View style={styleCell}>
					<IconButtonHighlight
						icon="cog"
						size={DRAWER_ICON_SIZE}
						onPress={handleEdit}
					/>
				</View>

				{visibleColumns.map((column) => {
					const cellStyle = [
						styleCell,
						...(cellConfigs[column.key]?.style ? [cellConfigs[column.key]?.style] : []),
						{ padding: 4 },
					];
					switch (column.key) {
						case 'label':
							return (
								<View
									key={column.key}
									style={[cellStyle, styles.gap4]}
								>
									<Text numberOfLines={isFixedHeight ? 1 : undefined}>
										{tag.label}
									</Text>
									{isSystemTag && (
										<Icon
											source="lock-outline"
											size={14}
											color={theme.colors.onSurfaceDisabled}
										/>
									)}
								</View>
							);
						case 'line_count':
							return (
								<View
									key={column.key}
									style={cellStyle}
								>
									<Text>{(tag as any).line_count ?? 0}</Text>
								</View>
							);
						case 'created_at':
							return (
								<View
									key={column.key}
									style={cellStyle}
								>
									<Text>
										{(tag as any).timestamp
											? formatDate((tag as any).timestamp)
											: ''}
									</Text>
								</View>
							);
						case 'color':
							return (
								<View
									key={column.key}
									style={cellStyle}
								>
									<View
										style={[
											styles.colorDot,
											{
												backgroundColor: tagColor.bg,
												borderColor: tagColor.border,
											},
										]}
									/>
								</View>
							);
						case 'notes':
							return (
								<View
									key={column.key}
									style={cellStyle}
								>
									<Text numberOfLines={isFixedHeight ? 1 : 2}>
										{isSystemTag
											? t(`lines.hintSystemTagNote.${tag.label}`)
											: (tag.notes ?? '')}
									</Text>
								</View>
							);
						default:
							return (
								<View
									key={column.key}
									style={cellStyle}
								>
									<Text> </Text>
								</View>
							);
					}
				})}
			</View>
		</TouchableWithoutFeedback>
	);
};

const styles = StyleSheet.create({
	gap4: { gap: 4 },
	colorDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1 },
});

export default TagTableRow;
