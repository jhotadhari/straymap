/**
 * External dependencies
 */
import { useDispatch, useSelector } from 'react-redux';

/**
 * Internal dependencies
 */
import type { AppDispatch, RootState } from './store';
import features from '../features';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export const useSettingsInitialized = () => {
	const featuresArray = Object.values(features);
	// featuresArray is a module-level constant — hook count is stable across renders
	return featuresArray.reduce((acc, feature) => {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const settingsInitialized = useAppSelector(feature.selectInitialized);
		acc.push(settingsInitialized);
		return acc;
	}, [] as boolean[]);
};
