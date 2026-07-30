/**
 * External dependencies
 */
import React, {
	Dispatch,
	FC,
	memo,
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
import { get, omit } from 'lodash-es';
import { lineString } from '@turf/turf';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import LucideIcons from '@react-native-vector-icons/lucide/static';

/**
 * Internal dependencies
 */
import { RoutingPoint, Route, RoutingProfile } from '../types';
import DrawerContext from '../../drawers/DrawerContext';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../compose/useButtonProps';
import LoadingIndicator from '../../../components/generic/primitives/LoadingIndicator';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { deleteSegments, processRouting } from '../slice';
import { selectIsRouting, selectLastProfiles, selectSegments } from '../selectors';
import { selectUnitPrefs } from '../../general/selectors';
import { updateRoute } from '../db/actionsRoute';
import { formatCoords } from '../../../lib/formatting';
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
import RoutingProfileInfo from './RoutingProfileInfo';
import { resolveProfileForPoint } from '../utils';

const Segment: FC<{
	item: RoutingPoint;
	resolvedProfile: RoutingProfile;
	draggingItemIndex?: number;
	setEditPoint: Dispatch<SetStateAction<undefined | RoutingPoint>>;
}> = ({ item, resolvedProfile, draggingItemIndex, setEditPoint }) => {
	const theme = useTheme();
	const { t } = useTranslation();

	const buttonPropsText = useButtonProps({ mode: 'text', style: styles.compactButtonAction });

	const dispatch = useAppDispatch();

	const segments = useAppSelector(selectSegments);
	const unitPrefs = useAppSelector(selectUnitPrefs);
	const distUnit = unitPrefs.distance;

	const segment = useMemo(
		() => Object.values(segments).find((seg) => seg.fromId === item.id),
		[segments, item.id]
	);

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
							{...buttonPropsText}
							compact={true}
							onPress={refreshSegment}
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
					<RoutingProfileInfo
						profile={resolvedProfile}
						inheritMode={item.inheritMode}
						distUnit={distUnit}
					/>
				</View>

				<View style={styles.segmentRowAction}>
					<ButtonHighlight
						{...buttonPropsText}
						compact={true}
						onPress={handleSetEdit}
					>
						<LucideIcons
							size={DRAWER_ICON_SIZE - 2}
							name="settings-2"
							color={theme.colors.onBackground}
						/>
					</ButtonHighlight>
				</View>
			</View>
		</View>
	);
};

const MemoSegment = memo(Segment);

const DraggableItem: FC<{
	item: RoutingPoint;
	resolvedProfile: RoutingProfile;
	width: number;
	order: number;
	draggingItemIndex?: number;
	setEditPoint: Dispatch<SetStateAction<undefined | RoutingPoint>>;
}> = ({ item, resolvedProfile, width, order, draggingItemIndex, setEditPoint }) => {
	const { t } = useTranslation();

	const routeId = useAppSelector(selectIsRouting);

	const unitPrefs = useAppSelector(selectUnitPrefs);

	const buttonPropsText = useButtonProps({ mode: 'text', style: styles.compactButtonAction });

	const dispatch = useAppDispatch();

	const [_isDeleting, setIsDeleting] = useState(false);

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
		[width]
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
					{...buttonPropsText}
					compact={true}
					onPress={handleDeletePoint}
				>
					<Icon
						source="delete-outline"
						size={DRAWER_ICON_SIZE}
					/>
				</ButtonHighlight>
			</View>

			<MemoSegment
				item={item}
				resolvedProfile={resolvedProfile}
				draggingItemIndex={draggingItemIndex}
				setEditPoint={setEditPoint}
			/>
		</View>
	);
};

const MemoDraggableItem = memo(DraggableItem);

const itemPaddingH = 16;
const PointsList: FC = () => {
	const { width } = useContext(DrawerContext);
	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);

	const [editPoint, setEditPoint] = useState<undefined | RoutingPoint>(undefined);

	const [scrollEnabled, setScrollEnabled] = useState(true);

	const dispatch = useAppDispatch();

	const route = useRoute([
		'id',
		'points',
		'profile',
	]) as Route | undefined;

	const lastProfiles = useAppSelector(selectLastProfiles);

	const [optimisticPoints, setOptimisticPoints] = useState<undefined | RoutingPoint[]>(undefined);

	const mutationOptions: UseMutationOptions<void, Error, RoutingPoint[], void> = useMemo(
		() => ({
			mutationFn: (newPoints: RoutingPoint[]) =>
				updateRoute(route?.id, {
					point_order: newPoints.map((p) => p.id),
				}),
			onMutate: async (newPoints) => {
				await dbConnection.queryClient!.cancelQueries({ queryKey: ['route', route?.id] });
				setOptimisticPoints(newPoints);
			},
			onSuccess: async () => {
				await dbConnection.queryClient!.invalidateQueries({
					queryKey: ['route', route?.id],
				});
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
			route?.id,
		]
	);
	const mutation = useMutation(mutationOptions);

	const points = useMemo(
		() =>
			(optimisticPoints ?? (route?.points || [])).map((point) => ({
				...point,
				key: point.id + '',
			})),
		[
			route?.points,
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

	const resolvedProfiles = useMemo(() => {
		if (!route?.points?.length) {
			return {} as Record<number, RoutingProfile>;
		}
		const { points: routePoints, profile: routeProfile } = route;
		const effectiveProfile = routeProfile ?? lastProfiles.profiles[lastProfiles.provider];
		return Object.fromEntries(
			routePoints.map((point, index) => [
				point.id,
				resolveProfileForPoint(point, index, routePoints, effectiveProfile),
			])
		);
	}, [route, lastProfiles]);

	const dropIndicatorStyle = useDropIndicatorStyle();

	const styleScrollView = useMemo(() => [styles.scrollView, { width }], [width]);

	return (
		<ScrollView
			scrollEnabled={scrollEnabled}
			style={styleScrollView}
		>
			{editPoint && route && (
				<EditPointModal
					route={route}
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
							<MemoDraggableItem
								item={item}
								resolvedProfile={resolvedProfiles[item.id]}
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
		paddingBottom: 8,
		gap: 8,
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

export default memo(PointsList);
