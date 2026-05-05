/**
 * External dependencies
 */
import {
    createContext,
    createRef,
    Dispatch,
    MutableRefObject,
    SetStateAction,
} from "react";
import { LocationExtended, MapEventResponse } from "react-native-mapsforge-vtm";

/**
 * Internal dependencies
 */
import {
    ThemeOption,
    HierarchyItem,
    RoutingSegment,
    RoutingPoint,
    RoutingTriggeredSegment,
    BottomBarHeight,
    NearestSimplifiedCoord,
    RoutingStats,
} from "./types";

export type AppContextType = {
	themeOptions?: ThemeOption[];
    mapViewNativeNodeHandle?: number | null;
    appInnerHeight?: number;
    topAppBarHeight?: number;
    bottomBarHeight?: BottomBarHeight;
	selectedHierarchyItems?: null | HierarchyItem[];
	setSelectedHierarchyItems?: Dispatch<SetStateAction<null | HierarchyItem[]>>;
    mapHeight?: number;
};

export const AppContext = createContext<AppContextType>( {} );

export type MapContextType = {
    currentMapEventRef: MutableRefObject<MapEventResponse | null>;
};
export const MapContext = createContext<MapContextType>( {
    currentMapEventRef: createRef<MapEventResponse>(),
} );

export type RoutingContextType = {
    savedExported?: {
        saved: boolean,
        exported: boolean,
    };
    setSavedExported?: Dispatch<SetStateAction<{
        saved: boolean,
        exported: boolean,
    }>>;
    movingPointIdx?: number;
    setMovingPointIdx?: Dispatch<SetStateAction<undefined | number>>;
    isRouting?: boolean;
    setIsRouting?: Dispatch<SetStateAction<boolean>>;
    points?: RoutingPoint[];
    setPoints?: Dispatch<SetStateAction<RoutingPoint[]>>;
    segments?: RoutingSegment[];
    setSegments?: Dispatch<SetStateAction<RoutingSegment[]>>;
    markerLayerUuid?: null | string;
    setMarkerLayerUuid?: Dispatch<SetStateAction<null | string>>;
    pathLayerUuids?: null | string[];
    setPathLayerUuids?: Dispatch<SetStateAction<null | string[]>>;
    triggeredMarkerIdx?: number
    setTriggeredMarkerIdx?: Dispatch<SetStateAction<undefined | number>>;
    triggeredSegment?: RoutingTriggeredSegment;
    setTriggeredSegment?: Dispatch<SetStateAction<undefined | RoutingTriggeredSegment>>;
    triggerSegmentsUpdate?: () => void;
    nearestSimplifiedCoord?: NearestSimplifiedCoord;
    nearestSimplifiedLocation?: LocationExtended;
    stats?: RoutingStats;
};

export const RoutingContext = createContext<RoutingContextType>( {} );
