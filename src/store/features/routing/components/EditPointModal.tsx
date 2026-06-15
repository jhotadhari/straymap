/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get, isEqual } from 'lodash-es';
import { GetTrackParams } from 'react-native-brouter';

/**
 * Internal dependencies
 */
import InfoRadioRow from '../../../../components/generic/InfoRadioRow';
import InfoRowControl from '../../../../components/generic/controls/InfoRowControl';
import ListItemMenuControl from '../../../../components/generic/controls/ListItemMenuControl';
import ModalWrapper from '../../../../components/generic/ModalWrapper';
import { useAppDispatch } from '../../../hooks';
import { RoutingPoint, RoutingProfile } from '../types';
import { updateRoutingPoint } from '../db/actionsRoutingPoint';
import { deleteSegmentByKeyVal, processRouting } from '../slice';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import useRoute from '../hooks/useRoute';

const ProfileRowControl = ({
	editPoint,
	setEditPoint,
}: {
	editPoint: RoutingPoint;
	setEditPoint: Dispatch<SetStateAction<RoutingPoint | undefined>>;
}) => {
	const { t } = useTranslation();

	const options = useMemo(
		() => [
			{
				key: 'motorcar',
				label: 'motorcar',
			},
			{
				key: 'bicycle',
				label: 'bicycle',
			},
			{
				key: 'foot',
				label: 'foot',
			},
		],
		[]
	);

	const selectedOpt = options.find((opt) => opt.key === editPoint.profile?.v);

	return (
		<InfoRowControl label={t('profile???')}>
			<ListItemMenuControl
				options={options}
				value={get(selectedOpt, 'key')}
				setValue={(newValue) =>
					editPoint.profile &&
					setEditPoint({
						...editPoint,
						profile: { ...editPoint.profile, v: newValue as GetTrackParams['v'] },
					})
				}
				anchorLabel={get(selectedOpt, 'label', '')}
			/>
		</InfoRowControl>
	);
};

const EditPointModal: FC<{
	// editSegment: RoutingSegment;
	// setEditSegment: Dispatch<SetStateAction<RoutingSegment | null>>;
	editPoint: RoutingPoint;
	setEditPoint: Dispatch<SetStateAction<RoutingPoint | undefined>>;
	// scrollEnabled: boolean;
	// setScrollEnabled: Dispatch<SetStateAction<boolean>>;
}> = ({ editPoint, setEditPoint }) => {
	const dispatch = useAppDispatch();

	// const segments = useAppSelector(selectSegmentsArr);

	const theme = useTheme();
	const { t } = useTranslation();

	const { id: routeId, points } = useRoute(['id', 'points']) || {};

	const point = useMemo(
		() => (points ? points.find((p) => p.id, editPoint.id) : undefined),
		[points, editPoint.id]
	);

	const mutationOptions: UseMutationOptions<void, Error, RoutingProfile, void> = useMemo(
		() => ({
			mutationFn: (profile: RoutingProfile) =>
				updateRoutingPoint(editPoint.id, {
					profile: profile,
				}),
			onMutate: async (_, context) => {
				await context.client.cancelQueries({ queryKey: ['route', routeId] });
			},
			onSuccess: async (_result, _variables, _onMutateResult, context) => {
				await context.client.invalidateQueries({ queryKey: ['route', routeId] });
				dispatch(deleteSegmentByKeyVal('fromId', editPoint.id));
				dispatch(processRouting());
				setEditPoint(undefined);
			},
		}),
		[editPoint.id, routeId]
	);
	const mutation = useMutation(mutationOptions);

	const onDismiss = useCallback(() => {
		if (!isEqual(editPoint?.profile, point?.profile)) {
			mutation.mutate(editPoint.profile);
		} else {
			setEditPoint(undefined);
		}
	}, [
		mutation.mutate,
		editPoint,
		point,
		routeId,
	]);

	return (
		<ModalWrapper
			visible={!!editPoint.profile}
			onDismiss={onDismiss}
			header={'editPoint.profile???'}
		>
			<ProfileRowControl
				editPoint={editPoint}
				setEditPoint={setEditPoint}
			/>

			<InfoRadioRow
				opt={{
					label: t('fast'),
					key: 'fast',
				}}
				onPress={() =>
					editPoint.profile &&
					setEditPoint({
						...editPoint,
						profile: {
							...editPoint.profile,
							fast: !editPoint.profile.fast,
						},
					})
				}
				labelStyle={theme.fonts.bodyMedium}
				labelExtractor={(a) => a.label}
				status={editPoint.profile?.fast ? 'checked' : 'unchecked'}
				radioAlign={'left'}
				Info={t('hint.maps.hgtInterpolation')}
			/>
		</ModalWrapper>
	);
};

export default EditPointModal;
