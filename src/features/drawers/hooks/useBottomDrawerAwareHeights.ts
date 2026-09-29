/**
 * External dependencies
 */
import { useContext, useMemo } from 'react';
import { useAnimatedStyle } from 'react-native-reanimated';

/**
 * Internal dependencies
 */
import { AppContext } from '../../../Context';

/**
 * Shared derivation of the map-visible height once the bottom drawer's
 * settled contribution is re-added, plus the animated style that subtracts
 * the drawer's live (UI-thread) shared value. Used by the side drawers,
 * their content/handles and the map cursor so they all track the same
 * bottom-drawer drag at 60fps.
 */
export const useBottomDrawerAwareHeights = (height?: number) => {
	const { bottomBarHeight, bottomDrawerHeightSv } = useContext(AppContext);

	const baseMapHeight = useMemo(
		() => (height ?? 0) + (bottomBarHeight?.bottomDrawer ?? 0),
		[height, bottomBarHeight?.bottomDrawer]
	);

	const animatedHeight = useAnimatedStyle(
		() => ({
			height: baseMapHeight - bottomDrawerHeightSv.value,
		}),
		[baseMapHeight]
	);

	return { baseMapHeight, animatedHeight };
};

export default useBottomDrawerAwareHeights;
