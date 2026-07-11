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
		case (zoomLevel >= 14 ):
			return 0.00001;
		case (zoomLevel >= 11 ):
			return 0.0001;
		case (zoomLevel >= 8 ):
			return 0.0005;
		case (zoomLevel >= 5 ):
			return 0.003;
		default:
			return 0.03;
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
