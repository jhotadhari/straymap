/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useMutation, UseMutationOptions, useQuery } from '@tanstack/react-query';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { point } from '@turf/turf';
import { get } from 'lodash-es';
import { Feature, GeoJsonProperties, Point } from 'geojson';

/**
 * Internal dependencies
 */
import { handleSize, iconSize as handleIconSize, itemStyles } from '../../drawers/constants';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import { createRoute, deleteRoute } from '../db/actionsRoute';
import { deleteLine } from '../../lines/db/actionsLine';
import DrawerContext from '../../drawers/DrawerContext';
import { useAppDispatch } from '../../../hooks';
import useRoute from '../hooks/useRoute';
import { processRouting, setIsRouting } from '../slice';
import { RoutingPoint, RoutingProfile } from '../types';
import { MapContext } from '../../../../Context';
import { createRoutingPoints } from '../db/actionsRoutingPoint';
import { queryLinesWithoutGeom } from '../../lines/db/queryFns';
import { LinePartial } from '../../lines/types';
import { setLineTemp } from '../../lines/slice';

const useToggleRouting = ({
	pointIds,
	routeId,
	routingLineId,
}: {
	pointIds?: number[];
	routeId?: number;
	routingLineId?: number | null;
}) => {
	const { expand } = useContext(DrawerContext);

	const dispatch = useAppDispatch();

	const [isToggling, setIsToggling] = useState(false);

	const createMutationOptions: UseMutationOptions<number | undefined> = useMemo(
		() => ({
			mutationFn: createRoute,
			onMutate: async () => {
				setIsToggling(true);
			},
			onSuccess: async (newRouteId) => {
				if (newRouteId) {
					dispatch(setIsRouting(newRouteId));
					expand(false);
				}
			},
			onSettled: () => {
				setIsToggling(false);
			},
		}),
		[]
	);
	const createRouteMutation = useMutation(createMutationOptions);

	const deleteMutationOptions: UseMutationOptions = useMemo(
		() => ({
			mutationFn: () =>
				Promise.all([
					deleteRoute(routeId),
					deleteLine(routingLineId || false),
				]),
			onMutate: async (_, context) => {
				await context.client.cancelQueries({ queryKey: ['route', routeId] });
				await context.client.cancelQueries({ queryKey: ['lines'] });
				await context.client.cancelQueries({ queryKey: ['lineGeom', routingLineId] });
				setIsToggling(true);
			},
			onSuccess: async (_, _variables, _onMutateResult, context) => {
				expand(false);
				dispatch(setIsRouting(false));
				await context.client.invalidateQueries({ queryKey: ['route', routeId] });
				await context.client.invalidateQueries({ queryKey: ['lines'] });
				await context.client.invalidateQueries({ queryKey: ['lineGeom', routingLineId] });
			},
			onSettled: () => {
				setIsToggling(false);
			},
		}),
		[routeId, routingLineId]
	);
	const deleteMutation = useMutation(deleteMutationOptions);

	const handleToggleRouting = useCallback(() => {
		if (routeId) {
			if (!pointIds || pointIds.length < 2) {
				deleteMutation.mutate();
			} else {
				expand(false);
				dispatch(setIsRouting(false));
			}
		} else {
			createRouteMutation.mutate();
		}
	}, [
		routeId,
		pointIds,
		createRouteMutation.mutate,
		deleteMutation.mutate,
	]);

	return {
		isToggling,
		handleToggleRouting,
	};
};

const useActions = ({ points, routeId }: { points?: RoutingPoint[]; routeId?: number }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const { currentMapEventRef } = useContext(MapContext);

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

	return {
		handleAppendPoint,
	};
};

const DrawerActions: FC = () => {
	const { t } = useTranslation();

	const theme = useTheme();

	const dispatch = useAppDispatch();

	const {
		id: routeId,
		line_id: routingLineId,
		points,
		point_order: pointIds,
	} = useRoute([
		'id',
		'line_id',
		'points',
		'point_order',
	]) || {};

	const { data: line } = useQuery({
		queryKey: ['lines', routingLineId ? [routingLineId] : []],
		queryFn: queryLinesWithoutGeom,
		select: (lines: LinePartial[]) => (lines.length ? lines[0] : null),
	});

	const { isToggling, handleToggleRouting } = useToggleRouting({
		pointIds,
		routeId,
		routingLineId,
	});

	const { handleAppendPoint } = useActions({
		routeId,
		points,
	});


	const handleEditPress = useCallback(() => {
		routingLineId && dispatch(setLineTemp({ id: routingLineId }));
	}, [routingLineId]);

	return (
		<View>

			<View
				style={[
					itemStyles.item,
					styles.item,
				]}
			>
				<View
					style={[
						itemStyles.buttonRow,
						styles.flexRow,
					]}
				>
					{routeId && (
						<ButtonHighlight
							onPress={handleAppendPoint}
							disabled={isToggling}
							mode="contained"
							buttonColor={get(theme.colors, 'successContainer')}
							textColor={get(theme.colors, 'onSuccessContainer')}
						>
							<Icon
								source={'plus'}
								size={20}
							/>
						</ButtonHighlight>
					)}
					{routeId && (
						<ButtonHighlight
							// onPress={handleToggleMenu}  // ???
							disabled={isToggling}
							mode="outlined"
						>
							<Icon
								source={'menu'}
								size={20}
							/>
						</ButtonHighlight>
					)}

					<ButtonHighlight
						mode="outlined"
						onPress={handleToggleRouting}
						disabled={isToggling}
					>
						{!routeId && (
							<Text>{t(routeId ? 'stop routing???' : 'start routing???')}</Text>
						)}
						{routeId && (
							<Icon
								source={'close'}
								size={20}
							/>
						)}
					</ButtonHighlight>
				</View>
			</View>

			{line && (
				<View
					style={[
						itemStyles.item,
						styles.item,
					]}
				>
					<View
						style={[
							itemStyles.buttonRow,
							styles.flexRow,
						]}
					>
						<Text>{line?.title}</Text>

						<ButtonHighlight
							mode="outlined"
							onPress={handleEditPress}
							disabled={isToggling}
						>
							<Icon
								size={20}
								source="cog"
							/>
						</ButtonHighlight>
					</View>
				</View>
			)}
		</View>
	);
};
const styles = StyleSheet.create({
	item: {
		top: -(handleSize - handleIconSize) / 6,
	},
	flexRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		height: handleSize,
	},
});

export default DrawerActions;
