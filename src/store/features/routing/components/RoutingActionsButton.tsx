/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Icon, useTheme } from 'react-native-paper';
import { Dimensions, ScrollView, View } from 'react-native';
import Popover, { PopoverPlacement } from 'react-native-popover-view';
import { pick } from 'lodash-es';

/**
 * Internal dependencies
 */
import { AppContext } from '../../../../Context';
import useRoute from '../hooks/useRoute';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import { MenuActionOption } from '../../../../types';
import PopoverMenuItems from '../../../../components/generic/PopoverMenuItems';

const RoutingActionsButton: FC<{
	disabled?: boolean;
	actions?: Record<string, MenuActionOption>;
}> = ({ disabled: disabled_, actions }) => {
	const { mapHeight, mapViewNativeNodeHandle } = useContext(AppContext);

	const { id: routeId, points } = useRoute(['id', 'points']) || {};

	// // const segments = useAppSelector(selectSegments);
	// const markerLayerUuid = useAppSelector(selectMarkerLayerUuid);
	// const pathLayerUuids = useAppSelector(selectPathLayerUuids);
	// const movingPointIdx = useAppSelector(selectMovingPointIdx);
	// // const triggeredMarkerIdx = useAppSelector(selectTriggeredMarkerIdx);
	// // const triggeredSegment = useAppSelector(selectTriggeredSegment);

	const { width } = Dimensions.get('window');
	const theme = useTheme();
	const [menuVisible, setMenuVisible] = useState(false);

	// // open menu on start routing, hopefully after drawer has closed.
	// const prevIsRouting = usePrevious(routeId);
	// useEffect(() => {
	// 	if (routeId && !prevIsRouting) {
	// 		runAfterInteractions(() => setMenuVisible(true), 300);
	// 	}
	// }, [routeId, prevIsRouting]);

	const dismissMenu = useCallback(
		(_cleanTriggeredMarkerIdx?: boolean, _cleanTriggeredSegment?: boolean) => {
			setMenuVisible(false);
			// if (undefined === cleanTriggeredMarkerIdx ? true : cleanTriggeredMarkerIdx) {
			// 	dispatch(setTriggeredMarkerIdx(undefined));
			// }
			// if (undefined === cleanTriggeredSegment ? true : cleanTriggeredSegment) {
			// 	dispatch(setTriggeredSegment(undefined));
			// }
		},
		[]
	);

	const options: MenuActionOption[] = useMemo(() => {
		const keys: string[] = [];

		// if (undefined === movingPointIdx) {
		keys.push('appendPoint');
		keys.push('deleteLastPoint');
		// }

		return Object.values(pick(actions, keys)).filter((a) => !!a);

		// return [
		// 	...(undefined === movingPointIdx
		// 	// ...(undefined === movingPointIdx
		// 	// 	? [
		// 	// 			{
		// 	// 				value: 'movePoint',
		// 	// 				label:
		// 	// 					'movePoint ' + (triggeredMarkerIdx ? triggeredMarkerIdx + 1 : ''),
		// 	// 				onPress: () => {
		// 	// 					dismissMenu(false);
		// 	// 					if (points && points.length > 0) {
		// 	// 						setMovingPointIdx &&
		// 	// 							undefined !== triggeredMarkerIdx &&
		// 	// 							setMovingPointIdx(triggeredMarkerIdx);
		// 	// 						setTriggeredMarkerIdx &&
		// 	// 							dispatch(setTriggeredMarkerIdx(undefined));
		// 	// 					}
		// 	// 				},
		// 	// 				disabled: () =>
		// 	// 					!points || !points.length || undefined === triggeredMarkerIdx,
		// 	// 				leadingIcon: 'arrow-all',
		// 	// 			},
		// 	// 		]
		// 	// 	: []),
		// 	// ...(undefined === movingPointIdx
		// 	// 	? [
		// 	// 			{
		// 	// 				value: 'cutSegment',
		// 	// 				label: 'cutSegment',
		// 	// 				onPress: () => {
		// 	// 					dismissMenu(true, false);
		// 	// 					if (
		// 	// 						setPoints &&
		// 	// 						points &&
		// 	// 						points.length > 0 &&
		// 	// 						segments &&
		// 	// 						undefined !== triggeredSegment?.index &&
		// 	// 						segments.length > triggeredSegment?.index
		// 	// 					) {
		// 	// 						const segment = segments[triggeredSegment?.index];
		// 	// 						const pointToIdIdx = points.findIndex(
		// 	// 							(point) => point.id === segment.toKey
		// 	// 						);
		// 	// 						if (-1 !== pointToIdIdx) {
		// 	// 							const newPoints = [...points];
		// 	// 							newPoints.splice(pointToIdIdx, 0, {
		// 	// 								id: rnUuid.v4(),
		// 	// 								geometry: triggeredSegment.nearestPoint,
		// 	// 							});
		// 	// 							dispatch(setPoints(newPoints));
		// 	// 							dispatch(setTriggeredSegment(undefined));
		// 	// 							setTimeout(
		// 	// 								() =>
		// 	// 									setMovingPointIdx &&
		// 	// 									setMovingPointIdx(pointToIdIdx),
		// 	// 								300
		// 	// 							);
		// 	// 						}
		// 	// 					}
		// 	// 				},
		// 	// 				disabled: () =>
		// 	// 					undefined !== triggeredMarkerIdx ||
		// 	// 					!points ||
		// 	// 					!points.length ||
		// 	// 					undefined === triggeredSegment,
		// 	// 				leadingIcon: 'content-cut',
		// 	// 			},
		// 	// 		]
		// 	// 	: []),
		// 	// ...(undefined === movingPointIdx
		// 	// 	? [
		// 	// 			{
		// 	// 				value: 'deletePoint',
		// 	// 				label:
		// 	// 					'deletePoint ' +
		// 	// 					(undefined !== triggeredMarkerIdx ? triggeredMarkerIdx + 1 : ''),
		// 	// 				onPress: () => {
		// 	// 					dismissMenu();
		// 	// 					if (
		// 	// 						setPoints &&
		// 	// 						points &&
		// 	// 						undefined !== triggeredMarkerIdx &&
		// 	// 						points.length >= triggeredMarkerIdx + 1
		// 	// 					) {
		// 	// 						const newPoints = [...points];
		// 	// 						newPoints.splice(triggeredMarkerIdx, 1);
		// 	// 						dispatch(setPoints(newPoints));
		// 	// 					}
		// 	// 				},
		// 	// 				disabled: () =>
		// 	// 					!points || !points.length || undefined === triggeredMarkerIdx,
		// 	// 				leadingIcon: 'minus',
		// 	// 			},
		// 	// 		]
		// 	// 	: []),
		// 	// ...(undefined !== movingPointIdx
		// 	// 	? [
		// 	// 			{
		// 	// 				value: 'setPointPosition',
		// 	// 				label: 'setPointPosition',
		// 	// 				onPress: () => {
		// 	// 					if (
		// 	// 						setPoints &&
		// 	// 						points &&
		// 	// 						undefined !== movingPointIdx &&
		// 	// 						currentMapEventRef?.current?.center
		// 	// 					) {
		// 	// 						const newPoints = [...points];
		// 	// 						const newPoint: RoutingPoint = {
		// 	// 							...points[movingPointIdx],
		// 	// 							id: rnUuid.v4(),
		// 	// 							geometry: currentMapEventRef?.current?.center,
		// 	// 						};
		// 	// 						newPoints.splice(movingPointIdx, 1, newPoint);
		// 	// 						dispatch(setPoints(newPoints));
		// 	// 						setMovingPointIdx(undefined);
		// 	// 					}
		// 	// 					dismissMenu();
		// 	// 				},
		// 	// 				disabled: () => !points || !points.length,
		// 	// 				leadingIcon: 'check',
		// 	// 			},
		// 	// 		]
		// 	// 	: []),
		// 	// ...(undefined !== movingPointIdx
		// 	// 	? [
		// 	// 			{
		// 	// 				value: 'cancelMoving',
		// 	// 				label: 'cancelMoving',
		// 	// 				onPress: () => {
		// 	// 					dismissMenu();
		// 	// 					setMovingPointIdx(undefined);
		// 	// 				},
		// 	// 				disabled: () => !points || !points.length,
		// 	// 				leadingIcon: 'cancel',
		// 	// 			},
		// 	// 		]
		// 	// 	: []),
		// ];
	}, [
		// routeId,
		// points,
		// movingPointIdx,
		// segments,
		// triggeredMarkerIdx,
		// dismissMenu,
		// triggeredSegment,
		actions,
	]);

	const handleButtonPress = useCallback(() => {
		if (menuVisible) {
			dismissMenu();
		} else {
			setMenuVisible(true);
			if (mapViewNativeNodeHandle) {
				// if (markerLayerUuid) {
				// 	MapLayerMarkerModule.triggerEvent(
				// 		mapViewNativeNodeHandle,
				// 		markerLayerUuid,
				// 		left,
				// 		top
				// 	).catch((err: any) => console.log('ERROR', err));
				// }
			}
		}
	}, [
		dismissMenu,
		menuVisible,
		mapViewNativeNodeHandle,
		// markerLayerUuid,
		// pathLayerUuids,
		width,
		mapHeight,
	]);

	const disabled = disabled_ || undefined === points || !points?.length;

	const anchorRef = useRef<View>(null);

	const popoverStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			borderWidth: 1,
			borderColor: theme.colors.outline,
			minWidth: 150,
		}),
		[theme]
	);

	if (!routeId) {
		return undefined;
	}

	return (
		<>
			<ButtonHighlight
				ref={anchorRef}
				onPress={handleButtonPress}
				disabled={disabled}
				mode="outlined"
			>
				<Icon
					source={'menu'}
					size={20}
				/>
			</ButtonHighlight>
			<Popover
				popoverStyle={popoverStyle}
				arrowSize={arrowSize}
				isVisible={menuVisible}
				placement={PopoverPlacement.BOTTOM}
				onRequestClose={dismissMenu}
				from={anchorRef}
				animationConfig={animationConfig}
			>
				<ScrollView>{menuVisible && <PopoverMenuItems options={options} />}</ScrollView>
			</Popover>
		</>
	);
};

const animationConfig = {
	duration: 0,
};
const arrowSize = { height: 0, width: 0 };

export default RoutingActionsButton;
