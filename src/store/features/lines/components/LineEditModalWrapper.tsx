/**
 * External dependencies
 */
import React, { FC, useCallback } from 'react';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectUiItemKeys } from '../../ui/selectors';
import { setLineSelected } from '../slice';
import LineEditModal from './LineEditModal/LineEditModal';

/**
 * Wraps LineEditModal with the selectLine callback from Redux.
 * Hides itself when linesBrowser is the topmost UI item.
 */
const LineEditModalWrapper: FC = () => {
	const dispatch = useAppDispatch();
	const uiItemsKeys = useAppSelector(selectUiItemKeys);

	const selectLine = useCallback(
		(id: number, isSelected: boolean) => {
			dispatch(setLineSelected(id, isSelected));
		},
		[dispatch]
	);

	return !uiItemsKeys.length || 'linesBrowser' !== uiItemsKeys[uiItemsKeys.length - 1] ? (
		<LineEditModal selectLine={selectLine} />
	) : undefined;
};

export default LineEditModalWrapper;
