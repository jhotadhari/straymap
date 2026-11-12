/**
 * External dependencies
 */
import { FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/wrapper/ModalWrapper';
import ToggleRowControl from '../../../../components/generic/controls/ToggleRowControl';
import OptionMenuRowControl from '../../../../components/generic/controls/OptionMenuRowControl';
import { OptionBase } from '../../../../types';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectDrawerSort } from '../../selectors';
import { setDrawerSort } from '../../slice';
import { SortDirection } from '../../types';
import { DRAWER_SORT_COLUMN_KEYS } from '../../utils/sortLines';

/**
 * Sort-order settings for the selected-lines drawer list: which fields
 * are prioritized into their own leading sections and how each section
 * is ordered. All rows carry an Info hint (standard modal behavior).
 */
const SortOrderModal: FC<{ handleDismissModal: () => void }> = ({ handleDismissModal }) => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const drawerSort = useAppSelector(selectDrawerSort);

	const directionOptions = useMemo<OptionBase[]>(
		() => [
			{ key: 'asc', label: 'lines.sortAscending' },
			{ key: 'desc', label: 'lines.sortDescending' },
		],
		[]
	);

	const sortFieldOptions = useMemo<OptionBase[]>(
		() =>
			DRAWER_SORT_COLUMN_KEYS.map((columnKey) => ({
				key: columnKey,
				label: `lines.columns.${columnKey}`,
			})),
		[]
	);

	const handleTogglePrioritizeSystem = useCallback(() => {
		dispatch(setDrawerSort({ prioritizeSystem: !drawerSort.prioritizeSystem }));
	}, [dispatch, drawerSort.prioritizeSystem]);

	const handleTogglePrioritizeFollowed = useCallback(() => {
		dispatch(setDrawerSort({ prioritizeFollowed: !drawerSort.prioritizeFollowed }));
	}, [dispatch, drawerSort.prioritizeFollowed]);

	const handleSetDirection = useCallback(
		(direction: string) => {
			dispatch(setDrawerSort({ direction: direction as SortDirection }));
		},
		[dispatch]
	);

	const handleSetColumnKey = useCallback(
		(columnKey: string) => {
			dispatch(setDrawerSort({ columnKey }));
		},
		[dispatch]
	);

	return (
		<ModalWrapper
			visible={true}
			onDismiss={handleDismissModal}
			headerLabel={t('lines.sortOrder')}
			innerStyle={innerStyle}
		>
			<ToggleRowControl
				label={t('lines.prioritizeSystem')}
				value={drawerSort.prioritizeSystem}
				onToggle={handleTogglePrioritizeSystem}
				Info={t('lines.hintPrioritizeSystem')}
			/>

			<ToggleRowControl
				label={t('lines.prioritizeFollowed')}
				value={drawerSort.prioritizeFollowed}
				onToggle={handleTogglePrioritizeFollowed}
				Info={t('lines.hintPrioritizeFollowed')}
			/>

			<OptionMenuRowControl
				label={t('lines.sortDirection')}
				Info={t('lines.hintSortDirection')}
				options={directionOptions}
				value={drawerSort.direction}
				onUpdate={handleSetDirection}
			/>

			<OptionMenuRowControl
				label={t('lines.sortBy')}
				Info={t('lines.hintSortBy')}
				options={sortFieldOptions}
				value={drawerSort.columnKey}
				onUpdate={handleSetColumnKey}
			/>
		</ModalWrapper>
	);
};

const innerStyle = {
	gap: 16,
	marginTop: 16,
};

export default SortOrderModal;
