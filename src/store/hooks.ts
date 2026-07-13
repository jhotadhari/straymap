/**
 * External dependencies
 */
import { useRef } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';

/**
 * Internal dependencies
 */
import type { AppDispatch, RootState } from './store';
import features from '../features';
import { featureRegistry } from '../features/FeatureRegistry';

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

/**
 * Returns a stable Record mapping feature keys to their current
 * system line IDs (e.g. `{ routing: 42 }` when a route is active).
 *
 * The inner ref preserves referential equality when the aggregated
 * keys/values haven't changed, so that `shallowEqual` (used by
 * `useAppSelector`) can skip re-renders without a per-dispatch
 * object allocation forcing a re-render.
 */
export const useSystemLineIds = (): Record<string, number> => {
	const prevRef = useRef<Record<string, number>>({});
	return useAppSelector((state: RootState) => {
		const next = featureRegistry.getSystemLineIds(state);
		const prev = prevRef.current;
		const nextKeys = Object.keys(next);
		if (
			nextKeys.length === Object.keys(prev).length &&
			nextKeys.every((k) => prev[k] === next[k])
		) {
			return prev;
		}
		prevRef.current = next;
		return next;
	}, shallowEqual);
};
