/**
 * External dependencies
 */
import rnUuid from 'react-native-uuid';
import { Point } from 'geojson';
import { getTrackFromParams, GetTrackParams } from 'react-native-brouter';
import { omit } from 'lodash-es';

/**
 * Internal dependencies
 */
import { parseSerialized, sortArrayByOrderArray } from '../../../lib/utilsGeneral';
import { JSONTracKParsed, RoutingPoint, RoutingSegment } from './types';
import { runAfterInteractions } from '../../../lib/utils';
import { getRoutesWithPoints } from './db/selectors';
import { store } from '../../store';
import { setPoints } from './routingSlice';

// Remove unused segments
export const filterSegments = (
	segments: RoutingSegment[],
	points: RoutingPoint[],
	sort?: boolean
): RoutingSegment[] => {
	if (!points || !points.length) {
		return [];
	}

	const segmentIdxsDelete = [...segments]
		.map((segment, index) => {
			const fromPointIdx = points.findIndex((point) => segment.fromId === point.id);
			const toPointIdx = points.findIndex((point) => segment.toId === point.id);
			if (-1 === fromPointIdx || -1 === toPointIdx || toPointIdx !== fromPointIdx + 1) {
				return index;
			}
			return false;
		})
		.filter((a) => false !== a);

	const newSegments =
		segmentIdxsDelete.length > 0
			? [...segments].filter((_, index) => !segmentIdxsDelete.includes(index))
			: [...segments];

	return sort
		? (sortArrayByOrderArray(
				newSegments,
				[...points].map((point) => point.id),
				'fromId'
			) as RoutingSegment[])
		: newSegments;
};

export const updateSegmentForIndex = ({
	segmentIndex,
	point,
	nextPoint,
	hasDelay,
	newSegments,
	resolve,
	dispatchSetSegments,
}: {
	segmentIndex: number;
	point: RoutingPoint;
	nextPoint: RoutingPoint;
	hasDelay: boolean;
	newSegments: RoutingSegment[];
	resolve: (value: RoutingSegment[] | PromiseLike<RoutingSegment[]>) => void;
	dispatchSetSegments: (newSegments: RoutingSegment[]) => void;
}) => {
	let newSegment: RoutingSegment = {
		...(-1 === segmentIndex && point && nextPoint
			? {}
			: {
					...newSegments[segmentIndex],
				}),
		key: rnUuid.v4() as string,
		fromId: point.id,
		toId: nextPoint.id,
		isFetching: true,
	};

	if (-1 === segmentIndex) {
		newSegments = [...newSegments, newSegment];
		segmentIndex = newSegments.length - 1;
	} else {
		newSegments.splice(segmentIndex, 1, newSegment);
	}
	dispatchSetSegments(newSegments);

	const params: GetTrackParams = {
		lonlats: [
			[
				point.geometry.coordinates[0],
				point.geometry.coordinates[1],
			].join(','),
			[
				nextPoint.geometry.coordinates[0],
				nextPoint.geometry.coordinates[1],
			].join(','),
		].join('|'),
		trackFormat: 'json',
		fast: point?.profile?.fast,
		v: point?.profile?.v,
	};

	runAfterInteractions(
		() => {
			setTimeout(
				() =>
					getTrackFromParams(params)
						.then((result: string) => {
							const parsed: false | JSONTracKParsed = parseSerialized(result) as
								| false
								| JSONTracKParsed;
							if (parsed && parsed.features) {
								newSegment = {
									...newSegment,
									positions: [...parsed.features]
										.map((feature) =>
											[...feature.geometry.coordinates].map((coord) => ({
												lng: coord[0],
												lat: coord[1],
												alt: coord[2],
											}))
										)
										.flat(),
									isFetching: false,
								};
								newSegments && newSegments.splice(segmentIndex, 1, newSegment);
								resolve(newSegments || []);
							} else {
								newSegment = {
									...newSegment,
									isFetching: false,
									errorMsg: result,
								};
								newSegments && newSegments.splice(segmentIndex, 1, newSegment);
								resolve(newSegments || []);
							}
						})
						.catch((e: any) => {
							newSegment = {
								...newSegment,
								isFetching: false,
								errorMsg: e?.userInfo?.errorMsg,
							};
							newSegments && newSegments.splice(segmentIndex, 1, newSegment);
							resolve(newSegments || []);
						}),
				hasDelay ? 0 : 400
			);
		},
		hasDelay ? 0 : 100
	);
};

export const updateSegments = (
	points: RoutingPoint[],
	segments: RoutingSegment[],
	dispatchSetSegments: (newSegments: RoutingSegment[]) => void
) => {
	if (points.length <= 1) {
		return new Promise((resolve) => {
			resolve([]);
		});
	}
	[...points]
		.reduce(
			(newSegmentsPromise, point, index) => {
				return newSegmentsPromise.then((newSegments) => {
					return new Promise((resolve) => {
						if (points.length > index + 1) {
							const segmentIndex = segments.findIndex(
								(segment) =>
									segment.fromId === point.id &&
									segment.toId === points[index + 1].id
							);
							if (
								-1 === segmentIndex ||
								(!segments[segmentIndex].isFetching &&
									!segments[segmentIndex].positions)
							) {
								updateSegmentForIndex({
									segmentIndex: segmentIndex,
									point: point,
									nextPoint: points[index + 1],
									hasDelay: 0 !== index,
									newSegments: newSegments,
									resolve: resolve,
									dispatchSetSegments: dispatchSetSegments,
								});
							} else {
								resolve(newSegments);
							}
						} else {
							resolve(newSegments);
						}
					});
				});
			},
			Promise.resolve([...segments])
		)
		.then((newSegments: RoutingSegment[]) => {
			dispatchSetSegments(newSegments);
		});
};

export const updateStorePointsFromDb = async (routeId: number) => {
	const routes = await getRoutesWithPoints({
		routeId,
	});

	if (!routes?.length) {
		return;
	}

	const newPointsFromDb = routes[0].points.map((point) => {
		return {
			...omit(point, 'geometryGeoJSON'),
			geometry: parseSerialized<Point>(point.geometryGeoJSON)!,
		};
	});

	store.dispatch(setPoints(newPointsFromDb));
};
