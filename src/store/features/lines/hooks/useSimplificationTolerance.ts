/**
 * External dependencies
 */
import { useEffect, useRef, useState } from 'react';

/**
 * Internal dependencies
 */
import useMapZoomLevel from '../../../../compose/useMapZoomLevel';

const getSimplification = (zoomLevel: number) => {
	switch (true) {
		case zoomLevel >= 14:
			return 0.00001;
		case zoomLevel >= 11:
			return 0.0001;
		case zoomLevel >= 8:
			return 0.0005;
		case zoomLevel >= 5:
			return 0.003;
		default:
			return 0.03;
	}
};

const useSimplificationTolerance = () => {
	const zoomLevel = useMapZoomLevel();

	const [simplify, setSimplify] = useState<number | undefined>(undefined);

	// Keep the latest zoom in a ref so the timeout callback always reads the
	// freshest value, not a stale closure capture.
	const zoomRef = useRef(zoomLevel);
	zoomRef.current = zoomLevel;

	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => {
		if (zoomLevel === undefined) return;

		// Cancel any pending timeout from a previous zoom change, then
		// schedule a fresh one.  Unlike the bbox ticker (which fires at
		// ~25 Hz), this effect only runs when the zoom value actually
		// changes, so cancel+reschedule is the right debounce pattern here.
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}

		timeoutRef.current = setTimeout(() => {
			timeoutRef.current = null;
			const latest = zoomRef.current;
			if (latest !== undefined) {
				setSimplify(getSimplification(latest));
			}
		}, 100);

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		};
	}, [zoomLevel]);

	return simplify;
};

export default useSimplificationTolerance;
