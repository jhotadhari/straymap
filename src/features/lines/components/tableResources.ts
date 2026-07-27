/**
 * External dependencies
 */
import { useCallback, useRef } from 'react';
import { GestureResponderEvent, StyleSheet } from 'react-native';

/**
 * Shared table styles used by both LinesTable and TagsTable.
 * Extracted to a single source of truth — each table's sharedDeps.ts
 * re-exports this so consumers continue to import from './sharedDeps'.
 */
export const tableStyles = StyleSheet.create({
	cell: {
		flexDirection: 'row',
		width: 100,
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
		flexWrap: 'nowrap',
	},
	flexRow: {
		flexDirection: 'row',
	},
	flexRowGap: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 8,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		minHeight: 8 * 8,
		paddingHorizontal: 8,
		paddingVertical: 8,
		columnGap: 8,
		borderBottomWidth: 1,
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 8,
		paddingVertical: 4,
		gap: 8,
		borderTopWidth: 1,
	},
	container: {
		flex: 1,
		justifyContent: 'space-between',
	},
	modalInner: {
		gap: 16,
		marginTop: 16,
	},
	loadingContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		position: 'absolute',
		zIndex: 9,
		width: '100%',
		height: '100%',
	},
});

/**
 * Returns responder props for a View that distinguish taps from scrolls.
 * The wrapped {@code onPress} fires only when the finger hasn't moved more
 * than 10 px in any direction between touch-down and touch-up. This prevents
 * spurious presses while the user is scrolling the enclosing
 * {@code BidirectionalScrollHost}.
 */
export const useScrollSafePress = (onPress: () => void) => {
	const touchStartRef = useRef<{ x: number; y: number } | null>(null);
	const hasMovedRef = useRef(false);

	const handleStartShouldSetResponder = useCallback(() => true, []);

	const handleResponderGrant = useCallback((e: GestureResponderEvent) => {
		touchStartRef.current = {
			x: e.nativeEvent.pageX,
			y: e.nativeEvent.pageY,
		};
		hasMovedRef.current = false;
	}, []);

	const handleResponderMove = useCallback((e: GestureResponderEvent) => {
		if (!touchStartRef.current) return;
		const dx = Math.abs(e.nativeEvent.pageX - touchStartRef.current.x);
		const dy = Math.abs(e.nativeEvent.pageY - touchStartRef.current.y);
		if (dx > 10 || dy > 10) {
			hasMovedRef.current = true;
		}
	}, []);

	const handleResponderRelease = useCallback(() => {
		if (!hasMovedRef.current) {
			onPress();
		}
		touchStartRef.current = null;
	}, [onPress]);

	const handleResponderTerminate = useCallback(() => {
		touchStartRef.current = null;
	}, []);

	return {
		onStartShouldSetResponder: handleStartShouldSetResponder,
		onResponderGrant: handleResponderGrant,
		onResponderMove: handleResponderMove,
		onResponderRelease: handleResponderRelease,
		onResponderTerminate: handleResponderTerminate,
	};
};
