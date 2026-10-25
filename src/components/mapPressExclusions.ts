/**
 * Pure geometry helpers for deciding whether a map press (tap or long
 * press) started on top of drawer UI — side drawer handles/content or the
 * bottom drawer handle/content — and should therefore NOT be treated as a
 * press on the map itself (no context menu, no drawer closing).
 *
 * The library's HitTestLayer fires `onTap`/`onLongPress` for every press
 * that reaches the native map view, including presses that land on the RN
 * drawer overlays drawn above it. These exclusions mirror the drawers'
 * layout in map-local dp coordinates.
 */

export interface MapPressExclusionParams {
	/** Press position, map-local dp. */
	x: number;
	y: number;
	/** Press position, window dp (map-local y plus the map wrapper's window offset). */
	windowY: number;
	/** Map width in dp (window width). */
	width: number;
	/** Window height in dp — the app is edge-to-edge, so the bottom edge of the
	 * map wrapper coincides with the window bottom. */
	windowHeight: number;
	/** Safe-area bottom inset in dp (system navigation bar). */
	insetsBottom: number;
	drawerWidthResponsive: number;
	drawerHandleSize: number;
	bottomDrawerHandleHeight: number;
	/** Whether the bottom drawer has items (and therefore renders a handle). */
	bottomDrawerItemsExist: boolean;
	/** Current bottom drawer content height (shared value snapshot), dp. */
	bottomDrawerHeight: number;
	/** Left drawer translationX or null when controls are unavailable (treated as closed). */
	leftTranslationX: number | null;
	/** Right drawer translationX or null when controls are unavailable (treated as closed). */
	rightTranslationX: number | null;
	leftItemCount: number;
	rightItemCount: number;
}

/**
 * Total height of a side drawer's handle column: each handle is
 * `handleSize` tall plus a `handleSize / 2` gap below it.
 */
export const getDrawerHandleColumnHeight = (itemsCount: number, drawerHandleSize: number): number =>
	itemsCount * drawerHandleSize + itemsCount * (drawerHandleSize / 2);

/**
 * Returns true when the press at (x, y) should be ignored by map press
 * handlers because it started over drawer UI:
 *
 * - Bottom drawer (drawn above the side drawers): the handle strip pokes
 *   `bottomDrawerHandleHeight - 1` dp above the content's top edge; the
 *   whole region from there to the screen bottom (handle + content +
 *   bottom inset area) is excluded while items exist.
 * - Side drawers: the handle column is always excluded. When a drawer is
 *   open (translationX past its collapsed position), its full content
 *   rectangle is excluded as well.
 */
export const isMapPressOverDrawerUi = ({
	x,
	y,
	windowY,
	width,
	windowHeight,
	insetsBottom,
	drawerWidthResponsive,
	drawerHandleSize,
	bottomDrawerHandleHeight,
	bottomDrawerItemsExist,
	bottomDrawerHeight,
	leftTranslationX,
	rightTranslationX,
	leftItemCount,
	rightItemCount,
}: MapPressExclusionParams): boolean => {
	// Bottom drawer sits above the side drawers (zIndex 40 > 30): check first.
	// Window space: the drawer's content top edge anchors at the window bottom
	// minus the bottom inset and the current open height, and the handle pokes
	// `bottomDrawerHandleHeight - 1` dp above it.
	if (bottomDrawerItemsExist) {
		const bottomContentTop = windowHeight - insetsBottom - bottomDrawerHeight;
		const bottomHandleTop = bottomContentTop - (bottomDrawerHandleHeight - 1);
		if (windowY >= bottomHandleTop) {
			return true;
		}
	}

	// Left drawer: handle column at the drawer's right edge; content spans
	// [translationX, translationX + drawerWidth] when open.
	if (leftItemCount > 0) {
		const translationX = leftTranslationX ?? -drawerWidthResponsive;
		const contentRight = translationX + drawerWidthResponsive;
		const handleColumnHeight = getDrawerHandleColumnHeight(leftItemCount, drawerHandleSize);
		const inHandleColumn = y <= handleColumnHeight && x <= contentRight + drawerHandleSize;
		const open = translationX > -drawerWidthResponsive;
		const inContent = open && x <= contentRight;
		if (inHandleColumn || inContent) {
			return true;
		}
	}

	// Right drawer: mirror of the left-side logic.
	if (rightItemCount > 0) {
		const translationX = rightTranslationX ?? drawerWidthResponsive;
		const contentLeft = width - drawerWidthResponsive + translationX;
		const handleColumnHeight = getDrawerHandleColumnHeight(rightItemCount, drawerHandleSize);
		const inHandleColumn = y <= handleColumnHeight && x >= contentLeft - drawerHandleSize;
		const open = translationX < drawerWidthResponsive;
		const inContent = open && x >= contentLeft;
		if (inHandleColumn || inContent) {
			return true;
		}
	}

	return false;
};
