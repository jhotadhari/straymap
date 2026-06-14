/**
 * External dependencies
 */
import React, {
	Dispatch,
	FC,
	SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import DraggableGrid from 'react-native-draggable-grid';
import { Icon, Text, useTheme } from 'react-native-paper';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';
import formatcoords from 'formatcoords';
import { get, omit, pick } from 'lodash-es';
import { lineString } from '@turf/turf';
import { useMutation } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { RoutingPoint } from '../types';
import DrawerContext from '../../drawers/DrawerContext';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import LoadingIndicator from '../../../../components/generic/LoadingIndicator';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { processRouting, setSegment } from '../slice';
import { selectIsRouting, selectSegments } from '../selectors';
import { updateRoute } from '../db/actionsRoute';
import { lineStringToStats, locationsToCoordsArr } from '../../../../lib/utils';
import { deleteRoutingPoint } from '../db/actionsRoutingPoint';
import { LineStats as LineStatsType } from '../../lines/types';
import LineStats from '../../lines/components/LineStats';
import useRoute from '../hooks/useRoute';

const itemHeight = 180;

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

	const segment = Object.values(segments).find((seg) => seg.fromId === item.id);

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
		if (!segment) {
			return;
		}
		const newSegment = omit(
			{
				...segment,
				isFetching: false,
			},
			['positions']
		);
		dispatch(setSegment(newSegment));
		dispatch(processRouting());
	}, [segment]);

	const handleSetEdit = useCallback(() => {
		setEditPoint(item);
	}, [item]);

	const [lineStats, setLineStats] = useState<LineStatsType>({});
	useEffect(() => {
		if (segment && segment?.positions && segment?.positions.length > 1) {
			lineStringToStats(lineString(locationsToCoordsArr(segment.positions)).geometry).then(
				(newStats) => {
					setLineStats(newStats ?? {});
				}
			);
		}
		setLineStats({});
	}, [segment?.positions]);

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

					{!segment?.isFetching && (
						<LineStats
							stats={omit(lineStats, ['minZ', 'maxZ'])}
							round={0}
						/>
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

			{!segment?.isFetching && (
				<View style={styles.segmentRow}>
					<LineStats
						stats={pick(lineStats, ['minZ', 'maxZ'])}
						round={0}
					/>
					<View style={styles.segmentRowAction}>
						<ButtonHighlight compact={true}>
							<View style={{ width: 25, height: 25 }} />
						</ButtonHighlight>
					</View>
				</View>
			)}

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

	const dispatch = useAppDispatch();

	const [isDeleting, setIsDeleting] = useState(false);

	const mutation = useMutation({
		mutationFn: (id: number) => deleteRoutingPoint(id),
		onMutate: async (_, context) => {
			await context.client.cancelQueries({ queryKey: ['route', routeId] });
			setIsDeleting(true);
		},
		onSuccess: async (_result, _variables, _onMutateResult, context) => {
			await context.client.invalidateQueries({ queryKey: ['route', routeId] });
			dispatch(processRouting());
		},
		onSettled: () => {
			setIsDeleting(false);
		},
	});

	const handleDeletePoint = useCallback(() => {
		mutation.mutate(item.id);
	}, [item.id, mutation.mutate]);

	return (
		<View
			style={{
				width,
				paddingHorizontal: 8,
				height: itemHeight,
				justifyContent: 'flex-start',

				...(isDeleting && { backgroundColor: '#ff0000' }), // ??? we need dome other nice placeholder.
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
					<Text>{item.id}</Text>
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

	const dispatch = useAppDispatch();

	const { id: routeId, points: points_ } = useRoute(['id', 'points']) || {};

	const [optimisticPoints, setOptimisticPoints] = useState<undefined | RoutingPoint[]>(undefined);

	const mutation = useMutation({
		mutationFn: (newPoints: RoutingPoint[]) =>
			updateRoute(routeId, {
				point_order: newPoints.map((p) => p.id),
			}),
		onMutate: async (newPoints, context) => {
			await context.client.cancelQueries({ queryKey: ['route', routeId] });
			setOptimisticPoints(newPoints);
		},
		onSuccess: async (_result, _variables, _onMutateResult, context) => {
			await context.client.invalidateQueries({ queryKey: ['route', routeId] });
			dispatch(processRouting());
		},
		onSettled: () => {
			setScrollEnabled(true);
			setDraggingItemIndex(undefined);
			setOptimisticPoints(undefined);
		},
	});

	const points = useMemo(
		() =>
			(optimisticPoints ?? (points_ || [])).map((point) => ({
				...point,
				key: point.id,
			})),
		[
			points_,
			optimisticPoints,
		]
	);

	const [draggingItemIndex, setDraggingItemIndex] = useState<undefined | number>(undefined);

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
		(newPoints: RoutingPoint[]) => {
			mutation.mutate(newPoints);
		},
		[routeId, mutation.mutate]
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
		alignItems: 'center',
	},
	segmentRowContent: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 8,
	},
	segmentRowAction: {},
});

export default PointsList;
