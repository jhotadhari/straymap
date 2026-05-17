/**
 * External dependencies
 */
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Button, Icon, Menu, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { PixelRatio, TextStyle } from 'react-native';
import rnUuid from 'react-native-uuid';
import { MapLayerMarkerModule, MapLayerPathSlopeGradientModule } from 'react-native-mapsforge-vtm';
import { useSafeAreaFrame } from 'react-native-safe-area-context';
import { usePrevious } from 'victory-native';

/**
 * Internal dependencies
 */
import { AppContext } from '../../../../../Context';
import { runAfterInteractions } from '../../../../../lib/utils';
import { MapContext } from '../../../../../Context';
import MenuItem from '../../../../../components/generic/MenuItem';
import DrawerContext from '../../DrawerContext';
import { RoutingContext } from '../../../routing/RoutingContext';
import { RoutingPoint } from '../../../routing/types';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { setMovingPointIdx, setPoints, setTriggeredMarkerIdx, setTriggeredSegment } from '../../../routing/routingSlice';
import { selectIsRouting, selectMarkerLayerUuid, selectMovingPointIdx, selectPathLayerUuids, selectPoints, selectSegments, selectTriggeredMarkerIdx, selectTriggeredSegment } from '../../../routing/selectors';

const IconActions = ({ style }: { style: TextStyle }) => {
	const { mapHeight, mapViewNativeNodeHandle } = useContext(AppContext);

	const dispatch = useAppDispatch();

	const isRouting = useAppSelector( selectIsRouting );
	const points = useAppSelector( selectPoints );
	const segments = useAppSelector( selectSegments );
	const markerLayerUuid = useAppSelector( selectMarkerLayerUuid );
	const pathLayerUuids = useAppSelector( selectPathLayerUuids );
	const movingPointIdx = useAppSelector( selectMovingPointIdx );
	const triggeredMarkerIdx = useAppSelector( selectTriggeredMarkerIdx );
	const triggeredSegment = useAppSelector( selectTriggeredSegment );

	const { currentMapEventRef } = useContext(MapContext);

	const { side } = useContext(DrawerContext);

	const { width } = useSafeAreaFrame();
	const theme = useTheme();
	const { t } = useTranslation();
	const [menuVisible, setMenuVisible] = useState(false);

	// open menu on start routing, hopefully after drawer has closed.
	const prevIsRouting = usePrevious(isRouting);
	useEffect(() => {
		if (isRouting && !prevIsRouting) {
			runAfterInteractions(() => setMenuVisible(true), 750);
		}
	}, [isRouting, prevIsRouting]);

	const dismissMenu = (cleanTriggeredMarkerIdx?: boolean, cleanTriggeredSegment?: boolean) => {
		cleanTriggeredMarkerIdx =
			undefined === cleanTriggeredMarkerIdx ? true : cleanTriggeredMarkerIdx;
		cleanTriggeredSegment = undefined === cleanTriggeredSegment ? true : cleanTriggeredSegment;
		setMenuVisible(false);
		setTriggeredMarkerIdx && cleanTriggeredMarkerIdx && dispatch( setTriggeredMarkerIdx(undefined));
		setTriggeredSegment && cleanTriggeredSegment && dispatch(setTriggeredSegment(undefined));
	};

	const options = useMemo(
		() => [
			...(undefined === movingPointIdx
				? [
						{
							value: 'appendPoint',
							label: 'appendPoint',
							onPress: () => {
								dismissMenu();
								if (setPoints && points && currentMapEventRef?.current?.center) {
									dispatch(setPoints([
										...points,
										{
											key: rnUuid.v4(),
											location: currentMapEventRef?.current?.center,
										},
									]));
								}
							},
							leadingIcon: 'plus',
						},
					]
				: []),
			...(undefined === movingPointIdx
				? [
						{
							value: 'movePoint',
							label:
								'movePoint ' + (triggeredMarkerIdx ? triggeredMarkerIdx + 1 : ''),
							onPress: () => {
								dismissMenu(false);
								if ( points && points.length > 0) {
									setMovingPointIdx &&
										undefined !== triggeredMarkerIdx &&
										setMovingPointIdx(triggeredMarkerIdx);
									setTriggeredMarkerIdx && dispatch( setTriggeredMarkerIdx(undefined));
								}
							},
							disabled: () =>
								!points || !points.length || undefined === triggeredMarkerIdx,
							leadingIcon: 'arrow-all',
						},
					]
				: []),
			...(undefined === movingPointIdx
				? [
						{
							value: 'cutSegment',
							label: 'cutSegment',
							onPress: () => {
								dismissMenu(true, false);
								if (
									setPoints &&
									points &&
									points.length > 0 &&
									segments &&
									undefined !== triggeredSegment?.index &&
									segments.length > triggeredSegment?.index
								) {
									const segment = segments[triggeredSegment?.index];
									const pointToIdIdx = points.findIndex(
										(point) => point.key === segment.toKey
									);
									if (-1 !== pointToIdIdx) {
										const newPoints = [...points];
										newPoints.splice(pointToIdIdx, 0, {
											key: rnUuid.v4(),
											location: triggeredSegment.nearestPoint,
										});
										dispatch(setPoints(newPoints));
										setTriggeredSegment && dispatch(setTriggeredSegment(undefined));
										setTimeout(
											() =>
												setMovingPointIdx &&
												setMovingPointIdx(pointToIdIdx),
											300
										);
									}
								}
							},
							disabled: () =>
								undefined !== triggeredMarkerIdx ||
								!points ||
								!points.length ||
								undefined === triggeredSegment,
							leadingIcon: 'content-cut',
						},
					]
				: []),
			...(undefined === movingPointIdx
				? [
						{
							value: 'deletePoint',
							label:
								'deletePoint ' +
								(undefined !== triggeredMarkerIdx ? triggeredMarkerIdx + 1 : ''),
							onPress: () => {
								dismissMenu();
								if (
									setPoints &&
									points &&
									undefined !== triggeredMarkerIdx &&
									points.length >= triggeredMarkerIdx + 1
								) {
									const newPoints = [...points];
									newPoints.splice(triggeredMarkerIdx, 1);
									dispatch(setPoints(newPoints));
								}
							},
							disabled: () =>
								!points || !points.length || undefined === triggeredMarkerIdx,
							leadingIcon: 'minus',
						},
					]
				: []),
			...(undefined === movingPointIdx
				? [
						{
							value: 'deleteLastPoint',
							label: 'deleteLastPoint',
							onPress: () => {
								dismissMenu();
								if (setPoints && points && points.length > 0) {
									const newPoints = [...points];
									newPoints.splice(-1, 1);
									dispatch(setPoints(newPoints));
								}
							},
							disabled: () => !points || !points.length,
							leadingIcon: 'minus',
						},
					]
				: []),
			...(undefined !== movingPointIdx
				? [
						{
							value: 'setPointPosition',
							label: 'setPointPosition',
							onPress: () => {
								if (
									setPoints &&
									points &&
									undefined !== movingPointIdx &&
									currentMapEventRef?.current?.center
								) {
									const newPoints = [...points];
									const newPoint: RoutingPoint = {
										...points[movingPointIdx],
										key: rnUuid.v4(),
										location: currentMapEventRef?.current?.center,
									};
									newPoints.splice(movingPointIdx, 1, newPoint);
									dispatch(setPoints(newPoints));
									setMovingPointIdx && setMovingPointIdx(undefined);
								}
								dismissMenu();
							},
							disabled: () => !points || !points.length,
							leadingIcon: 'check',
						},
					]
				: []),
			...(undefined !== movingPointIdx
				? [
						{
							value: 'cancelMoving',
							label: 'cancelMoving',
							onPress: () => {
								dismissMenu();
								setMovingPointIdx && setMovingPointIdx(undefined);
							},
							disabled: () => !points || !points.length,
							leadingIcon: 'cancel',
						},
					]
				: []),
		],
		[
			points,
			movingPointIdx,
			segments,
		]
	);

	return isRouting ? (
		<Menu
			contentStyle={{
				borderColor: theme.colors.outline,
				borderWidth: 1,
				marginTop: -5,
				...('left' === side && {
					marginLeft: 0,
				}),
				...('right' === side && {
					marginLeft: -100,
				}),
			}}
			visible={menuVisible}
			onDismiss={dismissMenu}
			anchor={
				<Button
					onPress={() => {
						if (menuVisible) {
							dismissMenu();
						} else {
							setMenuVisible(true);
							runAfterInteractions(() => {
								setTimeout(() => {
									if (mapViewNativeNodeHandle) {
										const left =
											PixelRatio.getPixelSizeForLayoutSize(width) / 2;
										const top =
											PixelRatio.getPixelSizeForLayoutSize(mapHeight || 0) /
											2;
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
								}, 100);
							}, 100);
						}
					}}
					style={style}
				>
					<Icon
						source={'menu'}
						size={25}
						color={style?.color as string | undefined}
					/>
				</Button>
			}
		>
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
								disabled ? { color: theme.colors.onSurfaceDisabled } : undefined
							}
							iconColor={disabled ? theme.colors.onSurfaceDisabled : undefined}
						/>
					);
				})}
		</Menu>
	) : null;
};

export default IconActions;
