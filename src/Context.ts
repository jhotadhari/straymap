/**
 * External dependencies
 */
import { createContext, createRef, Dispatch, MutableRefObject, SetStateAction } from 'react';
import { makeMutable, SharedValue } from 'react-native-reanimated';
import { MapEventResponse } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { BottomBarHeight } from './types';
import { DrawerControls } from './features/drawers/types';
import { BottomDrawerControls } from './features/bottomDrawer/types';

export type AppContextType = {
	mapViewNativeNodeHandle?: number | null;
	appInnerHeight?: number;
	topAppBarHeight?: number;
	bottomBarHeight?: BottomBarHeight;
	setBottomBarHeight?: Dispatch<SetStateAction<BottomBarHeight>>;
	setTopAppBarHeight?: Dispatch<SetStateAction<number>>;
	mapHeight?: number;
	drawerControlsRef: MutableRefObject<DrawerControls | null>;
	bottomDrawerControlsRef: MutableRefObject<BottomDrawerControls | null>;
	/**
	 * Shared value tracking the bottom drawer's current open height (0 = collapsed).
	 * Written by the bottom drawer on the UI thread, read by overlays (center cursor,
	 * side drawers) so they track the shrinking map without JS round-trips.
	 */
	bottomDrawerHeightSv: SharedValue<number>;
	/**
	 * Plain JS ref tracking drawer-handle gestures (side or bottom). The
	 * drawer pan gestures update it from the JS thread via runOnJS on
	 * onBegin/onFinalize; the map press handler ignores map presses while
	 * `active > 0` or within the post-release grace window (`until`), so
	 * drawer open/close interactions never reach the map's gesture layer.
	 */
	drawerGestureRef: MutableRefObject<{ active: number; until: number }>;
	moveEnabled?: boolean;
	setMoveEnabled?: Dispatch<SetStateAction<boolean>>;
	mapCornerComponentsHeight?: number;
	setMapCornerComponentsHeight?: Dispatch<SetStateAction<number>>;
};

export const AppContext = createContext<AppContextType>({
	drawerControlsRef: createRef<DrawerControls>(),
	bottomDrawerControlsRef: createRef<BottomDrawerControls>(),
	bottomDrawerHeightSv: makeMutable(0),
	drawerGestureRef: { current: { active: 0, until: 0 } },
});

export type MapContextType = {
	currentMapEventRef: MutableRefObject<MapEventResponse | null>;
	/**
	 * Shared value tracking the map center [lng, lat] at ~25/sec,
	 * populated by useMapPosition(). Reads from JS are fast (no bridge).
	 * null until the first map-update event arrives.
	 */
	centerPositionSvRef: MutableRefObject<SharedValue<[number, number] | null> | null>;
};
export const MapContext = createContext<MapContextType>({
	currentMapEventRef: createRef<MapEventResponse>(),
	centerPositionSvRef: createRef<SharedValue<[number, number] | null> | null>(),
});
