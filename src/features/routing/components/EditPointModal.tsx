/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get, isEqual } from 'lodash-es';
import type { VehicleMode } from 'react-native-brouter/geojson';

/**
 * Internal dependencies
 */
import InfoRadioRow from '../../../components/generic/infoWrapper/InfoRadioRow';
import InfoLabelRow from '../../../components/generic/infoWrapper/InfoLabelRow';
import ListItemMenuControl from '../../../components/generic/wrapper/ListItemMenuControl';
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import { useAppDispatch } from '../../../store/hooks';
import { RoutingPoint, RoutingProfile } from '../types';
import { updateRoutingPoint } from '../db/actionsRoutingPoint';
import { deleteSegmentByKeyVal, processRouting } from '../slice';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import useRoute from '../hooks/useRoute';
import { dbConnection } from '../../dbLoader/DBConnection';

const profileOptions = [
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
];

const ProfileRowControl = ({
	editPoint,
	setEditPoint,
}: {
	editPoint: RoutingPoint;
	setEditPoint: Dispatch<SetStateAction<RoutingPoint | undefined>>;
}) => {
	const { t } = useTranslation();

	const selectedOpt = profileOptions.find((opt) => opt.key === editPoint.profile?.v);

	const handleSetValue = useCallback(
		(newValue: string) =>
			editPoint.profile &&
			setEditPoint({
				...editPoint,
				profile: { ...editPoint.profile, v: newValue as VehicleMode },
			}),
		[editPoint, setEditPoint]
	);

	return (
		<InfoLabelRow
			label={t('routing.profile')}
			Info={t('routing.hintProfile')}
		>
			<ListItemMenuControl
				options={profileOptions}
				value={get(selectedOpt, 'key')}
				setValue={handleSetValue}
				anchorLabel={get(selectedOpt, 'label', '')}
			/>
		</InfoLabelRow>
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
			onMutate: async () => {
				await dbConnection.queryClient!.cancelQueries({ queryKey: ['route', routeId] });
			},
			onSuccess: async () => {
				await dbConnection.queryClient!.invalidateQueries({ queryKey: ['route', routeId] });
				dispatch(deleteSegmentByKeyVal('fromId', editPoint.id));
				dbConnection?.queryClient && dispatch(processRouting(dbConnection?.queryClient));
				setEditPoint(undefined);
			},
		}),
		[
			editPoint.id,
			routeId,
			dispatch,
			setEditPoint,
		]
	);
	const mutation = useMutation(mutationOptions);

	const onDismiss = useCallback(() => {
		if (!isEqual(editPoint?.profile, point?.profile)) {
			mutation.mutate(editPoint.profile);
		} else {
			setEditPoint(undefined);
		}
	}, [
		editPoint,
		point,
		mutation,
		setEditPoint,
	]);

	const handleToggleFast = useCallback(
		() =>
			editPoint.profile &&
			setEditPoint({
				...editPoint,
				profile: {
					...editPoint.profile,
					fast: !editPoint.profile.fast,
				},
			}),
		[editPoint, setEditPoint]
	);

	const fastOpt = useMemo(
		() => ({
			label: t('routing.fast'),
			key: 'fast',
		}),
		[t]
	);

	return (
		<ModalWrapper
			visible={!!editPoint.profile}
			onDismiss={onDismiss}
			header={t('routing.editProfile')}
		>
			<ProfileRowControl
				editPoint={editPoint}
				setEditPoint={setEditPoint}
			/>

			<InfoRadioRow
				opt={fastOpt}
				onPress={handleToggleFast}
				labelStyle={theme.fonts.bodyMedium}
				labelExtractor={(a) => a.label}
				status={editPoint.profile?.fast ? 'checked' : 'unchecked'}
				radioAlign={'left'}
				Info={t('routing.hintFast')}
			/>
		</ModalWrapper>
	);
};

export default EditPointModal;
