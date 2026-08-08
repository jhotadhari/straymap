/**
 * External dependencies
 */
import { useContext, useState, useEffect, useRef } from 'react';

/**
 * Internal dependencies
 */
import { AppContext, MapContext } from '../Context';

const useShowInitialSplash = () => {
	const { mapViewNativeNodeHandle } = useContext(AppContext);
	const { currentMapEventRef } = useContext(MapContext);

	const [mapLayersCreatedDef, setMapLayersCreatedDef] = useState(false);
	const [showSplash, setShowSplash] = useState(true);

	// No native signal for "all initial layers have finished creating" exists anymore (the
	// old library's useMapLayersCreated/MapLayersCreated event was dropped, no replacement
	// upstream) -- approximate it by waiting for the map's first onMapUpdate event, which only
	// fires once the native map has actually rendered a frame with its layers mounted.
	const intervalIdRef = useRef<null | ReturnType<typeof setInterval>>(null);
	useEffect(() => {
		if (mapLayersCreatedDef || !mapViewNativeNodeHandle) {
			return;
		}
		intervalIdRef.current = setInterval(() => {
			if (currentMapEventRef.current) {
				intervalIdRef.current && clearInterval(intervalIdRef.current);
				setTimeout(() => setMapLayersCreatedDef(true), 100);
			}
		}, 100);
		return () => {
			intervalIdRef.current && clearInterval(intervalIdRef.current);
		};
	}, [
		mapViewNativeNodeHandle,
		mapLayersCreatedDef,
		currentMapEventRef,
	]);

	// Hide splash once the map has rendered its first frame with layers mounted.
	// Previously also waited on !isBusy, but that was decoupled: the splash
	// should disappear quickly so the app feels fast; the TopAppBar's
	// LoadingIndicator signals ongoing work that doesn't block interaction.
	useEffect(() => {
		if (showSplash && mapLayersCreatedDef) {
			setShowSplash(false);
		}
	}, [
		mapLayersCreatedDef,
		showSplash,
	]);
	return showSplash;
};

export default useShowInitialSplash;
