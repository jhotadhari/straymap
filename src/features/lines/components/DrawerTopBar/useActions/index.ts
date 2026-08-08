/**
 * External dependencies
 */
import { useMemo } from 'react';

/**
 * Internal dependencies
 */
import { MenuActionOption } from '../../../../../types';
import useActionClearLines from './useActionClearLines';
import useActionRandomizeColors from './useActionRandomizeColors';
import useActionSetEqualColors from './useActionSetEqualColors';
import useActionShowStats from './useActionShowStats';

const useActions = ({ lineIds }: { lineIds: number[] }) => {
	const actionClearLines = useActionClearLines({ lineIds });
	const actionRandomizeColors = useActionRandomizeColors();
	const actionSetEqualColors = useActionSetEqualColors();
	const actionShowStats = useActionShowStats({ lineIds });

	return useMemo(() => {
		const actions: Record<string, MenuActionOption> = {};

		actions[actionShowStats.key] = actionShowStats;
		actions[actionRandomizeColors.key] = actionRandomizeColors;
		actions[actionSetEqualColors.key] = actionSetEqualColors;
		actions[actionClearLines.key] = actionClearLines;

		return actions;
	}, [actionClearLines, actionRandomizeColors, actionSetEqualColors, actionShowStats]);
};

export default useActions;
