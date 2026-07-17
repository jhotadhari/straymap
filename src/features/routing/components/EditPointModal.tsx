/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get, isEqual } from 'lodash-es';

/**
 * Internal dependencies
 */
import InfoRadioRow from '../../../components/generic/infoWrapper/InfoRadioRow';
import InfoLabelRow from '../../../components/generic/infoWrapper/InfoLabelRow';
import ListItemMenuControl from '../../../components/generic/wrapper/ListItemMenuControl';
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import NumericRowControl from '../../../components/generic/controls/NumericRowControl';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { RoutingPoint, RoutingProfile, BrouterOptions } from '../types';
import { updateRoutingPoint } from '../db/actionsRoutingPoint';
import { deleteSegmentByKeyVal, processRouting } from '../slice';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import useRoute from '../hooks/useRoute';
import { dbConnection } from '../../dbLoader/DBConnection';
import { DEFAULT_OPTIONS_BROUTER, DEFAULT_OPTIONS_STRAIGHT_LINE } from '../constants';
import { formatDistanceUnit } from '../../../lib/formatting';
import { selectUnitPrefs } from '../../general/selectors';

const providerOptions = [
	{
		key: 'brouter',
		label: 'routing.providerBrouter',
	},
	{
		key: 'straightLine',
		label: 'routing.providerStraightLine',
	},
];

const vehicleOptions = [
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

const ProviderRowControl = ({
	editPoint,
	setEditPoint,
}: {
	editPoint: RoutingPoint;
	setEditPoint: Dispatch<SetStateAction<RoutingPoint | undefined>>;
}) => {
	const { t } = useTranslation();

	const selectedOpt = providerOptions.find((opt) => opt.key === editPoint.profile.provider);

	const handleSetProvider = useCallback(
		(newProvider: string) => {
			if (newProvider === 'brouter') {
				setEditPoint({
					...editPoint,
					profile: {
						provider: 'brouter',
						options: DEFAULT_OPTIONS_BROUTER,
					},
				});
			} else if (newProvider === 'straightLine') {
				setEditPoint({
					...editPoint,
					profile: {
						provider: 'straightLine',
						options: DEFAULT_OPTIONS_STRAIGHT_LINE,
					},
				});
			}
		},
		[editPoint, setEditPoint]
	);

	return (
		<InfoLabelRow
			label={t('routing.provider')}
			Info={t('routing.hintProvider')}
		>
			<ListItemMenuControl
				options={providerOptions}
				value={get(selectedOpt, 'key')}
				setValue={handleSetProvider}
				anchorLabel={t(get(selectedOpt, 'label', ''))}
			/>
		</InfoLabelRow>
	);
};

const VehicleRowControl = ({
	editPoint,
	setEditPoint,
}: {
	editPoint: RoutingPoint;
	setEditPoint: Dispatch<SetStateAction<RoutingPoint | undefined>>;
}) => {
	const { t } = useTranslation();

	const selectedOpt =
		editPoint.profile.provider === 'brouter'
			? vehicleOptions.find(
					(opt) => opt.key === (editPoint.profile.options as BrouterOptions).v
				)
			: undefined;

	const handleSetVehicle = useCallback(
		(newValue: string) =>
			setEditPoint({
				...editPoint,
				profile: {
					provider: 'brouter' as const,
					options: {
						...editPoint.profile.options,
						v: newValue,
					},
				} as RoutingProfile,
			}),
		[editPoint, setEditPoint]
	);

	if (editPoint.profile.provider !== 'brouter') {
		return undefined;
	}

	return (
		<InfoLabelRow
			label={t('routing.profile')}
			Info={t('routing.hintProfile')}
		>
			<ListItemMenuControl
				options={vehicleOptions}
				value={get(selectedOpt, 'key')}
				setValue={handleSetVehicle}
				anchorLabel={get(selectedOpt, 'label', '')}
			/>
		</InfoLabelRow>
	);
};

const IntervalRowControl = ({
	editPoint,
	setEditPoint,
}: {
	editPoint: RoutingPoint;
	setEditPoint: Dispatch<SetStateAction<RoutingPoint | undefined>>;
}) => {
	const { t } = useTranslation();

	const unitPrefs = useAppSelector(selectUnitPrefs);
	const distUnit = unitPrefs.distance;

	const handleSetInterval = useCallback(
		(newValue: number) => {
			setEditPoint({
				...editPoint,
				profile: {
					provider: 'straightLine' as const,
					options: { interval: newValue },
				} as RoutingProfile,
			});
		},
		[editPoint, setEditPoint]
	);

	const validatePositive = useCallback((val: number) => val > 0, []);

	const label = useMemo(
		() => t('routing.interval') + ' [' + formatDistanceUnit(distUnit, true) + ']',
		[distUnit]
	);

	if (editPoint.profile.provider !== 'straightLine') {
		return undefined;
	}

	return (
		<NumericRowControl
			label={label}
			Info={t('routing.hintInterval')}
			value={editPoint.profile.options.interval}
			onUpdate={handleSetInterval}
			numType="int"
			validate={validatePositive}
		/>
	);
};

const EditPointModal: FC<{
	editPoint: RoutingPoint;
	setEditPoint: Dispatch<SetStateAction<RoutingPoint | undefined>>;
}> = ({ editPoint, setEditPoint }) => {
	const dispatch = useAppDispatch();

	const theme = useTheme();
	const { t } = useTranslation();

	const { id: routeId, points } = useRoute(['id', 'points']) || {};

	const point = useMemo(
		() => (points ? points.find((p) => p.id === editPoint.id) : undefined),
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

	const handleToggleFast = useCallback(() => {
		if (editPoint.profile.provider !== 'brouter') {
			return;
		}
		const opts = editPoint.profile.options;
		setEditPoint({
			...editPoint,
			profile: {
				provider: 'brouter' as const,
				options: {
					...opts,
					fast: !opts.fast,
				},
			} as RoutingProfile,
		});
	}, [editPoint, setEditPoint]);

	const fastOpt = useMemo(
		() => ({
			label: t('routing.fast'),
			key: 'fast',
		}),
		[t]
	);

	const isBrouter = editPoint.profile.provider === 'brouter';

	return (
		<ModalWrapper
			visible={!!editPoint.profile}
			onDismiss={onDismiss}
			headerLabel={t('routing.editProfile')}
		>
			<ProviderRowControl
				editPoint={editPoint}
				setEditPoint={setEditPoint}
			/>

			<VehicleRowControl
				editPoint={editPoint}
				setEditPoint={setEditPoint}
			/>

			{isBrouter && (
				<InfoRadioRow
					opt={fastOpt}
					onPress={handleToggleFast}
					labelStyle={theme.fonts.bodyMedium}
					labelExtractor={(a) => a.label}
					status={
						(editPoint.profile.options as BrouterOptions).fast ? 'checked' : 'unchecked'
					}
					radioAlign={'left'}
					Info={t('routing.hintFast')}
				/>
			)}

			<IntervalRowControl
				editPoint={editPoint}
				setEditPoint={setEditPoint}
			/>
		</ModalWrapper>
	);
};

export default EditPointModal;
