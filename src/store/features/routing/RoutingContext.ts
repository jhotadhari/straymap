/**
 * External dependencies
 */
import { Dispatch, SetStateAction, createContext } from "react";
import { LocationExtended } from "react-native-mapsforge-vtm";

/**
 * Internal dependencies
 */
import { RoutingTriggeredSegment, NearestSimplifiedCoord } from "./types";

export type RoutingContextType = {
	triggerSegmentsUpdate?: () => void;
};

export const RoutingContext = createContext<RoutingContextType>({});
