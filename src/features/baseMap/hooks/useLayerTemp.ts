/**
 * Internal dependencies
 */
import { useCallback } from 'react';
import { LayerConfig } from '../types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectLayerTemp } from '../selectors';
import { setLayerTemp } from '../slice';

/**
 * Shared hook for layer control components. Returns the current layer temp
 * (typed for the specific options shape) and a setOptions callback that
 * dispatches a partial or full options update to Redux.
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export const useLayerTemp = <OptionsType extends object>() => {
	const dispatch = useAppDispatch();

	const layerTemp = useAppSelector(selectLayerTemp) as undefined | LayerConfig<OptionsType>;

	const setOptions = useCallback(
		(newOptions: OptionsType) => {
			dispatch(
				setLayerTemp(
					(layerTemp) =>
						layerTemp &&
						({
							...layerTemp,
							options: newOptions,
						} as LayerConfig)
				)
			);
		},
		[dispatch]
	);

	return { layerTemp, setOptions } as const;
};
