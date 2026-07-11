/**
 * External dependencies
 */
import { FC, useCallback, useMemo } from 'react';
import { useMutation, UseMutationOptions, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../../components/generic/ModalWrapper';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { queryLinesWithoutGeom } from '../../db/queryFns';
import { invalidateTagsTable, invalidateLinesQueries } from '../../db/queryFns';
import { updateTag } from '../../db/actionsTag';
import { queryAllTags } from '../../db/queryFns';
import { selectTagTemp } from '../../selectors';
import { setTagTemp } from '../../slice';
import { TagEditModalContext } from './Context';
import { sharedStyles } from './sharedDeps';
import { dbConnection } from '../../../dbLoader/DBConnection';
import RowLabel from './RowLabel';
import RowColor from './RowColor';
import RowShowRoutes from './RowShowRoutes';
import RowNotes from './RowNotes';
import RowDelete from './RowDelete';

const TagEditModal: FC = () => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation();

	const tagTemp = useAppSelector(selectTagTemp);
	const tagId = tagTemp?.id;

	const { data: tag } = useQuery({
		queryKey: ['tags'],
		queryFn: queryAllTags,
		enabled: !!tagId,
		select: (tags) => tags.find((t) => t.id === tagId) ?? null,
	});

	const mutationOptions: UseMutationOptions<
		void,
		Error,
		{ id: number; label: string | null; notes?: string | null; data?: any },
		unknown
	> = useMemo(
		() => ({
			mutationFn: (vars) =>
				updateTag(vars.id, { label: vars.label, notes: vars.notes, data: vars.data }),
			onMutate: async () => {
				await dbConnection.queryClient!.cancelQueries({ queryKey: ['tags'] });
			},
			onSuccess: async () => {
				invalidateTagsTable(dbConnection.queryClient!);
				await dbConnection.queryClient!.invalidateQueries({ queryKey: ['tags'] });
				await invalidateLinesQueries(dbConnection.queryClient!);
			},
			onSettled: () => {
				dispatch(setTagTemp(null));
			},
		}),
		[dispatch]
	);
	const mutation = useMutation(mutationOptions);

	const onDismiss = useCallback(() => {
		if (tagTemp?.id) {
			// Only mutate if some fields changed
			const changed = tagTemp.label !== undefined && tagTemp.label !== tag?.label;
			const notesChanged = tagTemp.notes !== undefined && tagTemp.notes !== tag?.notes;
			const colorChanged =
				tagTemp.data?.color !== undefined && tagTemp.data?.color !== tag?.data?.color;
			if (changed || colorChanged || notesChanged) {
				mutation.mutate({
					id: tagTemp.id,
					label: tagTemp.label ?? tag?.label ?? '',
					notes: tagTemp.notes !== undefined ? tagTemp.notes : tag?.notes,
					data: tagTemp.data ?? tag?.data,
				});
				return;
			}
		}
		dispatch(setTagTemp(null));
	}, [
		dispatch,
		mutation,
		tag,
		tagTemp,
	]);

	const contextValue = useMemo(
		() => ({
			tag: tag ? { ...tag, line_count: 0 } : null,
			onDismiss,
		}),
		[tag, onDismiss]
	);

	return (
		<ModalWrapper
			visible={!!tagTemp}
			onDismiss={onDismiss}
			header={t('lines.editTag')}
			innerStyle={sharedStyles.modalInner}
		>
			<TagEditModalContext.Provider value={contextValue}>
				<RowLabel />

				<RowColor />

				<RowShowRoutes />

				<RowNotes />

				<RowDelete />
			</TagEditModalContext.Provider>
		</ModalWrapper>
	);
};

export default TagEditModal;
