/**
 * External dependencies
 */
import { useEffect, useMemo, useState } from 'react';
import { debounce } from 'lodash-es';

/**
 * Internal dependencies
 */
import useMapZoomLevel from '../../../../compose/useMapZoomLevel';

const getSimplification = (zoomLevel: number) => {
	switch( true ) {
		case (zoomLevel >= 17 ):
			return 0.00001;
		case (zoomLevel >= 16 ):
			return 0.000025;
		case (zoomLevel >= 15 ):
			return 0.00004;
		case (zoomLevel >= 14 ):
			return 0.0001;
		case (zoomLevel >= 13 ):
			return 0.00015;
		case (zoomLevel >= 12 ):
			return 0.0003;
		case (zoomLevel >= 11 ):
			return 0.0008;
		case (zoomLevel >= 10 ):
			return 0.0015;
		case (zoomLevel >= 9 ):
			return 0.0025;
		case (zoomLevel >= 8 ):
			return 0.007;
		case (zoomLevel >= 7 ):
			return 0.01;
		case (zoomLevel >= 6 ):
			return 0.015;
		case (zoomLevel >= 5 ):
			return 0.04;
		case (zoomLevel >= 4 ):
			return 0.1;
		case (zoomLevel >= 3 ):
			return 0.2;
		default:
			return 0.35;
	}
};

const useSimplificationTolerance = () => {
	const zoomLevel = useMapZoomLevel();

	const [simplify, setSimplify] = useState<number | undefined>(undefined);

	const updateSimplify = useMemo(() => {
		return debounce((zoomLevel?: number) => {
			undefined !== zoomLevel && setSimplify(getSimplification(zoomLevel));
		}, 100);
	}, []);

	useEffect(() => {
		updateSimplify(zoomLevel);
	}, [zoomLevel]);

	return simplify;
};

export default useSimplificationTolerance;
