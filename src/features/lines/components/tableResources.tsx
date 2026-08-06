/**
 * External dependencies
 */
import { FC, useCallback, useMemo, useRef } from 'react';
import { GestureResponderEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { TableColumn } from '../types';

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

const LONG_PRESS_DEFAULT_DELAY = 500;

/**
 * Returns responder props for a View that distinguish taps from scrolls
 * and detect long presses via a JS-level timer. The wrapped {@code onPress}
 * fires only when the finger hasn't moved more than 10 px in any direction
 * between touch-down and touch-up and no long press has fired. This prevents
 * spurious presses while the user is scrolling the enclosing
 * {@code BidirectionalScrollHost}.
 *
 * {@code View.onLongPress} is unreliable on Android when the JS responder
 * system is active, so long-press detection is implemented here as a timer
 * rather than relying on the native {@code OnLongClickListener}.
 */
export const useScrollSafePress = (
	onPress: () => void,
	opts?: { onLongPress?: () => void; longPressDelay?: number }
) => {
	const onLongPress = opts?.onLongPress;
	const longPressDelay = opts?.longPressDelay ?? LONG_PRESS_DEFAULT_DELAY;

	const touchStartRef = useRef<{ x: number; y: number } | null>(null);
	const hasMovedRef = useRef(false);
	const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const longPressFiredRef = useRef(false);

	const handleStartShouldSetResponder = useCallback(() => true, []);

	const handleResponderGrant = useCallback(
		(e: GestureResponderEvent) => {
			touchStartRef.current = {
				x: e.nativeEvent.pageX,
				y: e.nativeEvent.pageY,
			};
			hasMovedRef.current = false;
			longPressFiredRef.current = false;

			if (onLongPress) {
				longPressTimerRef.current = setTimeout(() => {
					longPressTimerRef.current = null;
					longPressFiredRef.current = true;
					onLongPress();
				}, longPressDelay);
			}
		},
		[onLongPress, longPressDelay]
	);

	const clearLongPressTimer = useCallback(() => {
		if (longPressTimerRef.current !== null) {
			clearTimeout(longPressTimerRef.current);
			longPressTimerRef.current = null;
		}
	}, []);

	const handleResponderMove = useCallback(
		(e: GestureResponderEvent) => {
			if (!touchStartRef.current) return;
			const dx = Math.abs(e.nativeEvent.pageX - touchStartRef.current.x);
			const dy = Math.abs(e.nativeEvent.pageY - touchStartRef.current.y);
			if (dx > 10 || dy > 10) {
				hasMovedRef.current = true;
				clearLongPressTimer();
			}
		},
		[clearLongPressTimer]
	);

	const handleResponderRelease = useCallback(() => {
		clearLongPressTimer();
		if (!hasMovedRef.current && !longPressFiredRef.current) {
			onPress();
		}
		touchStartRef.current = null;
	}, [clearLongPressTimer, onPress]);

	const handleResponderTerminate = useCallback(() => {
		clearLongPressTimer();
		touchStartRef.current = null;
	}, [clearLongPressTimer]);

	return useMemo(
		() => ({
			onStartShouldSetResponder: handleStartShouldSetResponder,
			onResponderGrant: handleResponderGrant,
			onResponderMove: handleResponderMove,
			onResponderRelease: handleResponderRelease,
			onResponderTerminate: handleResponderTerminate,
		}),
		[
			handleStartShouldSetResponder,
			handleResponderGrant,
			handleResponderMove,
			handleResponderRelease,
			handleResponderTerminate,
		]
	);
};

export const SORT_ICON_SIZE = 16;

/**
 * A single sortable table header cell that uses the JS gesture-responder
 * system ({@link useScrollSafePress}) instead of TouchableOpacity.onPress.
 *
 * TouchableOpacity depends on the native touch pipeline flowing through
 * ReactHorizontalScrollView correctly. Inside the BidirectionalScrollHost
 * (which overrides onInterceptTouchEvent), that pipeline can break. The JS
 * responder system works at a higher level — once JS becomes the responder,
 * it calls requestDisallowInterceptTouchEvent(true) on the parent,
 * preventing the scroll host from stealing the gesture for a stationary tap.
 */
export const SortableHeaderCell: FC<{
	columnKey: string;
	sortable: boolean;
	sortIcon: string | undefined;
	cellStyle: StyleProp<ViewStyle>;
	onSortPress: (columnKey: string) => void;
	onLongPress: (columnKey: string) => void;
	onRef: (view: View | null) => void;
	t: (key: string) => string;
}> = ({ columnKey, sortable, sortIcon, cellStyle, onSortPress, onLongPress, onRef, t }) => {
	const handlePress = useCallback(() => {
		if (sortable) onSortPress(columnKey);
	}, [sortable, onSortPress, columnKey]);

	const handleLongPress = useCallback(() => onLongPress(columnKey), [onLongPress, columnKey]);

	const scrollSafeResponderProps = useScrollSafePress(handlePress, {
		onLongPress: handleLongPress,
	});

	return (
		<View
			ref={onRef}
			style={cellStyle}
			{...scrollSafeResponderProps}
		>
			<Text>{t(`lines.columns.${columnKey}`)}</Text>
			{sortIcon && (
				<Icon
					source={sortIcon}
					size={SORT_ICON_SIZE}
				/>
			)}
		</View>
	);
};

type CellConfigMap = Record<string, { style?: ViewStyle } | undefined>;

/**
 * Returns the minimum width (in px) needed to display all visible table
 * columns without clipping, including the 100 px action-button column.
 */
export const useContainerMinWidth = (
	tableColumns: TableColumn[],
	cellConfigs: CellConfigMap
): number => {
	return useMemo(() => {
		const actionCol = 100;
		const visible = tableColumns.filter((c) => c.visible);
		const colsWidth = visible.reduce(
			(sum, c) => sum + ((cellConfigs[c.key]?.style?.width as number) ?? 100),
			0
		);
		return actionCol + colsWidth;
	}, [tableColumns, cellConfigs]);
};
