/**
 * External dependencies
 */
import { useContext, useEffect, useRef, useState } from 'react';
import { MapEventResponse } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { MapContext } from '../Context';
import { selectMapUpdateInterval } from '../store/features/general/selectors';
import { useAppSelector } from '../store/hooks';

const useMapZoomLevel = () => {
	const { currentMapEventRef } = useContext(MapContext);
	const mapUpdateInterval = useAppSelector(selectMapUpdateInterval);

	const [zoomLevel, setZoomLevel] = useState<MapEventResponse['zoomLevel']>(undefined);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		intervalRef.current = setInterval(() => {
			setZoomLevel(currentMapEventRef?.current?.zoomLevel);
		}, mapUpdateInterval);
		return () => {
			intervalRef.current && clearInterval(intervalRef.current);
		};
	}, [currentMapEventRef, mapUpdateInterval]);

	return zoomLevel;
};

export default useMapZoomLevel;
