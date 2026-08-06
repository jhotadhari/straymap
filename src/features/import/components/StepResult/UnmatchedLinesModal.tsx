/**
 * External dependencies
 */
import { FC, memo, useCallback, useState } from 'react';
import { View } from 'react-native';
import { Checkbox, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList, ListRenderItem } from '@shopify/flash-list';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import ListItem from '../../../../components/generic/wrapper/ListItem';
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { localStyles } from '../styles';
import {
	queryLinesWithoutGeom,
	invalidateLinesQueries,
	invalidateLineGeomQueries,
} from '../../../lines/db/queryFns';
import { deleteLines } from '../../../lines/db/actionsLine';
import { logError } from '../../../../lib/utils';
import { sharedStyles } from '../../../../sharedStyles';

const UnmatchedLinesModal: FC<{
	visible: boolean;
	onDismiss: () => void;
	unmatchedIds: number[];
	filename: string;
	onIdsChange?: (ids: number[]) => void;
}> = memo(({ visible, onDismiss, unmatchedIds, filename, onIdsChange }) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const { data: lines } = useQuery({
		queryKey: ['lines', unmatchedIds],
		queryFn: queryLinesWithoutGeom,
		enabled: visible && unmatchedIds.length > 0,
	});

	const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set(unmatchedIds));

	const handleToggle = useCallback(
		(id: number) =>
			setCheckedIds((prev) => {
				const next = new Set(prev);
				if (next.has(id)) next.delete(id);
				else next.add(id);
				return next;
			}),
		[]
	);

	const handleSelectAll = useCallback(() => setCheckedIds(new Set(unmatchedIds)), [unmatchedIds]);
	const handleDeselectAll = useCallback(() => setCheckedIds(new Set()), []);

	const handleDeleteChecked = useCallback(async () => {
		if (checkedIds.size === 0) return;
		const ids = Array.from(checkedIds);
		try {
			await deleteLines(ids);
			invalidateLinesQueries(queryClient);
			invalidateLineGeomQueries(queryClient);
			const remaining = unmatchedIds.filter((id) => !ids.includes(id));
			onIdsChange?.(remaining);
			setCheckedIds(new Set());
			onDismiss();
		} catch (err) {
			logError('import.deleteUnmatched', err);
		}
	}, [
		checkedIds,
		unmatchedIds,
		queryClient,
		onIdsChange,
		onDismiss,
	]);

	const buttonPropsSelect = useButtonProps({});
	const buttonPropsDelete = useButtonProps({});

	const keyExtractor = useCallback((id: number) => String(id), []);

	const renderItem: ListRenderItem<number> = useCallback(
		({ item: id }) => {
			const line = lines?.find((l) => l.id === id);
			return (
				<ListItem
					style={localStyles.featureListItem}
					title={line?.title?.length ? line.title : sprintf(t('import.routeN'), id)}
					icon={(props) => (
						<Checkbox
							{...props}
							status={checkedIds.has(id) ? 'checked' : 'unchecked'}
							onPress={() => handleToggle(id)}
						/>
					)}
					onPress={() => handleToggle(id)}
				/>
			);
		},
		[
			lines,
			checkedIds,
			handleToggle,
			t,
		]
	);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={onDismiss}
			headerLabel={sprintf(t('import.resultUnmatchedHeader'), filename)}
			scrollEnabled={false}
		>
			<Text style={localStyles.resultDetail}>{t('import.resultUnmatchedExplanation')}</Text>
			<View style={localStyles.selectRow}>
				<ButtonHighlight
					{...buttonPropsSelect}
					onPress={handleSelectAll}
				>
					{t('lines.selectAll')}
				</ButtonHighlight>
				<ButtonHighlight
					{...buttonPropsSelect}
					onPress={handleDeselectAll}
				>
					{t('lines.selectNone')}
				</ButtonHighlight>
			</View>
			<FlashList
				data={unmatchedIds}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				extraData={checkedIds}
			/>
			<View style={sharedStyles.modalControlsEnd}>
				<ButtonHighlight
					{...buttonPropsDelete}
					onPress={handleDeleteChecked}
					disabled={checkedIds.size === 0}
				>
					{sprintf(t('import.resultUnmatchedDeleteChecked'), checkedIds.size)}
				</ButtonHighlight>
			</View>
		</ModalWrapper>
	);
});

export default UnmatchedLinesModal;
