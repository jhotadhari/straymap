/**
 * External dependencies
 */
import { useContext, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bbox, useMap } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { FooterContext } from '../Context';
import { queryLinesWithoutGeom } from '../../../db/queryFns';
import { AppContext } from '../../../../../Context';

const useFlyTo = () => {
	const { checkedIds } = useContext(FooterContext);
	const { mapViewNativeNodeHandle } = useContext(AppContext);
	const { flyToBounds } = useMap(mapViewNativeNodeHandle);

	const { data: lines } = useQuery({
		queryKey: ['lines', checkedIds],
		queryFn: queryLinesWithoutGeom,
		enabled: checkedIds.length > 0,
	});

	const cb = useCallback(() => {
		if (!lines?.length || !mapViewNativeNodeHandle) return;

		let minLng = Infinity;
		let minLat = Infinity;
		let maxLng = -Infinity;
		let maxLat = -Infinity;

		for (const line of lines) {
			if (!line?.envelope) continue;
			const ring = line.envelope.coordinates[0];
			for (const coord of ring) {
				if (coord[0] < minLng) minLng = coord[0];
				if (coord[0] > maxLng) maxLng = coord[0];
				if (coord[1] < minLat) minLat = coord[1];
				if (coord[1] > maxLat) maxLat = coord[1];
			}
		}

		if (minLng === Infinity) return;

		const bbox: Bbox = [
			minLng,
			minLat,
			maxLng,
			maxLat,
		];
		flyToBounds(bbox, { paddingPx: 64 });
	}, [
		lines,
		mapViewNativeNodeHandle,
		flyToBounds,
	]);

	const disabled = useCallback(() => checkedIds.length === 0, [checkedIds]);

	return useMemo(
		() => ({
			key: 'flyTo',
			cb,
			label: 'lines.flyTo',
			leadingIcon: 'image-filter-center-focus-strong-outline',
			disabled,
		}),
		[cb, disabled]
	);
};

export default useFlyTo;
