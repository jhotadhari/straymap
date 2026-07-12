/**
 * External dependencies
 */
import { useContext, useState, useEffect, useRef } from 'react';

/**
 * Internal dependencies
 */
import { AppContext, MapContext } from '../Context';
import { selectIsBusy } from '../features/ui/selectors';
import { useAppSelector } from '../store/hooks';

const useShowInitialSplash = () => {
	const { mapViewNativeNodeHandle } = useContext(AppContext);
	const { currentMapEventRef } = useContext(MapContext);

	const isBusy = useAppSelector(selectIsBusy);

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

	useEffect(() => {
		if (showSplash && mapLayersCreatedDef && !isBusy) {
			setShowSplash(false);
		}
	}, [
		mapLayersCreatedDef,
		isBusy,
		showSplash,
	]);
	return showSplash;
};

export default useShowInitialSplash;
