/**
 * External dependencies
 */
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Icon, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Dimensions, PixelRatio, ScrollView, TextStyle, TouchableHighlight } from 'react-native';
import { MapLayerMarkerModule, MapLayerPathSlopeGradientModule } from 'react-native-mapsforge-vtm';
import { usePrevious } from 'victory-native';
import Popover, { PopoverPlacement } from 'react-native-popover-view';
import { point } from '@turf/turf';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { Feature, GeoJsonProperties, Point } from 'geojson';

/**
 * Internal dependencies
 */
import { AppContext } from '../../../../../Context';
import { runAfterInteractions } from '../../../../../lib/utils';
import { MapContext } from '../../../../../Context';
import MenuItem from '../../../../../components/generic/MenuItem';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { processRouting, setTriggeredMarkerIdx, setTriggeredSegment } from '../../../routing/slice';
import {
	selectMarkerLayerUuid,
	selectMovingPointIdx,
	selectPathLayerUuids,
} from '../../../routing/selectors';
import { createRoutingPoints } from '../../../routing/db/actionsRoutingPoint';
import { RoutingProfile } from '../../../routing/types';
import useRoute from '../../../routing/hooks/useRoute';

const IconActions = ({ style }: { style: TextStyle }) => {
	const { mapHeight, mapViewNativeNodeHandle } = useContext(AppContext);

	const dispatch = useAppDispatch();

	const { id: routeId, points } = useRoute(['id', 'points']) || {};

	// const segments = useAppSelector(selectSegments);
	const markerLayerUuid = useAppSelector(selectMarkerLayerUuid);
	const pathLayerUuids = useAppSelector(selectPathLayerUuids);
	const movingPointIdx = useAppSelector(selectMovingPointIdx);
	// const triggeredMarkerIdx = useAppSelector(selectTriggeredMarkerIdx);
	// const triggeredSegment = useAppSelector(selectTriggeredSegment);

	const { currentMapEventRef } = useContext(MapContext);

	const { width } = Dimensions.get('window');
	const theme = useTheme();
	const { t } = useTranslation();
	const [menuVisible, setMenuVisible] = useState(false);

	// open menu on start routing, hopefully after drawer has closed.
	const prevIsRouting = usePrevious(routeId);
	useEffect(() => {
		if (routeId && !prevIsRouting) {
			runAfterInteractions(() => setMenuVisible(true), 300);
		}
	}, [routeId, prevIsRouting]);

	const dismissMenu = useCallback(
		(cleanTriggeredMarkerIdx?: boolean, cleanTriggeredSegment?: boolean) => {
			setMenuVisible(false);
			if (undefined === cleanTriggeredMarkerIdx ? true : cleanTriggeredMarkerIdx) {
				dispatch(setTriggeredMarkerIdx(undefined));
			}
			if (undefined === cleanTriggeredSegment ? true : cleanTriggeredSegment) {
				dispatch(setTriggeredSegment(undefined));
			}
		},
		[]
	);

	const mutationAppendPointOptions: UseMutationOptions<
		| {
				id: number;
		  }[]
		| undefined,
		Error,
		{
			feature: Feature<Point, GeoJsonProperties>;
			profile: RoutingProfile;
		},
		void
	> = useMemo(
		() => ({
			mutationFn: ({
				feature,
				profile,
			}: {
				feature: Feature<Point, GeoJsonProperties>;
				profile: RoutingProfile;
			}) =>
				createRoutingPoints(
					[
						{
							feature,
							profile,
						},
					],
					routeId
				),
			onMutate: async (_, context) => {
				await context.client.cancelQueries({ queryKey: ['route', routeId] });
			},
			onSuccess: async (_result, _variables, _onMutateResult, context) => {
				await context.client.invalidateQueries({ queryKey: ['route', routeId] });
				dispatch(processRouting());
			},
		}),
		[routeId]
	);
	const mutationAppendPoint = useMutation(mutationAppendPointOptions);

	const getNextProfile = useCallback(() => {
		const lastPoint = points && points.length ? points[points.length - 1] : undefined;
		return {
			fast: lastPoint?.profile?.fast ?? true, // ??? from defaults, or from previous or from cut segment
			v: lastPoint?.profile?.v ?? 'motorcar', // ??? from defaults, or from previous or from cut segment
		};
	}, [points]);

	const handleAppendPoint = useCallback(async () => {
		dismissMenu();
		if (currentMapEventRef?.current?.center) {
			const feature = point([
				currentMapEventRef?.current?.center.lng,
				currentMapEventRef?.current?.center.lat,
				0,
			]);
			mutationAppendPoint.mutate({
				feature,
				profile: getNextProfile(),
			});
		}
	}, [getNextProfile, mutationAppendPoint.mutate]);

	const options: {
		value: string;
		label: string;
		onPress: () => void | Promise<void>;
		leadingIcon: string;
		disabled?: () => boolean;
	}[] = useMemo(
		() => [
			...(undefined === movingPointIdx
				? [
						{
							value: 'appendPoint',
							label: 'appendPoint',
							onPress: handleAppendPoint,
							leadingIcon: 'plus',
						},
					]
				: []),
			// ...(undefined === movingPointIdx
			// 	? [
			// 			{
			// 				value: 'movePoint',
			// 				label:
			// 					'movePoint ' + (triggeredMarkerIdx ? triggeredMarkerIdx + 1 : ''),
			// 				onPress: () => {
			// 					dismissMenu(false);
			// 					if (points && points.length > 0) {
			// 						setMovingPointIdx &&
			// 							undefined !== triggeredMarkerIdx &&
			// 							setMovingPointIdx(triggeredMarkerIdx);
			// 						setTriggeredMarkerIdx &&
			// 							dispatch(setTriggeredMarkerIdx(undefined));
			// 					}
			// 				},
			// 				disabled: () =>
			// 					!points || !points.length || undefined === triggeredMarkerIdx,
			// 				leadingIcon: 'arrow-all',
			// 			},
			// 		]
			// 	: []),
			// ...(undefined === movingPointIdx
			// 	? [
			// 			{
			// 				value: 'cutSegment',
			// 				label: 'cutSegment',
			// 				onPress: () => {
			// 					dismissMenu(true, false);
			// 					if (
			// 						setPoints &&
			// 						points &&
			// 						points.length > 0 &&
			// 						segments &&
			// 						undefined !== triggeredSegment?.index &&
			// 						segments.length > triggeredSegment?.index
			// 					) {
			// 						const segment = segments[triggeredSegment?.index];
			// 						const pointToIdIdx = points.findIndex(
			// 							(point) => point.id === segment.toKey
			// 						);
			// 						if (-1 !== pointToIdIdx) {
			// 							const newPoints = [...points];
			// 							newPoints.splice(pointToIdIdx, 0, {
			// 								id: rnUuid.v4(),
			// 								geometry: triggeredSegment.nearestPoint,
			// 							});
			// 							dispatch(setPoints(newPoints));
			// 							dispatch(setTriggeredSegment(undefined));
			// 							setTimeout(
			// 								() =>
			// 									setMovingPointIdx &&
			// 									setMovingPointIdx(pointToIdIdx),
			// 								300
			// 							);
			// 						}
			// 					}
			// 				},
			// 				disabled: () =>
			// 					undefined !== triggeredMarkerIdx ||
			// 					!points ||
			// 					!points.length ||
			// 					undefined === triggeredSegment,
			// 				leadingIcon: 'content-cut',
			// 			},
			// 		]
			// 	: []),
			// ...(undefined === movingPointIdx
			// 	? [
			// 			{
			// 				value: 'deletePoint',
			// 				label:
			// 					'deletePoint ' +
			// 					(undefined !== triggeredMarkerIdx ? triggeredMarkerIdx + 1 : ''),
			// 				onPress: () => {
			// 					dismissMenu();
			// 					if (
			// 						setPoints &&
			// 						points &&
			// 						undefined !== triggeredMarkerIdx &&
			// 						points.length >= triggeredMarkerIdx + 1
			// 					) {
			// 						const newPoints = [...points];
			// 						newPoints.splice(triggeredMarkerIdx, 1);
			// 						dispatch(setPoints(newPoints));
			// 					}
			// 				},
			// 				disabled: () =>
			// 					!points || !points.length || undefined === triggeredMarkerIdx,
			// 				leadingIcon: 'minus',
			// 			},
			// 		]
			// 	: []),
			// ...(undefined === movingPointIdx
			// 	? [
			// 			{
			// 				value: 'deleteLastPoint',
			// 				label: 'deleteLastPoint',
			// 				onPress: () => {
			// 					dismissMenu();
			// 					if (setPoints && points && points.length > 0) {
			// 						const newPoints = [...points];
			// 						newPoints.splice(-1, 1);
			// 						dispatch(setPoints(newPoints));
			// 					}
			// 				},
			// 				disabled: () => !points || !points.length,
			// 				leadingIcon: 'minus',
			// 			},
			// 		]
			// 	: []),
			// ...(undefined !== movingPointIdx
			// 	? [
			// 			{
			// 				value: 'setPointPosition',
			// 				label: 'setPointPosition',
			// 				onPress: () => {
			// 					if (
			// 						setPoints &&
			// 						points &&
			// 						undefined !== movingPointIdx &&
			// 						currentMapEventRef?.current?.center
			// 					) {
			// 						const newPoints = [...points];
			// 						const newPoint: RoutingPoint = {
			// 							...points[movingPointIdx],
			// 							id: rnUuid.v4(),
			// 							geometry: currentMapEventRef?.current?.center,
			// 						};
			// 						newPoints.splice(movingPointIdx, 1, newPoint);
			// 						dispatch(setPoints(newPoints));
			// 						setMovingPointIdx(undefined);
			// 					}
			// 					dismissMenu();
			// 				},
			// 				disabled: () => !points || !points.length,
			// 				leadingIcon: 'check',
			// 			},
			// 		]
			// 	: []),
			// ...(undefined !== movingPointIdx
			// 	? [
			// 			{
			// 				value: 'cancelMoving',
			// 				label: 'cancelMoving',
			// 				onPress: () => {
			// 					dismissMenu();
			// 					setMovingPointIdx(undefined);
			// 				},
			// 				disabled: () => !points || !points.length,
			// 				leadingIcon: 'cancel',
			// 			},
			// 		]
			// 	: []),
		],
		[
			// routeId,
			// points,
			// movingPointIdx,
			// segments,
			// triggeredMarkerIdx,
			// dismissMenu,
			// triggeredSegment,
			handleAppendPoint,
		]
	);

	const handleButtonPress = useCallback(() => {
		if (menuVisible) {
			dismissMenu();
		} else {
			setMenuVisible(true);
			runAfterInteractions(() => {
				// setTimeout(() => {
				if (mapViewNativeNodeHandle) {
					const left = PixelRatio.getPixelSizeForLayoutSize(width) / 2;
					const top = PixelRatio.getPixelSizeForLayoutSize(mapHeight || 0) / 2;
					if (markerLayerUuid) {
						MapLayerMarkerModule.triggerEvent(
							mapViewNativeNodeHandle,
							markerLayerUuid,
							left,
							top
						).catch((err: any) => console.log('ERROR', err));
					}
					if (pathLayerUuids) {
						[...pathLayerUuids].map((routingPathLayerUuid) => {
							MapLayerPathSlopeGradientModule.triggerEvent(
								mapViewNativeNodeHandle,
								routingPathLayerUuid,
								left,
								top
							).catch((err: any) => console.log('ERROR', err));
						});
					}
				}
				// }, 100);
			}, 100);
		}
	}, [
		menuVisible,
		mapViewNativeNodeHandle,
		markerLayerUuid,
		pathLayerUuids,
		width,
		mapHeight,
	]);

	const anchor = useMemo(
		() => (
			<TouchableHighlight
				style={style}
				underlayColor={theme.colors.elevation.level3}
				onPress={handleButtonPress}
			>
				{/* <View> */}
				<Icon
					size={30}
					source="menu"
				/>
				{/* </View> */}
			</TouchableHighlight>
		),
		[theme, handleButtonPress]
	);

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
		<Popover
			popoverStyle={popoverStyle}
			arrowSize={arrowSize}
			isVisible={menuVisible}
			placement={PopoverPlacement.BOTTOM}
			onRequestClose={() => dismissMenu()}
			from={anchor}
			animationConfig={{
				duration: 0,
			}}
		>
			{options && (
				<ScrollView>
					{menuVisible &&
						options &&
						[...options].map((opt) => {
							const disabled = opt?.disabled ? opt?.disabled() : false;
							return (
								<MenuItem
									key={opt.value}
									leadingIcon={opt?.leadingIcon}
									onPress={opt.onPress}
									title={t(opt.label)}
									style={
										disabled
											? { backgroundColor: theme.colors.surfaceDisabled }
											: undefined
									}
									textStyle={
										disabled
											? { color: theme.colors.onSurfaceDisabled }
											: undefined
									}
									iconColor={
										disabled ? theme.colors.onSurfaceDisabled : undefined
									}
								/>
							);
						})}
				</ScrollView>
			)}
		</Popover>
	);
};

const arrowSize = { height: 0, width: 0 };

export default IconActions;
