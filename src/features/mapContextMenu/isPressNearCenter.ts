/**
 * Internal dependencies
 */
import { PixelRatio } from 'react-native';
import { MapContextMenuContext } from '../../types';

/** Max distance (dp) between the press and the viewport center for the
 * press to count as a "center press". */
export const CENTER_PRESS_THRESHOLD_DP = 24;

type MapPositionLike = {
	viewportWidthSv: { value: number };
	viewportHeightSv: { value: number };
} | null;

/**
 * True when a map-press context sits within CENTER_PRESS_THRESHOLD_DP of
 * the viewport center (press coords are map-local physical px; the
 * viewport sizes are dp).
 */
export const isPressNearCenter = (
	context: MapContextMenuContext,
	mapPosition: MapPositionLike
): boolean => {
	if (!mapPosition) {
		return false;
	}
	const vpW = mapPosition.viewportWidthSv.value;
	const vpH = mapPosition.viewportHeightSv.value;
	if (!vpW || !vpH) {
		return false;
	}
	const xDp = context.x / PixelRatio.get();
	const yDp = context.y / PixelRatio.get();
	return (
		Math.abs(xDp - vpW / 2) <= CENTER_PRESS_THRESHOLD_DP &&
		Math.abs(yDp - vpH / 2) <= CENTER_PRESS_THRESHOLD_DP
	);
};
