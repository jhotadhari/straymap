/**
 * External dependencies
 */
import { createContext, createRef, Dispatch, MutableRefObject, SetStateAction } from 'react';
import { MapEventResponse } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { BottomBarHeight } from './types';
import { DrawerControls } from './store/features/drawers/types';

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
};

export const AppContext = createContext<AppContextType>({
	drawerControlsRef: createRef<DrawerControls>(),
});

export type MapContextType = {
	currentMapEventRef: MutableRefObject<MapEventResponse | null>;
};
export const MapContext = createContext<MapContextType>({
	currentMapEventRef: createRef<MapEventResponse>(),
});
