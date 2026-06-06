/**
 * External dependencies
 */
import React, { Dispatch, SetStateAction, useContext, useMemo, useState } from 'react';
import { TouchableHighlight, View } from 'react-native';
import DraggableGrid from 'react-native-draggable-grid';
import { Icon, Text, useTheme } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import formatcoords from 'formatcoords';
import { get, omit } from 'lodash-es';

/**
 * Internal dependencies
 */
import { RoutingPoint } from '../types';
import DrawerContext from '../../drawers/DrawerContext';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import LoadingIndicator from '../../../../components/generic/LoadingIndicator';
import SegmentInfo from './SegmentInfo';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { setPoints, setSegments } from '../routingSlice';
import { selectIsRouting, selectPoints, selectSegments } from '../selectors';
import { updateRoute } from '../db/actionsRoute';

const itemHeight = 130;
const itemPaddingH = 20;

const DraggableItem = ({
	item,
	width,
	order,
	draggingItemIndex,
	setEditPoint,
}: {
	item: RoutingPoint;
	width: number;
	order: number;
	draggingItemIndex: null | number;
	setEditPoint: Dispatch<SetStateAction<undefined | RoutingPoint>>;
}) => {
	const theme = useTheme();
	const dispatch = useAppDispatch();

	const isRouting = useAppSelector(selectIsRouting);
	const points = useAppSelector(selectPoints);
	const segments = useAppSelector(selectSegments);

	const segmentIdx = segments ? segments.findIndex((segment) => segment.fromId === item.id) : -1;
	const segment = segments && -1 !== segmentIdx ? segments[segmentIdx] : undefined;

	let StateIcon: null | React.JSX.Element = null;
	switch (true) {
		case !!(segment && segment?.errorMsg):
			// error
			StateIcon = (
				<MaterialIcons
					name="error"
					size={25}
					color={theme.colors.errorContainer}
				/>
			);
			break;
		case !!(segment && segment?.isFetching):
			// fetching
			StateIcon = <LoadingIndicator style={{ marginRight: 1, paddingTop: 1 }} />;
			break;
		case !segment || !segment?.positions:
			// some placeholder until start fetching
			StateIcon = (
				<Icon
					source="dots-horizontal"
					size={25}
				/>
			);
			break;
		// case ( !! ( segment && ! segment?.isFetching && segment?.positions ) ):
		//     // ok
		//     StateIcon = <Icon
		//         source="check"
		//         size={ 25 }
		//         color={ get( theme, ['colors','success'], undefined ) }
		//     />;
		//     break;
	}

	return (
		<View
			style={{
				width,
				height: itemHeight,
				// justifyContent:'space-between',
				alignItems: 'center',
				justifyContent: 'flex-start',
				// flexDirection: 'row',
				marginLeft: -itemPaddingH * 2,
				paddingHorizontal: itemPaddingH,
			}}
			key={item.id}
		>
			<View
				style={{
					justifyContent: 'flex-start',
					alignItems: 'center',
					flexDirection: 'row',
					// width: width - itemPaddingH * 2,
					// marginLeft: itemPaddingH,
				}}
			>
				<View style={{ flexDirection: 'row', flexGrow: 1 }}>
					<Text style={{ marginRight: 10 }}>{order + 1}</Text>

					<Text>
						{item?.geometry?.coordinates &&
							formatcoords(
								item.geometry.coordinates[1],
								item.geometry.coordinates[0]
							).format('dd', {
								decimalPlaces: Math.min(4, 99),
							})}
					</Text>
				</View>

				{/* <View
					style={{
						flexDirection: 'row',
					}}
				>
					<TouchableHighlight
						underlayColor={theme.colors.elevation.level3}
						onPress={() => {
							if (
								setPoints &&
								points &&
								undefined !== order &&
								points.length >= order + 1
							) {
								const newPoints = [...points];
								newPoints.splice(order, 1);
								dispatch(setPoints(newPoints));
							}
						}}
						style={{ padding: 10, borderRadius: theme.roundness }}
					>
						<Icon
							source="delete"
							size={25}
						/>
					</TouchableHighlight>
				</View> */}
			</View>

			{segment &&
				(null === draggingItemIndex ||
					(draggingItemIndex !== order && draggingItemIndex - 1 !== order)) && (
					<View
						style={{
							alignItems: 'center',
							justifyContent: 'flex-start',
							backgroundColor: theme.colors.surfaceDisabled,
							width: width - itemPaddingH * 2 - 10,
							marginRight: -5,
							borderLeftWidth: 1,
							borderColor: theme.colors.onSurfaceDisabled,
						}}
					>
						<View
							style={{
								justifyContent: 'flex-start',
								alignItems: 'center',
								flexDirection: 'row',
								marginLeft: StateIcon ? 0 : 10,
							}}
						>
							{StateIcon && (
								<View style={{ marginRight: -4, padding: 10 }}>{StateIcon}</View>
							)}

							{segment?.errorMsg && (
								<Text style={{ marginRight: 10, flexGrow: 1 }}>
									{'Error' + ': ' + segment?.errorMsg}
								</Text>
							)}

							<SegmentInfo segment={segment} />

							{/* { ! segment?.isFetching && segment?.positions && <Text style={ { marginRight: 10, flexGrow: 1 } }>{ 'positions' + ': ' + segment?.positions.length }</Text> } */}

							<ButtonHighlight
								// mode='outlined'
								compact={true}
								onPress={() => {
									if (
										segments &&
										setSegments &&
										-1 !== segmentIdx &&
										segments.length > segmentIdx
									) {
										const newSegments = [...segments];
										newSegments.splice(
											segmentIdx,
											1,
											omit(
												{
													...newSegments[segmentIdx],
													isFetching: false,
												},
												['positions']
											)
										);
										dispatch(setSegments(newSegments));
										// triggerSegmentsUpdate && triggerSegmentsUpdate();
									}
								}}
							>
								<Icon
									source="refresh"
									size={25}
								/>
							</ButtonHighlight>
						</View>

						<View
							style={{
								justifyContent: 'flex-start',
								alignItems: 'center',
								flexDirection: 'row',
							}}
						>
							<ButtonHighlight
								// style={ { marginLeft: -17 } }
								compact={true}
								onPress={() => {
									setEditPoint(item);
								}}
							>
								<Icon
									source="cog"
									size={25}
								/>
							</ButtonHighlight>

							<View
								style={{
									justifyContent: 'flex-start',
									alignItems: 'center',
									flexDirection: 'row',
									flexGrow: 1,
								}}
							>
								{Object.keys(item?.profile).map((profileKey) => {
									let inner: string | boolean = get(item.profile, profileKey, '');
									if ('fast' === profileKey) {
										inner = inner ? 'fast' : 'slow';
									}
									if ('string' !== typeof inner) {
										inner = profileKey;
									}
									return (
										<Text
											key={profileKey}
											style={{ marginRight: 10 }}
										>
											{inner}
										</Text>
									);
								})}
							</View>
						</View>
					</View>
				)}
		</View>
	);
};

const PointsList = ({
	setScrollEnabled,
	setEditPoint,
}: {
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
	setEditPoint: Dispatch<SetStateAction<undefined | RoutingPoint>>;
}) => {
	const { width } = useContext(DrawerContext);

	const routeId = useAppSelector(selectIsRouting);
	const points_ = useAppSelector(selectPoints);

	const points = useMemo(
		() =>
			points_.map((point) => ({
				...point,
				key: point.id,
			})),
		[points_]
	);

	const [draggingItemIndex, setDraggingItemIndex] = useState<null | number>(null);

	const dispatch = useAppDispatch();

	const renderItem = (item: RoutingPoint, order: number) => (
		<View key={item.id}>
			<DraggableItem
				item={item}
				width={width}
				order={order}
				draggingItemIndex={draggingItemIndex}
				setEditPoint={setEditPoint}
			/>
		</View>
	);

	return points ? (
		<View
			style={{
				height: itemHeight * points.length + 8,
				width,
				marginHorizontal: 20,
			}}
		>
			<DraggableGrid
				style={{ width }}
				itemHeight={itemHeight}
				numColumns={1}
				renderItem={renderItem}
				data={points}
				onDragStart={(item: RoutingPoint) => {
					setScrollEnabled(false);
					const newDraggingItemIndex = points.findIndex((point) => point.id === item.id);
					setDraggingItemIndex(-1 === newDraggingItemIndex ? null : newDraggingItemIndex);
				}}
				onDragRelease={async (newPoints: RoutingPoint[]) => {
					setScrollEnabled(true);

					if (routeId) {
						await updateRoute(routeId, {
							point_order: newPoints.map((p) => p.id),
						});
						dispatch(setPoints(newPoints));
					}

					setDraggingItemIndex(null);
				}}
			/>
		</View>
	) : null;
};

export default PointsList;
