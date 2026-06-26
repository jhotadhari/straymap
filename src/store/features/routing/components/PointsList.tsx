/**
 * External dependencies
 */
import React, {
	Dispatch,
	FC,
	ReactNode,
	SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';
import formatcoords from 'formatcoords';
import { get, omit, pick } from 'lodash-es';
import { lineString } from '@turf/turf';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import { RoutingPoint } from '../types';
import DrawerContext from '../../drawers/DrawerContext';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import LoadingIndicator from '../../../../components/generic/LoadingIndicator';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { deleteSegments, processRouting } from '../slice';
import { selectIsRouting, selectSegments } from '../selectors';
import { updateRoute } from '../db/actionsRoute';
import { lineStringToStats } from '../../../../lib/utils';
import { deleteRoutingPoint } from '../db/actionsRoutingPoint';
import { LineStats as LineStatsType } from '../../lines/types';
import LineStats from '../../lines/components/LineStats';
import useRoute from '../hooks/useRoute';
import EditPointModal from './EditPointModal';
import Sortable, { DragStartParams, SortableFlexDragEndParams } from 'react-native-sortables';
import useDropIndicatorStyle from '../../../../compose/useDropIndicatorStyle';
import { dbConnection } from '../../dbLoader/DBConnection';

const iconSize = 25;

const Segment: FC<{
	item: RoutingPoint;
	draggingItemIndex?: number;
	setEditPoint: Dispatch<SetStateAction<undefined | RoutingPoint>>;
}> = ({ item, draggingItemIndex, setEditPoint }) => {
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const segments = useAppSelector(selectSegments);

	const segment = Object.values(segments).find((seg) => seg.fromId === item.id);

	const StateIcon = useCallback(() => {
		let node: undefined | ReactNode = undefined;

		switch (true) {
			case !!(segment && segment?.errorMsg):
				// error
				node = (
					<MaterialIcons
						name="error"
						size={iconSize}
						color={theme.colors.errorContainer}
					/>
				);
				break;
			case !!(segment && segment?.isFetching):
				// fetching
				node = <LoadingIndicator style={styles.loadingIndicatorIcon} />;
				break;
			case !segment || !segment?.positions:
				// some placeholder until start fetching
				node = (
					<Icon
						source="dots-horizontal"
						size={iconSize}
					/>
				);
			// case ( !! ( segment && ! segment?.isFetching && segment?.positions ) ):
			//     // ok
			//     node = <Icon
			//         source="check"
			//         size={ 25 }
			//         color={ get( theme, ['colors','success'], undefined ) }
			//     />;
		}

		return node ? <View style={styles.stateIconWrapper}>{node}</View> : undefined;
	}, [segment]);

	const refreshSegment = useCallback(() => {
		if (!segment) {
			return;
		}
		dispatch(deleteSegments([segment]));
		dbConnection?.queryClient && dispatch(processRouting(dbConnection?.queryClient));
	}, [
		dispatch,
		segment,
		dbConnection?.queryClient,
	]);

	const handleSetEdit = useCallback(() => {
		setEditPoint(item);
	}, [item]);

	const [lineStats, setLineStats] = useState<LineStatsType>({});
	useEffect(() => {
		if (segment && segment?.positions && segment?.positions.length > 1) {
			lineStringToStats(lineString(segment.positions).geometry).then((newStats) => {
				setLineStats(newStats ?? {});
			});
		}
		setLineStats({});
	}, [segment?.positions]);

	// Hide if dragging
	const hidden = undefined !== draggingItemIndex;
	// const hidden = undefined !== draggingItemIndex &&
	// 	(draggingItemIndex === order || draggingItemIndex - 1 === order);

	const styleSegmentRow = useMemo(
		() => [
			styles.segmentRow,
			hidden && {
				opacity: 0,
			},
		],
		[hidden]
	);

	const styleWrapper = useMemo(
		() => [
			styles.segmentWrapper,
			{
				backgroundColor: theme.colors.surfaceDisabled,
				borderColor: theme.colors.onSurfaceDisabled,
			},
		],
		[theme]
	);

	return (
		<View style={styleWrapper}>
			<View style={styleSegmentRow}>
				<View style={styles.segmentRowContent}>
					<StateIcon />

					{segment?.errorMsg && (
						<Text style={styles.errorText}>{'Error' + ': ' + segment?.errorMsg}</Text>
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
						style={styles.compactButtonAction}
					>
						<Icon
							source="refresh"
							size={iconSize}
						/>
					</ButtonHighlight>
				</View>
			</View>

			{/* {!segment?.isFetching && ( */}
			<View style={styleSegmentRow}>
				<LineStats
					stats={pick(lineStats, ['minZ', 'maxZ'])}
					round={0}
				/>
				<View style={styles.segmentRowAction}>
					<ButtonHighlight compact={true}>
						<View style={styles.placeholderIcon} />
					</ButtonHighlight>
				</View>
			</View>
			{/* )} */}

			<View style={styleSegmentRow}>
				<View style={styles.segmentRowContent}>
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
						style={styles.compactButtonAction}
					>
						<Icon
							source="cog"
							size={iconSize}
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

	const mutationOptions: UseMutationOptions<void, Error, number, void> = useMemo(
		() => ({
			mutationFn: deleteRoutingPoint,
			onMutate: async (_, context) => {
				await context.client.cancelQueries({ queryKey: ['route', routeId] });
				setIsDeleting(true);
			},
			onSuccess: async (_result, _variables, _onMutateResult, context) => {
				await context.client.invalidateQueries({ queryKey: ['route', routeId] });
				dbConnection?.queryClient && dispatch(processRouting(dbConnection.queryClient));
			},
			onSettled: () => {
				setIsDeleting(false);
			},
		}),
		[
			dispatch,
			routeId,
			dbConnection?.queryClient,
		]
	);
	const mutation = useMutation(mutationOptions);

	const handleDeletePoint = useCallback(() => {
		mutation.mutate(item.id);
	}, [item.id, mutation.mutate]);

	const styleDraggableItem = useMemo(
		// ??? we need dome other nice placeholder than backgroundColor for isDeleting.
		() => [
			styles.draggableItem,
			{ width },
			isDeleting && styles.draggableItemDeleting,
		],
		[width, isDeleting]
	);

	return (
		<View
			style={styleDraggableItem}
			key={item.id}
		>
			<View style={styles.itemRow}>
				<Sortable.Handle
					mode="draggable"
					style={styles.handle}
				>
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
				</Sortable.Handle>

				<ButtonHighlight
					compact={true}
					onPress={handleDeletePoint}
					style={styles.compactButtonAction}
				>
					<Icon
						source="delete"
						size={iconSize}
					/>
				</ButtonHighlight>
			</View>

			{hasNext && (
				<Segment
					item={item}
					draggingItemIndex={draggingItemIndex}
					setEditPoint={setEditPoint}
				/>
			)}
		</View>
	);
};

const itemPaddingH = 16;
const PointsList: FC = () => {
	const { width } = useContext(DrawerContext);

	const [editPoint, setEditPoint] = useState<undefined | RoutingPoint>(undefined);

	const [scrollEnabled, setScrollEnabled] = useState(true);

	const dispatch = useAppDispatch();

	const { id: routeId, points: points_ } = useRoute(['id', 'points']) || {};

	const [optimisticPoints, setOptimisticPoints] = useState<undefined | RoutingPoint[]>(undefined);

	const mutationOptions: UseMutationOptions<void, Error, RoutingPoint[], void> = useMemo(
		() => ({
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
				dbConnection?.queryClient && dispatch(processRouting(dbConnection.queryClient));
			},
			onSettled: () => {
				setScrollEnabled(true);
				setDraggingItemIndex(undefined);
				setOptimisticPoints(undefined);
			},
		}),
		[
			dispatch,
			routeId,
			dbConnection?.queryClient,
		]
	);
	const mutation = useMutation(mutationOptions);

	const points = useMemo(
		() =>
			(optimisticPoints ?? (points_ || [])).map((point) => ({
				...point,
				key: point.id + '',
			})),
		[
			points_,
			optimisticPoints,
		]
	);

	const [draggingItemIndex, setDraggingItemIndex] = useState<undefined | number>(undefined);

	const handleDragStart = useCallback(
		(params: DragStartParams) => {
			setScrollEnabled(false);
			const newDraggingItemIndex = points.findIndex(
				(point) => point.id === parseInt(params.key.replace('.$', ''), 10)
			);
			setDraggingItemIndex(-1 === newDraggingItemIndex ? undefined : newDraggingItemIndex);
		},
		[points]
	);

	const handleDragEnd = useCallback(
		({ indexToKey }: SortableFlexDragEndParams) => {
			const newPoints: RoutingPoint[] = indexToKey
				.map((toKey) => {
					return points.find((point) => point.key === toKey.replace('.$', ''));
				})
				.filter((a) => !!a)
				.map((point) => omit(point, 'key'));
			mutation.mutate(newPoints);
		},
		[
			points,
			routeId,
			mutation.mutate,
		]
	);

	const dropIndicatorStyle = useDropIndicatorStyle();

	const styleScrollView = useMemo(() => [styles.scrollView, { width }], [width]);

	return (
		<ScrollView
			scrollEnabled={scrollEnabled}
			style={styleScrollView}
		>
			{editPoint && (
				<EditPointModal
					editPoint={editPoint}
					setEditPoint={setEditPoint}
				/>
			)}

			<Sortable.Flex
				itemEntering={null}
				gap={0}
				padding={0}
				sortEnabled={true}
				customHandle={true}
				showDropIndicator={true}
				dropIndicatorStyle={dropIndicatorStyle}
				flexDirection="column"
				reorderTriggerOrigin="touch"
				alignItems="center"
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				{points.map((item: RoutingPoint, order: number) => {
					return (
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
				})}
			</Sortable.Flex>
		</ScrollView>
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
	segmentWrapper: {
		alignItems: 'center',
		justifyContent: 'flex-start',
		borderLeftWidth: 1,
		marginLeft: 8,
		paddingLeft: 8,
	},
	loadingIndicatorIcon: {
		marginRight: 1,
		paddingTop: 1,
	},
	stateIconWrapper: {
		marginVertical: -4,
	},
	errorText: {
		marginRight: 10,
		flexGrow: 1,
	},
	compactButtonAction: {
		marginLeft: -8,
		marginVertical: -4,
	},
	placeholderIcon: {
		width: iconSize, // icon size as empty placeholder
		height: 1, // any number to prevent layout jumps on refresh process routing.
	},
	draggableItem: {
		paddingHorizontal: 8,
		justifyContent: 'flex-start',
	},
	draggableItemDeleting: {
		backgroundColor: '#ff0000',
	},
	itemRow: {
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
	},
	handle: {
		flexDirection: 'row',
		flexGrow: 1,
		gap: 8,
	},
	scrollView: {
		paddingHorizontal: itemPaddingH,
	},
});

export default PointsList;
