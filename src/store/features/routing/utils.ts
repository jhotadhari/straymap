import { sortArrayByOrderArray } from "../../../lib/utilsGeneral";
import { RoutingPoint, RoutingSegment } from "./types";

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