/**
 * External dependencies
 */
import { useContext, useState, useEffect } from 'react';
import { useMapLayersCreated } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { AppContext } from '../Context';
import { selectIsBusy } from '../store/features/ui/selectors';
import { useAppSelector } from '../store/hooks';

const useShowInitialSplash = () => {
	const { mapViewNativeNodeHandle } = useContext(AppContext);

	const isBusy = useAppSelector(selectIsBusy);

	const mapLayersCreated = useMapLayersCreated(mapViewNativeNodeHandle);
	const [mapLayersCreatedDef, setMapLayersCreatedDef] = useState(false);
	const [showSplash, setShowSplash] = useState(true);
	useEffect(() => {
		if (mapLayersCreated) {
			setTimeout(() => {
				setMapLayersCreatedDef(true);
			}, 100);
		}
	}, [mapLayersCreated]);
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
