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
import { findIndex, get, omit } from 'lodash-es';
import { lineString } from '@turf/turf';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { RoutingPoint } from '../types';
import DrawerContext from '../../drawers/DrawerContext';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import LoadingIndicator from '../../../components/generic/primitives/LoadingIndicator';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { deleteSegments, processRouting, setLastProfile } from '../slice';
import { selectIsRouting, selectSegments } from '../selectors';
import { selectUnitPrefs } from '../../general/selectors';
import { updateRoute } from '../db/actionsRoute';
import { formatCoords, formatDistance } from '../../../lib/formatting';
import { lineStringToStats, pointsCoordsAreOverlapping } from '../../../lib/utils';
import { deleteRoutingPoint } from '../db/actionsRoutingPoint';
import { LineStats as LineStatsType } from '../../lines/types';
import useRoute from '../hooks/useRoute';
import EditPointModal from './EditPointModal';
import Sortable, { DragStartParams, SortableFlexDragEndParams } from 'react-native-sortables';
import useDropIndicatorStyle from '../../../compose/useDropIndicatorStyle';
import { dbConnection } from '../../dbLoader/DBConnection';
import { DRAWER_ICON_SIZE } from '../../../constants';
import { ErrorToastContext } from '../../../components/ErrorToast/Context';
import LineStatsCompactRows from '../../lines/components/Stats/LineStatsCompactRows';

const Segment: FC<{
	item: RoutingPoint;
	draggingItemIndex?: number;
	setEditPoint: Dispatch<SetStateAction<undefined | RoutingPoint>>;
}> = ({ item, draggingItemIndex, setEditPoint }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const segments = useAppSelector(selectSegments);
	const unitPrefs = useAppSelector(selectUnitPrefs);
	const distUnit = unitPrefs.distance;

	const segment = Object.values(segments).find((seg) => seg.fromId === item.id);

	const StateIcon = useCallback(() => {
		let node: undefined | ReactNode = undefined;
		if (!segment) {
			return node;
		}
		switch (true) {
			case !!segment?.errorMsg:
				// error
				node = (
					<MaterialIcons
						name="error"
						size={DRAWER_ICON_SIZE}
						color={theme.colors.errorContainer}
					/>
				);
				break;
			case segment?.isFetching:
				// fetching
				node = <LoadingIndicator style={styles.loadingIndicatorIcon} />;
				break;
		}

		return node ? <View style={styles.stateIconWrapper}>{node}</View> : undefined;
	}, [segment, theme.colors.errorContainer]);

	const refreshSegment = useCallback(() => {
		if (!segment) {
			return;
		}
		dispatch(deleteSegments([segment]));
		dbConnection?.queryClient && dispatch(processRouting(dbConnection?.queryClient));
	}, [
		dispatch,
		segment,
	]);

	const handleSetEdit = useCallback(() => {
		setEditPoint(item);
	}, [item, setEditPoint]);

	const [lineStats, setLineStats] = useState<LineStatsType>({});
	useEffect(() => {
		if (segment && segment?.positions && segment?.positions.length > 1) {
			lineStringToStats(lineString(segment.positions).geometry).then((newStats) => {
				setLineStats(newStats ?? {});
			});
		}
		setLineStats({});
	}, [segment?.positions, segment]);

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
			{!!segment && (
				<View style={styleSegmentRow}>
					<View style={styles.segmentRowContent}>
						<StateIcon />

						{segment?.errorMsg && (
							<Text style={styles.errorText}>{t(segment.errorMsg)}</Text>
						)}

						{!segment?.isFetching && !segment?.errorMsg && (
							<View style={styles.stat}>
								<LineStatsCompactRows stats={lineStats} />
							</View>
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
								size={DRAWER_ICON_SIZE}
							/>
						</ButtonHighlight>
					</View>
				</View>
			)}

			<View style={styleSegmentRow}>
				<View style={styles.segmentRowContent}>
					{item?.profile?.provider === 'brouter' && (
						<>
							<Text>{item.profile.options.v}</Text>
							<Text>{item.profile.options.fast ? t('routing.fast') : 'slow'}</Text>
						</>
					)}
					{item?.profile?.provider === 'straightLine' && (
						<Text>
							{t('routing.providerStraightLine')}
							{', '}
							{t('routing.interval')}
							{': '}
							{formatDistance(item.profile.options.interval, distUnit, true)}
						</Text>
					)}
				</View>

				<View style={styles.segmentRowAction}>
					<ButtonHighlight
						compact={true}
						onPress={handleSetEdit}
						style={styles.compactButtonAction}
					>
						<Icon
							source="cog"
							size={DRAWER_ICON_SIZE}
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
}> = ({ item, width, order, draggingItemIndex, setEditPoint }) => {
	const { t } = useTranslation();

	const routeId = useAppSelector(selectIsRouting);

	const unitPrefs = useAppSelector(selectUnitPrefs);

	const dispatch = useAppDispatch();

	const [isDeleting, setIsDeleting] = useState(false);

	const mutationOptions: UseMutationOptions<void, Error, number, void> = useMemo(
		() => ({
			mutationFn: deleteRoutingPoint,
			onMutate: async () => {
				await dbConnection.queryClient!.cancelQueries({ queryKey: ['route', routeId] });
				setIsDeleting(true);
			},
			onSuccess: async () => {
				await dbConnection.queryClient!.invalidateQueries({ queryKey: ['route', routeId] });
				dbConnection?.queryClient && dispatch(processRouting(dbConnection.queryClient));
			},
			onSettled: () => {
				setIsDeleting(false);
			},
		}),
		[
			dispatch,
			routeId,
		]
	);
	const mutation = useMutation(mutationOptions);

	const handleDeletePoint = useCallback(() => {
		mutation.mutate(item.id);
	}, [item.id, mutation]);

	const styleDraggableItem = useMemo(
		() => [
			styles.draggableItem,
			{ width },
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
							formatCoords(
								item.geometry.coordinates[1],
								item.geometry.coordinates[0],
								unitPrefs.coordinates,
								t
							)}
					</Text>
				</Sortable.Handle>

				<ButtonHighlight
					compact={true}
					onPress={handleDeletePoint}
					style={styles.compactButtonAction}
				>
					<Icon
						source="delete-outline"
						size={DRAWER_ICON_SIZE}
					/>
				</ButtonHighlight>
			</View>

			<Segment
				item={item}
				draggingItemIndex={draggingItemIndex}
				setEditPoint={setEditPoint}
			/>
		</View>
	);
};

const itemPaddingH = 16;
const PointsList: FC = () => {
	const { width } = useContext(DrawerContext);
	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);

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
			onMutate: async (newPoints) => {
				await dbConnection.queryClient!.cancelQueries({ queryKey: ['route', routeId] });
				setOptimisticPoints(newPoints);
			},
			onSuccess: async () => {
				await dbConnection.queryClient!.invalidateQueries({ queryKey: ['route', routeId] });
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

			// Ensure the new point order has no overlapping points.
			if (
				!newPoints.some((fromPoint, index) => {
					const toPoint = get(newPoints, index + 1);
					if (
						toPoint &&
						pointsCoordsAreOverlapping(
							fromPoint.geometry.coordinates,
							toPoint.geometry.coordinates
						)
					) {
						return true;
					}
				})
			) {
				mutation.mutate(newPoints);
			} else {
				showError(t('routing.pointsAreOverlapping'));
			}
		},
		[
			points,
			mutation,
			showError,
			t,
		]
	);

	useEffect(() => {
		editPoint?.profile && dispatch(setLastProfile(editPoint.profile));
	}, [editPoint?.profile]);

	const lastProfile = useMemo(() => {
		const editPointIdx = editPoint ? points.findIndex((p) => editPoint.id === p.id) : -1;
		return editPointIdx > 0 ? points[editPointIdx - 1]?.profile : undefined;
	}, [
		points,
		editPoint,
	]);

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
					lastProfile={lastProfile}
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
		flexShrink: 1,
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
		flexShrink: 1,
	},
	compactButtonAction: {
		marginLeft: -8,
		marginVertical: -4,
	},
	placeholderIcon: {
		width: DRAWER_ICON_SIZE, // icon size as empty placeholder
		height: 1, // any number to prevent layout jumps on refresh process routing.
	},
	draggableItem: {
		paddingHorizontal: 8,
		justifyContent: 'flex-start',
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
	stat: {
		paddingTop: 8,
		flexGrow: 1,
		flexShrink: 1,
	},
});

export default PointsList;
