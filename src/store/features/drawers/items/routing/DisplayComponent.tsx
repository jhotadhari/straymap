/**
 * External dependencies
 */
import React, {
	Dispatch,
	FC,
	Fragment,
	SetStateAction,
	useCallback,
	useContext,
	useState,
} from 'react';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { useAppDispatch } from '../../../../hooks';
import DrawerContext from '../../DrawerContext';
import { RoutingPoint } from '../../../routing/types';
import { itemStyles } from '../../constants';
import PointsList from '../../../routing/components/PointsList';
import EditPointModal from '../../../routing/components/EditPointModal';
import { setIsRouting } from '../../../routing/slice';
import { createRoute, deleteRoute } from '../../../routing/db/actionsRoute';
import { useMutation } from '@tanstack/react-query';
import { deleteLine } from '../../../lines/db/actionsLine';
import useRoute from '../../../routing/hooks/useRoute';

const DisplayComponent: FC<{
	scrollEnabled: boolean;
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
}> = ({ setScrollEnabled }) => {
	const { expand } = useContext(DrawerContext);

	const dispatch = useAppDispatch();

	const {
		id: routeId,
		line_id: routingLineId,
		point_order: pointIds,
	} = useRoute([
		'id',
		'line_id',
		'point_order',
	]) || {};

	const { t } = useTranslation();

	const [editPoint, setEditPoint] = useState<undefined | RoutingPoint>(undefined);

	const [isToggling, setIsToggling] = useState(false);

	const createRouteMutation = useMutation({
		mutationFn: () => createRoute(),
		onMutate: async () => {
			setIsToggling(true);
		},
		onSuccess: async (newRouteId, _variables, _onMutateResult, context) => {
			if (newRouteId) {
				dispatch(setIsRouting(newRouteId));
				expand(false);
			}
		},
		onSettled: () => {
			setIsToggling(false);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: () =>
			Promise.all([
				deleteRoute(routeId),
				deleteLine(routingLineId || false),
			]),
		onMutate: async (_, context) => {
			await context.client.cancelQueries({ queryKey: ['route', routeId] });
			await context.client.cancelQueries({ queryKey: ['linesMeta'] });
			setIsToggling(true);
		},
		onSuccess: async (_, _variables, _onMutateResult, context) => {
			expand(false);
			dispatch(setIsRouting(false));
			await context.client.invalidateQueries({ queryKey: ['route', routeId] });
			await context.client.invalidateQueries({ queryKey: ['linesMeta'] });
		},
		onSettled: () => {
			setIsToggling(false);
		},
	});

	const handleToggleRouting = useCallback(async () => {
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

	return (
		<Fragment>
			{editPoint && (
				<EditPointModal
					editPoint={editPoint}
					setEditPoint={setEditPoint}
				/>
			)}

			<View style={itemStyles.item}>
				<ButtonHighlight
					style={itemStyles.buttonRow}
					mode="outlined"
					onPress={handleToggleRouting}
					disabled={isToggling}
				>
					<Text>{t(routeId ? 'stopRouting???' : 'startRouting???')}</Text>
				</ButtonHighlight>

				{/* {!routeId && (
					<ButtonHighlight
						style={itemStyles.buttonRow}
						mode="outlined"
						onPress={() => null}
					>
						<Text>{t('load TODO???')}</Text>
					</ButtonHighlight>
				)} */}

				{/* {routeId && (
					<View
						style={[
							itemStyles.itemRow,
							{
								flexDirection: 'row',
								justifyContent: 'space-between',
								marginHorizontal: 16,
								marginTop: (handleSize - iconSize) / 2,
								// marginBottom: 16,
							},
						]}
					>
						<ButtonHighlight
							mode="outlined"
							onPress={async () => {
								// const allPositions =
								// 	segments && segments?.length
								// 		? [...segments]
								// 				.map((segment) => {
								// 					return segment?.positions;
								// 				})
								// 				.filter((segment) => !!segment)
								// 				.flat()
								// 		: [];

								// const stats =
								// 	allPositions.length > 1
								// 		? await lineStringToStats(
								// 				lineString(locationsToCoordsArr(allPositions))
								// 					.geometry
								// 			)
								// 		: {};

								// const gpxString = [
								// 	'<?xml version="1.0" encoding="UTF-8"?>',
								// 	'<gpx',
								// 	'  xmlns="http://www.topografix.com/GPX/1/1"',
								// 	'  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
								// 	'  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"',
								// 	'  version="1.1" >',
								// 	'  <trk>',
								// 	'    <trkseg>',
								// 	...[...allPositions].map(
								// 		(pos) =>
								// 			'      <trkpt lat="' +
								// 			pos.lat +
								// 			'" lon="' +
								// 			pos.lng +
								// 			'">' +
								// 			(undefined !== pos?.alt
								// 				? '<ele>' + pos?.alt + '</ele>'
								// 				: '') +
								// 			'</trkpt>'
								// 	),
								// 	'    </trkseg>',
								// 	'  </trk>',
								// 	'</gpx>',
								// ].join('\n');

								// const fileName =
								// 	[
								// 		Math.round((stats?.length || 0) / 1000) + 'km',
								// 		Math.round(stats?.uphill || 0) + 'm_up',
								// 		Math.round(stats?.downhill || 0) + 'm_down',
								// 	].join('_') + '.gpx';

								// await createDocument(
								// 	fileName,
								// 	'application/gpx+xml',
								// 	gpxString,
								// 	'utf8'
								// );
							}}
						>
							<Text>{t('export???')}</Text>
						</ButtonHighlight>
					</View>
				)} */}

				{pointIds && pointIds.length > 0 && (
					<PointsList
						setScrollEnabled={setScrollEnabled}
						setEditPoint={setEditPoint}
					/>
				)}
			</View>
		</Fragment>
	);
};

export default DisplayComponent;
