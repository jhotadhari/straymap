/**
 * Tests for mapPressExclusions.ts — pure geometry, no native deps.
 */

/**
 * Internal dependencies
 */
import { isMapPressOverDrawerUi } from '../mapPressExclusions';

// Geometry matching the app: 457dp window, 990.5dp window height, 300dp
// responsive drawer width, 50dp side handles, 50dp bottom handle, 50.8dp
// bottom inset. Map-local y=0 corresponds to windowY=40.6 (status bar).
const WIDTH = 457;
const WINDOW_HEIGHT = 990.5;
const WINDOW_TOP = 40.6;
const INSETS_BOTTOM = 50.8;
const DRAWER_WIDTH = 300;
const HANDLE = 50;
const BOTTOM_HANDLE = 50;

const windowYFor = (mapLocalY: number) => WINDOW_TOP + mapLocalY;

const baseParams = {
	x: 0,
	y: 0,
	windowY: windowYFor(0),
	width: WIDTH,
	windowHeight: WINDOW_HEIGHT,
	insetsBottom: INSETS_BOTTOM,
	drawerWidthResponsive: DRAWER_WIDTH,
	drawerHandleSize: HANDLE,
	bottomDrawerHandleHeight: BOTTOM_HANDLE,
	bottomDrawerItemsExist: false,
	bottomDrawerHeight: 0,
	leftTranslationX: -DRAWER_WIDTH,
	rightTranslationX: DRAWER_WIDTH,
	leftItemCount: 0,
	rightItemCount: 0,
};

describe('isMapPressOverDrawerUi', () => {
	describe('plain map (no drawers)', () => {
		it('does not exclude a press anywhere on the map', () => {
			expect(
				isMapPressOverDrawerUi({
					...baseParams,
					x: 200,
					y: 400,
					windowY: windowYFor(400),
				})
			).toBe(false);
			expect(
				isMapPressOverDrawerUi({
					...baseParams,
					x: 0,
					y: WINDOW_HEIGHT - 1,
					windowY: windowYFor(WINDOW_HEIGHT - 1),
				})
			).toBe(false);
		});
	});

	describe('left drawer', () => {
		const leftOne = { ...baseParams, leftItemCount: 1 };
		const leftOpen = { ...leftOne, leftTranslationX: 0 };

		it('excludes the closed handle column', () => {
			expect(
				isMapPressOverDrawerUi({ ...leftOne, x: 25, y: 25, windowY: windowYFor(25) })
			).toBe(true);
			// Bottom edge of the column: 1 item = 50 + 25 = 75dp tall.
			expect(
				isMapPressOverDrawerUi({ ...leftOne, x: 25, y: 75, windowY: windowYFor(75) })
			).toBe(true);
		});

		it('does not exclude the map right of the closed handle column', () => {
			expect(
				isMapPressOverDrawerUi({ ...leftOne, x: 51, y: 25, windowY: windowYFor(25) })
			).toBe(false);
		});

		it('does not exclude the map below the closed handle column', () => {
			expect(
				isMapPressOverDrawerUi({ ...leftOne, x: 25, y: 76, windowY: windowYFor(76) })
			).toBe(false);
		});

		it('excludes the open drawer content at any depth', () => {
			expect(
				isMapPressOverDrawerUi({ ...leftOpen, x: 100, y: 500, windowY: windowYFor(500) })
			).toBe(true);
		});

		it('does not exclude the map right of the open drawer content', () => {
			expect(
				isMapPressOverDrawerUi({ ...leftOpen, x: 301, y: 500, windowY: windowYFor(500) })
			).toBe(false);
		});

		it('treats missing translationX as closed', () => {
			expect(
				isMapPressOverDrawerUi({
					...leftOne,
					leftTranslationX: null,
					x: 100,
					y: 500,
					windowY: windowYFor(500),
				})
			).toBe(false);
		});
	});

	describe('right drawer', () => {
		const rightOne = { ...baseParams, rightItemCount: 1 };
		const rightOpen = { ...rightOne, rightTranslationX: 0 };

		it('excludes the closed handle column', () => {
			expect(
				isMapPressOverDrawerUi({
					...rightOne,
					x: WIDTH - 25,
					y: 25,
					windowY: windowYFor(25),
				})
			).toBe(true);
		});

		it('does not exclude the map left of the closed handle column', () => {
			expect(
				isMapPressOverDrawerUi({
					...rightOne,
					x: WIDTH - 51,
					y: 25,
					windowY: windowYFor(25),
				})
			).toBe(false);
		});

		it('excludes the open drawer content at any depth', () => {
			expect(
				isMapPressOverDrawerUi({
					...rightOpen,
					x: WIDTH - 100,
					y: 500,
					windowY: windowYFor(500),
				})
			).toBe(true);
		});

		it('does not exclude the map left of the open drawer content', () => {
			expect(
				isMapPressOverDrawerUi({
					...rightOpen,
					x: WIDTH - 301,
					y: 500,
					windowY: windowYFor(500),
				})
			).toBe(false);
		});
	});

	describe('bottom drawer', () => {
		it('excludes the collapsed handle strip above the bottom edge', () => {
			const params = { ...baseParams, bottomDrawerItemsExist: true, bottomDrawerHeight: 0 };
			// Handle top = windowHeight - insetsBottom - 0 - (50 - 1).
			const handleTop = WINDOW_HEIGHT - INSETS_BOTTOM - (BOTTOM_HANDLE - 1);
			expect(
				isMapPressOverDrawerUi({
					...params,
					x: 200,
					y: handleTop + 10 - WINDOW_TOP,
					windowY: handleTop + 10,
				})
			).toBe(true);
		});

		it('does not exclude the map above the collapsed handle strip', () => {
			const params = { ...baseParams, bottomDrawerItemsExist: true, bottomDrawerHeight: 0 };
			const handleTop = WINDOW_HEIGHT - INSETS_BOTTOM - (BOTTOM_HANDLE - 1);
			expect(
				isMapPressOverDrawerUi({
					...params,
					x: 200,
					y: handleTop - 10 - WINDOW_TOP,
					windowY: handleTop - 10,
				})
			).toBe(false);
		});

		it('excludes the half-open drawer content', () => {
			const params = { ...baseParams, bottomDrawerItemsExist: true, bottomDrawerHeight: 150 };
			// Content top = windowHeight - insetsBottom - 150.
			const contentTop = WINDOW_HEIGHT - INSETS_BOTTOM - 150;
			expect(
				isMapPressOverDrawerUi({
					...params,
					x: 200,
					y: contentTop + 50 - WINDOW_TOP,
					windowY: contentTop + 50,
				})
			).toBe(true);
		});

		it('does not exclude the map above the half-open drawer handle', () => {
			const params = { ...baseParams, bottomDrawerItemsExist: true, bottomDrawerHeight: 150 };
			const contentTop = WINDOW_HEIGHT - INSETS_BOTTOM - 150;
			const handleTop = contentTop - (BOTTOM_HANDLE - 1);
			expect(
				isMapPressOverDrawerUi({
					...params,
					x: 200,
					y: handleTop - 10 - WINDOW_TOP,
					windowY: handleTop - 10,
				})
			).toBe(false);
		});

		it('ignores the bottom region when no bottom drawer items exist', () => {
			const params = { ...baseParams, bottomDrawerItemsExist: false, bottomDrawerHeight: 0 };
			expect(
				isMapPressOverDrawerUi({
					...params,
					x: 200,
					y: WINDOW_HEIGHT - 10 - WINDOW_TOP,
					windowY: WINDOW_HEIGHT - 10,
				})
			).toBe(false);
		});

		it('wins over an open side drawer in the overlapping strip', () => {
			const params = {
				...baseParams,
				leftItemCount: 1,
				leftTranslationX: 0,
				bottomDrawerItemsExist: true,
				bottomDrawerHeight: 150,
			};
			const contentTop = WINDOW_HEIGHT - INSETS_BOTTOM - 150;
			expect(
				isMapPressOverDrawerUi({
					...params,
					x: 400,
					y: contentTop + 10 - WINDOW_TOP,
					windowY: contentTop + 10,
				})
			).toBe(true);
		});

		it('is unaffected by the map wrapper offset (window-space anchoring)', () => {
			const params = { ...baseParams, bottomDrawerItemsExist: true, bottomDrawerHeight: 0 };
			const handleTop = WINDOW_HEIGHT - INSETS_BOTTOM - (BOTTOM_HANDLE - 1);
			// A shifted map wrapper (larger status/top bar) shifts the map-local
			// y, but the same windowY must still be excluded.
			expect(
				isMapPressOverDrawerUi({
					...params,
					x: 200,
					y: handleTop + 10 - (WINDOW_TOP + 30),
					windowY: handleTop + 10,
				})
			).toBe(true);
		});
	});
});
