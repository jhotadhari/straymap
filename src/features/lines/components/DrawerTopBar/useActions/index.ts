/**
 * External dependencies
 */
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import { MenuActionOption } from '../../../../../types';
import { useSystemLineIds } from '../../../../../store/hooks';
import useActionClearLines from './useActionClearLines';
import useActionRandomizeColors from './useActionRandomizeColors';
import useActionSetEqualColors from './useActionSetEqualColors';
import useActionSetLineWidth from './useActionSetLineWidth';
import useActionShowStats from './useActionShowStats';

export interface LinesBulkActions {
	/** Applies to every selected line (incl. system lines). */
	showStats: MenuActionOption;
	/** Actions that only affect ordinary (non-system) lines. */
	ordinary: MenuActionOption[];
	/** Number of ordinary lines currently selected. */
	ordinaryCount: number;
	/** IDs of the ordinary lines currently selected. */
	ordinaryLineIds: number[];
}

const useActions = ({ lineIds }: { lineIds: number[] }): LinesBulkActions => {
	const systemLineIds = useSystemLineIds();

	const ordinaryLineIds = useMemo(() => {
		const systemIds = new Set(Object.values(systemLineIds));
		return lineIds.filter((id) => !systemIds.has(id));
	}, [lineIds, systemLineIds]);

	const actionClearLines = useActionClearLines({ lineIds });
	const actionRandomizeColors = useActionRandomizeColors({ lineIds: ordinaryLineIds });
	const actionSetEqualColors = useActionSetEqualColors();
	const actionSetLineWidth = useActionSetLineWidth();
	const actionShowStats = useActionShowStats({ lineIds });

	return useMemo(
		() => ({
			showStats: actionShowStats,
			ordinary: [
				actionSetLineWidth,
				actionRandomizeColors,
				actionSetEqualColors,
				actionClearLines,
			],
			ordinaryCount: ordinaryLineIds.length,
			ordinaryLineIds,
		}),
		[
			actionClearLines,
			actionRandomizeColors,
			actionSetEqualColors,
			actionSetLineWidth,
			actionShowStats,
			ordinaryLineIds,
		]
	);
};

export default useActions;
