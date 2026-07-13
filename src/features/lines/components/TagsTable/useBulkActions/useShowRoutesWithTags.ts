/**
 * External dependencies
 */
import { useContext, useCallback, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import { useAppDispatch } from '../../../../../store/hooks';
import { setLinesFilters, setLinesFilterLogic } from '../../../slice';
import { addUiItemKey } from '../../../../ui/slice';

const useShowRoutesWithTags = () => {
	const dispatch = useAppDispatch();

	const { checkedIds, tags } = useContext(FooterContext);

	const cb = useCallback(() => {
		const selectedLabels = (tags ?? [])
			.filter((t) => checkedIds.includes(t.id) && t.label)
			.map((t) => t.label!);

		if (!selectedLabels.length) return;

		// Set OR filters on the lines table for each selected tag
		const filters = selectedLabels.map((label) => ({
			type: 'tags' as const,
			columnKey: 'tags',
			operator: 'has' as const,
			value: label,
		}));

		dispatch(setLinesFilterLogic('or'));
		dispatch(setLinesFilters(filters));

		// Navigate to the routes browser
		dispatch(addUiItemKey('linesBrowser'));
	}, [
		dispatch,
		checkedIds,
		tags,
	]);

	const disabled = useCallback(() => checkedIds.length === 0, [checkedIds]);

	return useMemo(
		() => ({
			key: 'showRoutesWithTags',
			cb,
			label: 'lines.showRoutesWithTags',
			leadingIcon: 'go-kart-track',
			disabled,
		}),
		[cb, disabled]
	);
};

export default useShowRoutesWithTags;
