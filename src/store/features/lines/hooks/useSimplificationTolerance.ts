/**
 * External dependencies
 */
// import { useEffect, useMemo, useState } from 'react';
// import { linearInterpolation } from '@dmytropaduchak/simple-linear-interpolation';
// import { debounce } from 'lodash-es';

/**
 * Internal dependencies
 */
// import { roundTo } from '../../../../lib/utilsLight';
// import useMapZoomLevel from '../../../../compose/useMapZoomLevel';

// const steps = [
// 	{ x: 0, y: 0.5 },
// 	{ x: 5, y: 0.07 },
// 	{ x: 6, y: 0.015 },
// 	{ x: 9, y: 0.003 },
// 	{ x: 10, y: 0.0015 },
// 	{ x: 11, y: 0.001 },
// 	{ x: 12, y: 0.0003 },
// 	{ x: 15, y: 0.00005 },
// 	{ x: 16, y: 0.00005 },
// 	{ x: 17, y: 0.00001 },
// 	{ x: 20, y: 0.00001 },
// ];
// const interpolation = linearInterpolation(steps);

/**
 * ??? TODO once vtm is updated
 *
 */
const useSimplificationTolerance = () => {
	// const zoomLevel = useMapZoomLevel();

	// const [simplify, setSimplify] = useState<number | undefined>(undefined);

	// const updateSimplify = useMemo(() => {
	// 	return debounce((zoomLevel?: number) => {
	// 		let newSimplify;
	// 		if (undefined === zoomLevel || zoomLevel > steps[steps.length - 1].x) {
	// 			newSimplify = undefined;
	// 		} else {
	// 			newSimplify = roundTo(interpolation({ x: zoomLevel }), 7);
	// 		}
	// 		setSimplify(newSimplify);
	// 	}, 100);
	// }, []);

	// useEffect(() => {
	// 	updateSimplify(zoomLevel);
	// }, [zoomLevel]);

	// return simplify;
	return 0.00001;
};

export default useSimplificationTolerance;
