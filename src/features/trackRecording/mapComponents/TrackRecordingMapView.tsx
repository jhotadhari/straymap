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
import { selectTrackLineId } from '../selectors';
import { queryLineGeom } from '../../lines/db/queryFns';

const paintRecordingLine = {
	strokeColor: '#FF4444' as `#${string}`,
	strokeWidth: 5,
};

const TrackRecordingMapView: FC = () => {
	const lineId = useAppSelector(selectTrackLineId);

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
					paint={paintRecordingLine}
				/>
			)}
		</ReindexScope>
	);
};

export default TrackRecordingMapView;
