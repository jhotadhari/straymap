/**
 * External dependencies
 */
import React, {
	Dispatch,
	FC,
	SetStateAction,
	useCallback,
	useContext,
	useMemo,
	useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import DraggableGrid from 'react-native-draggable-grid';
import { Icon, Text, useTheme } from 'react-native-paper';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';
import formatcoords from 'formatcoords';
import { get, omit } from 'lodash-es';

/**
 * Internal dependencies
 */
import { RoutingPoint, RoutingSegment } from '../types';
import DrawerContext from '../../drawers/DrawerContext';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import LoadingIndicator from '../../../../components/generic/LoadingIndicator';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { setPoints, setSegments } from '../routingSlice';
import { selectIsRouting, selectPoints, selectSegments } from '../selectors';
import { updateRoute } from '../db/actionsRoute';
import { getUpDown } from '../../../../lib/utils';
import { selectUnitPrefs } from '../../general/selectors';
import { deleteRoutingPoint } from '../db/actionsRoutingPoint';
import { updateStorePointsFromDb } from '../utils';
import { formatDistance } from '../../../../lib/formatting';

const itemHeight = 130;

const SegmentInfo = ({ segment }: { segment: RoutingSegment }) => {
	const unitPrefs = useAppSelector(selectUnitPrefs);

	if (
		segment?.coordinatesSimplified &&
		segment.coordinatesSimplified.length > 0 &&
		undefined !==
			segment.coordinatesSimplified[segment.coordinatesSimplified.length - 1].distance
	) {
		const distanceString = formatDistance(
			segment.coordinatesSimplified[segment.coordinatesSimplified.length - 1].distance || 0,
			unitPrefs.distance
		);

		const { up, down } = getUpDown(segment?.coordinatesSimplified);

		return (
			<View
				style={{
					justifyContent: 'flex-start',
					alignItems: 'center',
					flexDirection: 'row',
					flexGrow: 1,
					// marginRight: 10,
				}}
			>
				<Text style={{ marginRight: 5 }}>{distanceString}</Text>
				<Icon
					source="arrow-up"
					size={15}
				/>
				<Text style={{ marginRight: 5 }}>
					{Math.round(up) + ' m'}
					{/* ??? should format with units */}
				</Text>
				<Icon
					source="arrow-down"
					size={15}
				/>
				<Text style={{ marginRight: 5 }}>
					{Math.round(down) + ' m'}
					{/* ??? should format with units */}
				</Text>
			</View>
		);
	} else {
		return null;
	}
};

const Segment: FC<{
	item: RoutingPoint;
	width: number;
	order: number;
	draggingItemIndex?: number;
	setEditPoint: Dispatch<SetStateAction<undefined | RoutingPoint>>;
}> = ({ item, width, order, draggingItemIndex, setEditPoint }) => {
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const segments = useAppSelector(selectSegments);

	const segmentIdx = segments ? segments.findIndex((segment) => segment.fromId === item.id) : -1;
	const segment = segments && -1 !== segmentIdx ? segments[segmentIdx] : undefined;

	const StateIcon = useCallback(() => {
		switch (true) {
			case !!(segment && segment?.errorMsg):
				// error
				return (
					<MaterialIcons
						name="error"
						size={25}
						color={theme.colors.errorContainer}
					/>
				);
			case !!(segment && segment?.isFetching):
				// fetching
				return <LoadingIndicator style={{ marginRight: 1, paddingTop: 1 }} />;
			case !segment || !segment?.positions:
				// some placeholder until start fetching
				return (
					<Icon
						source="dots-horizontal"
						size={25}
					/>
				);
			// case ( !! ( segment && ! segment?.isFetching && segment?.positions ) ):
			//     // ok
			//     return <Icon
			//         source="check"
			//         size={ 25 }
			//         color={ get( theme, ['colors','success'], undefined ) }
			//     />;
		}
		return undefined;
	}, [segment]);

	const refreshSegment = useCallback(() => {
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
		dispatch(setSegments(newSegments, { updateRoutes: true }));
	}, [segments, segmentIdx]);

	const handleSetEdit = useCallback(() => {
		setEditPoint(item);
	}, [item]);

	// Hide if dragging
	if (
		undefined !== draggingItemIndex &&
		(draggingItemIndex === order || draggingItemIndex - 1 === order)
	) {
		return undefined;
	}

	return (
		<View
			style={{
				alignItems: 'center',
				justifyContent: 'flex-start',
				backgroundColor: theme.colors.surfaceDisabled,
				borderLeftWidth: 1,
				borderColor: theme.colors.onSurfaceDisabled,
				marginLeft: 8,
				paddingLeft: 8,
			}}
		>
			<View style={styles.segmentRow}>
				<View style={styles.segmentRowContent}>
					<StateIcon />

					{segment?.errorMsg && (
						<Text style={{ marginRight: 10, flexGrow: 1 }}>
							{'Error' + ': ' + segment?.errorMsg}
						</Text>
					)}

					{/* { !segment?.isFetching && <SegmentInfo segment={segment} /> } */}

					{!segment?.isFetching && segment?.positions && (
						<Text>{'positions' + ': ' + segment?.positions.length}</Text>
					)}
				</View>

				<View style={styles.segmentRowAction}>
					<ButtonHighlight
						compact={true}
						onPress={refreshSegment}
					>
						<Icon
							source="refresh"
							size={25}
						/>
					</ButtonHighlight>
				</View>
			</View>

			<View style={styles.segmentRow}>
				<View
					style={[
						styles.segmentRowContent,
						{
							gap: 8,
						},
					]}
				>
					{Object.keys(item?.profile).map((profileKey) => {
						let inner: string | boolean = get(item.profile, profileKey, '');
						if ('fast' === profileKey) {
							inner = inner ? 'fast' : 'slow';
						}
						if ('string' !== typeof inner) {
							inner = profileKey;
						}
						return <Text key={profileKey}>{inner}</Text>;
					})}
				</View>

				<View style={styles.segmentRowAction}>
					<ButtonHighlight
						compact={true}
						onPress={handleSetEdit}
						style={{ marginLeft: -8 }}
					>
						<Icon
							source="cog"
							size={25}
						/>
					</ButtonHighlight>
				</View>
			</View>
		</View>
	);
};

const DraggableItem: FC<{
	item: RoutingPoint;
	width: number;
	order: number;
	draggingItemIndex?: number;
	setEditPoint: Dispatch<SetStateAction<undefined | RoutingPoint>>;
	hasNext: boolean;
}> = ({ item, width, order, draggingItemIndex, setEditPoint, hasNext }) => {
	const routeId = useAppSelector(selectIsRouting);

	const handleDeletePoint = useCallback(async () => {
		await deleteRoutingPoint(item.id);
		// ??? should be done by mutations somehow
		await updateStorePointsFromDb(routeId as number);
	}, [item.id, routeId]);

	return (
		<View
			style={{
				width,
				paddingHorizontal: 8,
				height: itemHeight,
				justifyContent: 'flex-start',
			}}
			key={item.id}
		>
			<View
				style={{
					justifyContent: 'space-between',
					alignItems: 'center',
					flexDirection: 'row',
				}}
			>
				<View style={{ flexDirection: 'row', flexGrow: 1, gap: 8 }}>
					<Text>{order + 1}</Text>

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

				<ButtonHighlight
					compact={true}
					onPress={handleDeletePoint}
				>
					<Icon
						source="delete"
						size={25}
					/>
				</ButtonHighlight>
			</View>

			{hasNext && (
				<Segment
					item={item}
					width={width}
					order={order}
					draggingItemIndex={draggingItemIndex}
					setEditPoint={setEditPoint}
				/>
			)}
		</View>
	);
};

const itemPaddingH = 16;
const PointsList: FC<{
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
	setEditPoint: Dispatch<SetStateAction<undefined | RoutingPoint>>;
}> = ({ setScrollEnabled, setEditPoint }) => {
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

	const [draggingItemIndex, setDraggingItemIndex] = useState<undefined | number>(undefined);

	const dispatch = useAppDispatch();

	const renderItem = (item: RoutingPoint, order: number) => (
		<View key={item.id}>
			<DraggableItem
				item={item}
				width={width - itemPaddingH * 2}
				order={order}
				draggingItemIndex={draggingItemIndex}
				setEditPoint={setEditPoint}
				hasNext={points.length > order + 1}
			/>
		</View>
	);

	const handleDragStart = useCallback(
		(item: RoutingPoint) => {
			setScrollEnabled(false);
			const newDraggingItemIndex = points.findIndex((point) => point.id === item.id);
			setDraggingItemIndex(-1 === newDraggingItemIndex ? undefined : newDraggingItemIndex);
		},
		[points]
	);

	const handleDragRelease = useCallback(
		async (newPoints: RoutingPoint[]) => {
			setScrollEnabled(true);
			if (routeId) {
				await updateRoute(routeId, {
					point_order: newPoints.map((p) => p.id),
				});
				dispatch(setPoints(newPoints));
			}
			setDraggingItemIndex(undefined);
		},
		[routeId]
	);

	return (
		<View
			style={{
				height: itemHeight * points.length + 8,
				width,
				paddingHorizontal: itemPaddingH,
			}}
		>
			<DraggableGrid
				itemHeight={itemHeight}
				numColumns={1}
				renderItem={renderItem}
				data={points}
				onDragStart={handleDragStart}
				onDragRelease={handleDragRelease}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	segmentRow: {
		justifyContent: 'space-between',
		width: '100%',
		flexDirection: 'row',
	},
	segmentRowContent: {
		alignItems: 'center',
		flexDirection: 'row',
	},
	segmentRowAction: {},
});

export default PointsList;
