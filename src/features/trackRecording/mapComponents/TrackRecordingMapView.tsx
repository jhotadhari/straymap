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
import { selectActiveLineId, selectIsRecording } from '../selectors';
import { queryLineGeom } from '../../lines/db/queryFns';

const paintRecordingLine = {
	strokeColor: '#FF4444' as `#${string}`,
	strokeWidth: 5,
};

const TrackRecordingMapView: FC = () => {
	const activeLineId = useAppSelector(selectActiveLineId);
	const isRecording = useAppSelector(selectIsRecording);

	const lineId = activeLineId ?? -1;
	const { data: line } = useQuery({
		queryKey: [
			'lineGeom',
			lineId,
			'recording',
		],
		queryFn: queryLineGeom,
		enabled: !!activeLineId,
		gcTime: 1000 * 10,
	});

	return (
		<ReindexScope order={310}>
			{activeLineId && line?.geometry?.coordinates && isRecording && (
				<LayerPath
					coordinates={line.geometry.coordinates}
					paint={paintRecordingLine}
				/>
			)}
		</ReindexScope>
	);
};

export default TrackRecordingMapView;
