/**
 * External dependencies
 */
import React, { FC } from 'react';
import { LayerPath, ReindexScope } from 'react-native-mapsforge-vtm';
import { useQuery } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectTrackLineId, selectLineWidth } from '../selectors';
import { queryLineGeom } from '../../lines/db/queryFns';
import { PALETTE_COLORS } from '../../../constants';

const TrackRecordingMapView: FC = () => {
	const lineId = useAppSelector(selectTrackLineId);
	const lineWidth = useAppSelector(selectLineWidth);

	const { data: line } = useQuery({
		queryKey: [
			'lineGeom',
			lineId ?? -1,
		],
		queryFn: queryLineGeom,
		enabled: lineId != null,
		gcTime: 1000 * 10,
	});

	return (
		<ReindexScope order={310}>
			{lineId != null && line?.geometry?.coordinates && (
				<LayerPath
					coordinates={line.geometry.coordinates}
					paint={{
						strokeColor: PALETTE_COLORS[0].bg as `#${string}`,
						strokeWidth: lineWidth,
					}}
				/>
			)}
		</ReindexScope>
	);
};

export default TrackRecordingMapView;
