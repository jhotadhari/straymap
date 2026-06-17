/**
 * External dependencies
 */
import { FC, useCallback, useMemo } from 'react';
import { Icon, Text, TextInput, useTheme } from 'react-native-paper';
import { get } from 'lodash-es';
import { StyleSheet, View } from 'react-native';
import { useMutation, UseMutationOptions, useQuery } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/ModalWrapper';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import InfoRowControl from '../../../../components/generic/controls/InfoRowControl';
import { LinePartial } from '../types';
import { queryLinesWithoutGeom } from '../db/queryFns';
import { updateLine } from '../db/actionsLine';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import IconRouting from '../../drawers/items/routing/IconComponent';
import { setIsRouting } from '../../routing/slice';
import { queryRouteForLine } from '../../routing/db/queryFns';
import useActivateDrawerItem from '../../drawers/hooks/useActivateDrawerItem';
import { selectLineTemp } from '../selectors';
import { setLineTemp } from '../slice';
import { selectIsRouting } from '../../routing/selectors';
import { iconSize } from '../../drawers/constants';
import useDeleteLinesCbModal from '../hooks/useDeleteLinesCbModal';

const LineEditModal: FC<{
	selectLine: (id: number, isSelected: boolean) => void;
	onDeleteSuccess?: (lineId?: number) => void;
}> = ({ selectLine, onDeleteSuccess }) => {
	const dispatch = useAppDispatch();

	const activateRoutingDrawerItem = useActivateDrawerItem('routing');

	const lineTemp = useAppSelector(selectLineTemp);

	const isRouting = useAppSelector(selectIsRouting);

	const theme = useTheme();

	const { data: route } = useQuery({
		queryKey: ['routeForLine', lineTemp?.id],
		queryFn: queryRouteForLine,
	});

	const { data: line } = useQuery({
		queryKey: ['lines', lineTemp?.id ? [lineTemp?.id] : []],
		queryFn: queryLinesWithoutGeom,
		select: (lines: LinePartial[]) => (lines.length ? lines[0] : null),
	});

	const mutationOptions: UseMutationOptions<void, Error, LinePartial, unknown> = useMemo(
		() => ({
			mutationFn: (newLinePartial: LinePartial) =>
				updateLine(newLinePartial?.id, newLinePartial),
			onMutate: async (_, context) => {
				await context.client.cancelQueries({ queryKey: ['lines'] });
				if (route?.id) {
					await context.client.cancelQueries({ queryKey: ['route', route?.id] });
				}
			},
			onSuccess: async (_, _variables, _onMutateResult, context) => {
				await context.client.invalidateQueries({ queryKey: ['lines'] });
				if (route?.id) {
					await context.client.invalidateQueries({ queryKey: ['route', route?.id] });
				}
			},
		}),
		[route?.id]
	);
	const mutation = useMutation(mutationOptions);

	const onDismiss = useCallback(() => {
		if (
			line &&
			lineTemp &&
			Object.keys(lineTemp).some((key: string) => get(line, key) !== get(lineTemp, key))
		) {
			mutation.mutate(lineTemp);
		}
		dispatch(setLineTemp(undefined));
	}, [
		mutation.mutate,
		line,
		lineTemp,
	]);

	const handleSetRouting = useCallback(() => {
		if (line?.id && route?.id) {
			dispatch(setIsRouting(route.id));
			selectLine(line.id, true);
			activateRoutingDrawerItem();
		}
	}, [line?.id, route?.id]);

	const removeFromMap = useCallback(() => {
		line?.id && selectLine(line.id, false);
	}, [line?.id]);
	const handleDeleteSuccess = useCallback(() => {
		onDeleteSuccess && onDeleteSuccess(line?.id);
		onDismiss();
	}, [
		onDeleteSuccess,
		onDismiss,
		line?.id,
	]);
	const { cb: handleDelete, modalNode: modalNodeDelete } = useDeleteLinesCbModal({
		deleteIdsOrId: line?.id,
		routeId: route?.id,
		routingLineId: line?.id,
		removeLinesFromMap: removeFromMap,
		onSuccess: handleDeleteSuccess,
	});

	return (
		<ModalWrapper
			visible={!!lineTemp}
			onDismiss={onDismiss}
			header={'bla???'}
			innerStyle={styles.gap}
		>
			<InfoRowControl
				label={'name'} // ??? translation
				// Info={Info}
			>
				<TextInput
					style={{ flexGrow: 1 }}
					underlineColor="transparent"
					dense={true}
					theme={{
						fonts: {
							bodyLarge: {
								...theme.fonts.bodySmall,
								fontFamily: 'sans-serif',
							},
						},
					}}
					onChangeText={(newVal) =>
						lineTemp
							? dispatch(
									setLineTemp({
										...(lineTemp as LinePartial),
										title: newVal,
									})
								)
							: undefined
					}
					value={lineTemp?.title ?? line?.title ?? ''}
				/>
			</InfoRowControl>

			{route?.id && (
				<InfoRowControl
					label={'routing???'}
					// Info={Info}
				>
					<ButtonHighlight
						style={{
							borderColor: theme.colors.onBackground,
							...((!route?.id || isRouting === route?.id) && {
								opacity: 0.5,
								borderColor: theme.colors.onSurfaceDisabled,
							}),
						}}
						mode="outlined"
						compact={true}
						disabled={!route?.id || isRouting === route?.id}
						onPress={handleSetRouting}
					>
						<View style={styles.buttonInner}>
							<IconRouting color={theme.colors.onBackground} />
							{!route?.id && <Text>{'no routing data???'}</Text>}
							{route?.id && isRouting !== route?.id && (
								<Text>{'load routing???'}</Text>
							)}
							{route?.id && isRouting === route?.id && (
								<Text>{'is already routing???'}</Text>
							)}
						</View>
					</ButtonHighlight>
				</InfoRowControl>
			)}

			<InfoRowControl
				label={'export???'}
				// Info={Info}
			>
				<ButtonHighlight
					mode="outlined"
					compact={true}
					// onPress={async () => {
					// 	// const allPositions =
					// 	// 	segments && segments?.length
					// 	// 		? [...segments]
					// 	// 				.map((segment) => {
					// 	// 					return segment?.positions;
					// 	// 				})
					// 	// 				.filter((segment) => !!segment)
					// 	// 				.flat()
					// 	// 		: [];

					// 	// const stats =
					// 	// 	allPositions.length > 1
					// 	// 		? await lineStringToStats(
					// 	// 				lineString(locationsToCoordsArr(allPositions))
					// 	// 					.geometry
					// 	// 			)
					// 	// 		: {};

					// 	// const gpxString = [
					// 	// 	'<?xml version="1.0" encoding="UTF-8"?>',
					// 	// 	'<gpx',
					// 	// 	'  xmlns="http://www.topografix.com/GPX/1/1"',
					// 	// 	'  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
					// 	// 	'  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"',
					// 	// 	'  version="1.1" >',
					// 	// 	'  <trk>',
					// 	// 	'    <trkseg>',
					// 	// 	...[...allPositions].map(
					// 	// 		(pos) =>
					// 	// 			'      <trkpt lat="' +
					// 	// 			pos.lat +
					// 	// 			'" lon="' +
					// 	// 			pos.lng +
					// 	// 			'">' +
					// 	// 			(undefined !== pos?.alt
					// 	// 				? '<ele>' + pos?.alt + '</ele>'
					// 	// 				: '') +
					// 	// 			'</trkpt>'
					// 	// 	),
					// 	// 	'    </trkseg>',
					// 	// 	'  </trk>',
					// 	// 	'</gpx>',
					// 	// ].join('\n');

					// 	// const fileName =
					// 	// 	[
					// 	// 		Math.round((stats?.length || 0) / 1000) + 'km',
					// 	// 		Math.round(stats?.uphill || 0) + 'm_up',
					// 	// 		Math.round(stats?.downhill || 0) + 'm_down',
					// 	// 	].join('_') + '.gpx';

					// 	// await createDocument(
					// 	// 	fileName,
					// 	// 	'application/gpx+xml',
					// 	// 	gpxString,
					// 	// 	'utf8'
					// 	// );
					// }}
				>
					<View style={styles.buttonInner}>
						<Icon
							source="content-save-outline"
							size={iconSize}
						/>
						<Text>{'??? TODO export '}</Text>
					</View>
				</ButtonHighlight>
			</InfoRowControl>

			{modalNodeDelete}
			<InfoRowControl
				label={'delete???'}
				// Info={Info}
			>
				<ButtonHighlight
					mode="outlined"
					compact={true}
					onPress={handleDelete}
				>
					<View style={styles.buttonInner}>
						<Icon
							source="delete"
							size={iconSize}
						/>
						<Text>{'delete???'}</Text>
					</View>
				</ButtonHighlight>
			</InfoRowControl>
		</ModalWrapper>
	);
};

const styles = StyleSheet.create({
	gap: {
		gap: 8,
	},
	buttonInner: {
		alignItems: 'center',
		flexDirection: 'row',
		gap: 8,
	},
});

export default LineEditModal;
