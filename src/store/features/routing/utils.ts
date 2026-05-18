import rnUuid from 'react-native-uuid';

import { parseSerialized, sortArrayByOrderArray } from '../../../lib/utilsGeneral';
import { JSONTracKParsed, RoutingPoint, RoutingSegment } from './types';
import { runAfterInteractions } from '../../../lib/utils';
import { getTrackFromParams, GetTrackParams } from 'react-native-brouter';
import { pick } from 'lodash-es';

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
			const fromPointIdx = points.findIndex((point) => segment.fromKey === point.key);
			const toPointIdx = points.findIndex((point) => segment.toKey === point.key);
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
				[...points].map((point) => point.key),
				'fromKey'
			) as RoutingSegment[])
		: newSegments;
};

export const updateSegmentForIndex = (
	segmentIndex: number,
	point: RoutingPoint,
	nextPoint: RoutingPoint,
	hasDelay: boolean,
	newSegments: RoutingSegment[],
	resolve: (value: RoutingSegment[] | PromiseLike<RoutingSegment[]>) => void,
	dispatchSetSegments: (newSegments: RoutingSegment[]) => void
) => {
	// newSegments = newSegments ? newSegments : [...segments];

	const prevSegment = newSegments.find((seg) => seg.toKey === point.key);

	let newSegment: RoutingSegment = {
		...(-1 === segmentIndex && point && nextPoint
			? {
					profile: {
						fast: prevSegment?.profile?.fast || true, // ??? from defaults, or from previous or from cut segment
						v: prevSegment?.profile?.v || 'motorcar', // ??? from defaults, or from previous or from cut segment
					},
				}
			: {
					...newSegments[segmentIndex],
				}),
		key: rnUuid.v4() as string,
		fromKey: point.key,
		toKey: nextPoint.key,
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
			Object.values(pick(point.location, ['lng', 'lat'])).join(','),
			Object.values(pick(nextPoint.location, ['lng', 'lat'])).join(','),
		].join('|'),
		trackFormat: 'json',
		fast: newSegment.profile.fast,
		v: newSegment.profile.v,
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
	[...points].reduce(
		(newSegmentsPromise, point, index) => {
			return newSegmentsPromise.then((newSegments) => {
				return new Promise((resolve) => {
					if (points.length > index + 1) {
						const segmentIndex = segments.findIndex(
							(segment) =>
								segment.fromKey === point.key &&
								segment.toKey === points[index + 1].key
						);
						if (
							-1 === segmentIndex ||
							(!segments[segmentIndex].isFetching &&
								!segments[segmentIndex].positions)
						) {
							updateSegmentForIndex(
								segmentIndex,
								point,
								points[index + 1],
								0 !== index,
								newSegments,
								resolve,
								dispatchSetSegments
							);
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
	).then(
		(newSegments: RoutingSegment[]) => {
			dispatchSetSegments(newSegments);
		}
	);;
};
