/**
 * External dependencies
 */
import { createContext, createRef, Dispatch, MutableRefObject, SetStateAction } from 'react';
import { MapEventResponse } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import {
	BottomBarHeight,
} from './types';

export type AppContextType = {
	mapViewNativeNodeHandle?: number | null;
	appInnerHeight?: number;
	topAppBarHeight?: number;
	bottomBarHeight?: BottomBarHeight;
	setBottomBarHeight?: Dispatch<SetStateAction<BottomBarHeight>>;
	setTopAppBarHeight?: Dispatch<SetStateAction<number>>;
	mapHeight?: number;
};

export const AppContext = createContext<AppContextType>({});

export type MapContextType = {
	currentMapEventRef: MutableRefObject<MapEventResponse | null>;
};
export const MapContext = createContext<MapContextType>({
	currentMapEventRef: createRef<MapEventResponse>(),
});
