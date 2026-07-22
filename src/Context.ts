/**
 * External dependencies
 */
import { createContext, createRef, Dispatch, MutableRefObject, SetStateAction } from 'react';
import { SharedValue } from 'react-native-reanimated';
import { MapEventResponse } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { BottomBarHeight } from './types';
import { DrawerControls } from './features/drawers/types';

export type AppContextType = {
	mapViewNativeNodeHandle?: number | null;
	appInnerHeight?: number;
	topAppBarHeight?: number;
	bottomBarHeight?: BottomBarHeight;
	setBottomBarHeight?: Dispatch<SetStateAction<BottomBarHeight>>;
	setTopAppBarHeight?: Dispatch<SetStateAction<number>>;
	mapHeight?: number;
	drawerControlsRef: MutableRefObject<DrawerControls | null>;
	moveEnabled?: boolean;
	setMoveEnabled?: Dispatch<SetStateAction<boolean>>;
	mapCornerComponentsHeight?: number;
	setMapCornerComponentsHeight?: Dispatch<SetStateAction<number>>;
};

export const AppContext = createContext<AppContextType>({
	drawerControlsRef: createRef<DrawerControls>(),
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
