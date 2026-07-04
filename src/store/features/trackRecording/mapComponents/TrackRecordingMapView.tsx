/**
 * External dependencies
 */
import React, { FC } from 'react';
import { LayerPath } from 'react-native-mapsforge-vtm';
import { useQuery } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../hooks';
import { selectActiveLineId, selectIsRecording } from '../selectors';
import { queryLineGeom } from '../../lines/db/queryFns';

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

	if (!activeLineId || !line?.geometry?.coordinates || !isRecording) {
		return null;
	}

	return (
		<LayerPath
			coordinates={line.geometry.coordinates}
			style={{
				strokeColor: '#FF4444',
				strokeWidth: 5,
			}}
		/>
	);
};

export default TrackRecordingMapView;
