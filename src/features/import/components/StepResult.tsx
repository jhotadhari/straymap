/**
 * External dependencies
 */
import { FC, memo, useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text, useTheme, Icon, List, Checkbox } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList, ListRenderItem } from '@shopify/flash-list';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../compose/useButtonProps';
import { localStyles } from './styles';
import { ImportFileResult } from '../types';
import { useImportContext } from '../ImportContext';
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import { queryLinesWithoutGeom, invalidateLinesQueries, invalidateLineGeomQueries } from '../../lines/db/queryFns';
import { deleteLines } from '../../lines/db/actionsLine';
import { logError } from '../../../lib/utils';

const UnmatchedLinesModal: FC<{
	visible: boolean;
	onDismiss: () => void;
	unmatchedIds: number[];
	filename: string;
}> = memo(({ visible, onDismiss, unmatchedIds, filename }) => {
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
			onDismiss();
		} catch (err) {
			logError('import.deleteUnmatched', err);
		}
	}, [checkedIds, queryClient, onDismiss]);

	const buttonPropsSelect = useButtonProps({});
	const buttonPropsDelete = useButtonProps({});

	const keyExtractor = useCallback((id: number) => String(id), []);

	const renderItem: ListRenderItem<number> = useCallback(
		({ item: id }) => {
			const line = lines?.find((l) => l.id === id);
			const importData = (line?.data as any)?.import;
			let description: string | undefined;
			if (importData) {
				const parts: string[] = [];
				if (typeof importData.trackIndexInFile === 'number') {
					parts.push(sprintf(t('import.trackN'), importData.trackIndexInFile + 1));
				}
				if (importData.originalFilename && importData.originalFilename !== filename) {
					parts.push(importData.originalFilename);
				}
				description = parts.join(' - ');
			}
			return (
				<List.Item
					title={line?.title ?? sprintf(t('import.trackN'), id)}
					description={description}
					left={(props) => (
						<Checkbox
							{...props}
							status={checkedIds.has(id) ? 'checked' : 'unchecked'}
							onPress={() => handleToggle(id)}
						/>
					)}
				/>
			);
		},
		[lines, checkedIds, handleToggle, filename, t]
	);

	const selectButtonLabel = useMemo(
		() =>
			checkedIds.size === unmatchedIds.length
				? t('import.selectNone')
				: t('import.selectAll'),
		[checkedIds.size, unmatchedIds.length, t]
	);

	const selectButtonAction = useMemo(
		() =>
			checkedIds.size === unmatchedIds.length
				? handleDeselectAll
				: handleSelectAll,
		[checkedIds.size, unmatchedIds.length, handleDeselectAll, handleSelectAll]
	);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={onDismiss}
			headerLabel={sprintf(t('import.resultUnmatchedHeader'), filename)}
			scrollEnabled={false}
		>
			<View style={localStyles.selectRow}>
				<ButtonHighlight {...buttonPropsSelect} onPress={selectButtonAction}>
					{selectButtonLabel}
				</ButtonHighlight>
			</View>
			<FlashList
				data={unmatchedIds}
				keyExtractor={keyExtractor}
				renderItem={renderItem}
				extraData={checkedIds}
			/>
			<View style={localStyles.importControls}>
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

const ResultItem: FC<{ result: ImportFileResult }> = memo(({ result }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const [modalVisible, setModalVisible] = useState(false);

	const handleOpenModal = useCallback(() => setModalVisible(true), []);
	const handleDismissModal = useCallback(() => setModalVisible(false), []);

	const buttonPropsAny = useButtonProps({});

	const errorStyle = useMemo(
		() => ({ color: theme.colors.error }),
		[theme]
	);
	const tertiaryStyle = useMemo(
		() => ({ color: theme.colors.tertiary }),
		[theme]
	);

	const left = useCallback(
		(props: any) => (
			<Icon
				{...props}
				size={20}
				source={result.success ? 'check-circle' : 'alert-circle'}
				color={result.success ? theme.colors.primary : theme.colors.error}
			/>
		),
		[result.success, theme.colors.primary, theme.colors.error]
	);

	const description = useCallback(() => (
		<>
			{result.success ? (
				<Text style={localStyles.resultDetail}>
					{sprintf(t('import.resultSuccess'), result.importedCount ?? 0)}
				</Text>
			) : (
				<Text style={[localStyles.resultDetail, errorStyle]}>
					{sprintf(t('import.resultFailed'), result.error ?? '')}
				</Text>
			)}
			{result.skippedGeom && result.skippedGeom > 0 && (
				<Text style={[localStyles.resultDetail, tertiaryStyle]}>
					{sprintf(t('import.resultSkippedGeom'), result.skippedGeom)}
				</Text>
			)}
			{result.overwritten && result.overwritten > 0 && (
				<Text style={[localStyles.resultDetail, tertiaryStyle]}>
					{sprintf(t('import.resultOverwritten'), result.overwritten)}
				</Text>
			)}
			{result.skipped && result.skipped > 0 && (
				<Text style={[localStyles.resultDetail, tertiaryStyle]}>
					{sprintf(t('import.resultSkippedExisting'), result.skipped)}
				</Text>
			)}
		</>
	), [
		result.success,
		result.importedCount,
		result.error,
		result.skippedGeom,
		result.overwritten,
		result.skipped,
		errorStyle,
		tertiaryStyle,
		t,
	]);

	return (
		<View>
			<List.Item
				title={result.name}
				left={left}
				description={description}
			/>
			{result.unmatchedIds && result.unmatchedIds.length > 0 && (
				<>
					<View style={localStyles.unmatchedRow}>
						<ButtonHighlight
							{...buttonPropsAny}
							onPress={handleOpenModal}
							icon="alert"
						>
							{sprintf(t('import.resultUnmatchedButton'), result.unmatchedIds.length)}
						</ButtonHighlight>
					</View>
					<UnmatchedLinesModal
						visible={modalVisible}
						onDismiss={handleDismissModal}
						unmatchedIds={result.unmatchedIds}
						filename={result.name}
					/>
				</>
			)}
		</View>
	);
});

const StepResult: FC = () => {
	const { t } = useTranslation();
	const { importResults, handleResultDone } = useImportContext();
	const buttonPropsAny = useButtonProps({});

	return (
		<ScrollView>
			<Text style={localStyles.resultSummary}>
				{sprintf(
					t('import.resultPartialSummary'),
					importResults.filter((r) => r.success).length,
					importResults.length
				)}
			</Text>

			{importResults.map((result, idx) => (
				<ResultItem key={idx} result={result} />
			))}

			<View style={localStyles.importControls}>
				<ButtonHighlight {...buttonPropsAny} onPress={handleResultDone}>
					{t('import.done')}
				</ButtonHighlight>
			</View>
		</ScrollView>
	);
};

export default memo(StepResult);
