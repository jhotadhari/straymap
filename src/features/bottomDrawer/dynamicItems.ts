/**
 * Internal dependencies
 */
import { featureRegistry } from '../FeatureRegistry';
import { BottomDrawerItem } from './types';

let itemResolver: ((key: string) => BottomDrawerItem | undefined) | undefined;

/**
 * Registers a resolver for dynamically-resolved bottom drawer items
 * (e.g. the altitudeProfile feature's `altitudeProfile:*` keys).
 */
export const setBottomDrawerItemResolver = (
	resolver: ((key: string) => BottomDrawerItem | undefined) | undefined
): void => {
	itemResolver = resolver;
};

/**
 * Resolves a bottom drawer item by key: static registry first, then the
 * dynamic resolver. Use instead of featureRegistry.getBottomDrawerItems()
 * wherever an item is looked up by key.
 */
export const getBottomDrawerItem = (key: string): BottomDrawerItem | undefined =>
	featureRegistry.getBottomDrawerItems()[key] ?? itemResolver?.(key);
