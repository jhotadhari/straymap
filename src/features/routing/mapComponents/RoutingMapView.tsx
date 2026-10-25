/**
 * External dependencies
 */
import React, { FC, Fragment, memo, useContext, useMemo, useState } from 'react';
import {
	PathPaint,
	Marker,
	MarkerPaint,
	LayerPath,
	ReindexScope,
	SharedLayer,
	useMapEventInterval,
} from 'react-native-mapsforge-vtm';
import {
	LayerPathColorRamp,
	usePathColorRamp,
	calculateSlope,
} from 'react-native-mapsforge-vtm-ext-path-color-ramp';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectSegmentByRecordId, selectMovedPointId } from '../selectors';
import { getSegmentRecordId, getSimplifiedSegmentCoords, resolveProfileForPoint } from '../utils';
import { ROUTING_SIMPLIFY_TOLERANCE } from '../constants';
import useRoute from '../hooks/useRoute';
// import useSimplificationTolerance from '../../lines/hooks/useSimplificationTolerance';
import { RoutingPoint } from '../types';
import { pointsCoordsAreOverlapping } from '../../../lib/utils';
import { MapContext } from '../../../Context';
import { selectMapUpdateInterval } from '../../general/selectors';
import { routingLayerRegistry } from '../layerRegistry';
import { SLOPE_COLOR_RAMP } from '../constants';

const SegmentLineLayer: FC<{
	segmentRecordId: string;
	coordinates: [
		number,
		number,
		number,
	][];
}> = memo(({ segmentRecordId, coordinates }) => {
	const prepared = useMemo(
		() => ({
			segmentValues: calculateSlope(coordinates),
			colorRamp: SLOPE_COLOR_RAMP,
		}),
		[coordinates]
	);

	const { colorRampStops, normalizedValues } = usePathColorRamp({
		coordinates,
		segmentValues: prepared.segmentValues,
		colorRamp: prepared.colorRamp,
	});

	return (
		<LayerPathColorRamp
			key={segmentRecordId}
			coordinates={coordinates}
			segmentValues={normalizedValues}
			colorRampStops={colorRampStops}
			paint={paintPathRamp}
			onCreate={(response) => {
				routingLayerRegistry.segmentUuidByRecordId.set(segmentRecordId, response.uuid);
			}}
			onRemove={(response) => {
				if (
					routingLayerRegistry.segmentUuidByRecordId.get(segmentRecordId) ===
					response.uuid
				) {
					routingLayerRegistry.segmentUuidByRecordId.delete(segmentRecordId);
				}
			}}
		/>
	);
});

const SegmentLine: FC<{
	simplify?: number;
	segmentRecordId: string;
	placeholderCoordinates: number[][];
	provider?: string;
}> = memo(({ simplify, segmentRecordId, placeholderCoordinates, provider }) => {
	const segment = useAppSelector((state) => selectSegmentByRecordId(state, segmentRecordId));

	const simplifiedCoords = useMemo(
		() => getSimplifiedSegmentCoords(segment?.positions, simplify, provider),
		[
			segment?.positions,
			simplify,
			provider,
		]
	);

	let coords: number[][] | undefined = undefined;
	let paint: PathPaint | undefined = undefined;

	if (
		!segment ||
		segment?.isFetching ||
		(segment?.positions?.length ?? 0) < 2 ||
		segment?.errorMsg ||
		!simplifiedCoords
	) {
		coords = placeholderCoordinates;
		if (
			(segment && segment?.positions && segment?.positions.length < 2) || // if segment is empty but brouter swallowed the error silently
			segment?.errorMsg
		) {
			paint = paintPathError;
		} else if (!segment || segment?.isFetching || !simplifiedCoords) {
			paint = paintPathFetching;
		} else {
			paint = paintPathError;
		}
	} else if (simplifiedCoords) {
		coords = simplifiedCoords;
	}

	if (!coords) {
		return undefined;
	}

	if (!simplifiedCoords) {
		return (
			<LayerPath
				key={segmentRecordId + 'fallback'}
				coordinates={coords}
				paint={paint}
				onCreate={(response) => {
					routingLayerRegistry.segmentUuidByRecordId.set(segmentRecordId, response.uuid);
				}}
				onRemove={(response) => {
					if (
						routingLayerRegistry.segmentUuidByRecordId.get(segmentRecordId) ===
						response.uuid
					) {
						routingLayerRegistry.segmentUuidByRecordId.delete(segmentRecordId);
					}
				}}
			/>
		);
	}

	return (
		<SegmentLineLayer
			key={segmentRecordId}
			segmentRecordId={segmentRecordId}
			coordinates={
				coords as [
					number,
					number,
					number,
				][]
			}
		/>
	);
});

const Segments: FC<{
	points?: RoutingPoint[];
}> = memo(({ points }) => {
	// Lets use a fixed simplification tolerance. Doesn't work fast rerenders with LayerPathColorRamp.
	// const simplify = useSimplificationTolerance();
	const simplify = ROUTING_SIMPLIFY_TOLERANCE;

	const route = useRoute(['profile']);
	const routeProfile = route?.profile;

	// Stable per-segment references so SegmentLine/SegmentLineLayer's
	// memo wrappers can actually bail out: resolved providers and the
	// placeholder coordinate pairs are both rebuilt only when `points`
	// (or the route profile) changes.
	const providersByIndex = useMemo(
		() =>
			points
				? points.map((fromPoint, index) =>
						routeProfile
							? resolveProfileForPoint(fromPoint, index, points, routeProfile)
									.provider
							: fromPoint.profile?.provider
					)
				: [],
		[
			points,
			routeProfile,
		]
	);

	const placeholdersByIndex = useMemo(
		() =>
			points
				? points.map((fromPoint, index) => {
						const toPoint = get(points, index + 1);
						if (
							!toPoint ||
							pointsCoordsAreOverlapping(
								fromPoint.geometry.coordinates,
								toPoint.geometry.coordinates
							)
						) {
							return undefined;
						}
						return [
							fromPoint.geometry.coordinates,
							toPoint.geometry.coordinates,
						];
					})
				: [],
		[points]
	);

	return (
		<ReindexScope order={300}>
			{points &&
				points.length > 0 &&
				points.map((fromPoint, index) => {
					const toPoint = get(points, index + 1);

					// Ensure the segment has two points. And points are not overlapping.
					if (!toPoint || placeholdersByIndex[index] === undefined) {
						return undefined;
					}

					const segmentRecordId = getSegmentRecordId({
						fromId: fromPoint.id,
						toId: toPoint.id,
					});

					return (
						<SegmentLine
							key={segmentRecordId}
							segmentRecordId={segmentRecordId}
							placeholderCoordinates={placeholdersByIndex[index]}
							simplify={simplify}
							provider={providersByIndex[index]}
						/>
					);
				})}
		</ReindexScope>
	);
});

const Markers: FC<{
	points?: RoutingPoint[];
	movedPointId: number | null;
}> = memo(({ points, movedPointId }) => {
	const markerElements = useMemo(() => {
		if (!points) return null;
		return points.map((point, index) => {
			const isMoving = movedPointId === point.id;
			return (
				<Marker
					key={point.id}
					position={point.geometry.coordinates}
					paint={{
						text: index + 1 + '',
						textMargin: 15,
						...(isMoving && paintMoveHighlight),
					}}
					onCreate={(response) => {
						routingLayerRegistry.markerUuidByPointId.set(point.id, response.uuid);
					}}
					onRemove={(response) => {
						if (
							routingLayerRegistry.markerUuidByPointId.get(point.id) === response.uuid
						) {
							routingLayerRegistry.markerUuidByPointId.delete(point.id);
						}
					}}
				/>
			);
		});
	}, [
		points,
		movedPointId,
	]);

	return (
		<ReindexScope order={400}>
			<SharedLayer>{markerElements}</SharedLayer>
		</ReindexScope>
	);
});

const RoutingMapView = () => {
	const { points } =
		useRoute([
			'points',
		]) || {};
	const movedPointId = useAppSelector(selectMovedPointId);
	const { currentMapEventRef } = useContext(MapContext);
	const mapUpdateInterval = useAppSelector(selectMapUpdateInterval);
	const [liveCenter, setLiveCenter] = useState<[number, number] | null>(null);

	useMapEventInterval(currentMapEventRef, mapUpdateInterval, (event) => {
		const center = event?.center;
		setLiveCenter((prev) => {
			if (!movedPointId || !center || center.length < 2) {
				return prev ? null : prev;
			}
			const next: [number, number] = [center[0], center[1]];
			if (prev && prev[0] === next[0] && prev[1] === next[1]) {
				return prev;
			}
			return next;
		});
	});

	// While a point is being moved, its coordinates follow the live map
	// center: the marker moves with the crosshair and the adjacent
	// placeholder (fallback) segment lines follow along.
	const effectivePoints = useMemo(() => {
		if (!points || !movedPointId || !liveCenter) {
			return points;
		}
		return points.map((p) =>
			p.id === movedPointId
				? {
						...p,
						geometry: {
							...p.geometry,
							coordinates: [
								liveCenter[0],
								liveCenter[1],
								p.geometry.coordinates[2] ?? 0,
							],
						},
					}
				: p
		);
	}, [
		points,
		movedPointId,
		liveCenter,
	]);

	return (
		<Fragment>
			<Segments points={effectivePoints} />
			<Markers
				points={effectivePoints}
				movedPointId={movedPointId}
			/>
		</Fragment>
	);
};

// PathPaint is a custom map-layer paint type, not an RN ViewStyle, so these stay plain objects (not StyleSheet.create).
const paintPathFetching: PathPaint = {
	strokeColor: '#0000ff',
	strokeWidth: 3,
};
const paintPathError: PathPaint = {
	strokeColor: '#ff0000',
	strokeWidth: 3,
};

const paintPathRamp: PathPaint = { strokeWidth: 6 };

const paintMoveHighlight: MarkerPaint = {
	fillColor: '#ff8800',
	strokeColor: '#ffffff',
	strokeWidth: 4,
	textColor: '#ffffff',
};

export default RoutingMapView;
