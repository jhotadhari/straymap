/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';
import { SegmentedButtons, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { isEqual } from 'lodash-es';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { RoutingPoint, RoutingProfile, Route, RoutingPointInheritMode } from '../types';
import { updateRoutingPoint } from '../db/actionsRoutingPoint';
import { deleteSegments, processRouting, setLastProfile } from '../slice';
import { dbConnection } from '../../dbLoader/DBConnection';
import { selectUnitPrefs } from '../../general/selectors';
import { getChangedSegmentIds, resolveProfileForPoint } from '../utils';
import { DEFAULT_INHERIT_MODE } from '../constants';
import ProfileEditControls from './ProfileEditControls';
import RoutingProfileInfo from './RoutingProfileInfo';
import { sharedStyles } from '../../../sharedStyles';

/*
 * Modal for editing a single routing point's profile inheritMode and/or
 * explicit profile (when inheritMode === 'own').
 *
 * Shows SegmentedButtons [Route | Previous | Own] at the top:
 *   - Route / Previous: read-only display of the resolved profile
 *   - Own: full ProfileEditControls for the explicit profile
 *
 * Snapshotting: the first time the user switches to 'own', the currently
 * resolved profile is snap-shotted as the initial value. Subsequent
 * switches away from 'own' preserve local edits in state — switching back
 * restores them without re-snapshotting.
 *
 * On save: uses getChangedSegmentIds to only delete segments whose
 * resolved profile actually changed, then dispatches processRouting.
 * If inheritMode === 'own', also sets setLastProfile.
 */
const EditPointModal: FC<{
	route: Route;
	editPoint: RoutingPoint;
	setEditPoint: Dispatch<SetStateAction<RoutingPoint | undefined>>;
}> = ({ route, editPoint, setEditPoint }) => {
	const dispatch = useAppDispatch();

	const { t } = useTranslation();
	const theme = useTheme();

	const unitPrefs = useAppSelector(selectUnitPrefs);
	const distUnit = unitPrefs.distance;

	const { points, profile: routeProfile } = route;

	const point = useMemo(
		() => (points ? points.find((p) => p.id === editPoint.id) : undefined),
		[points, editPoint.id]
	);

	const editPointIdx = useMemo(
		() => (point ? points.findIndex((p) => p.id === point.id) : -1),
		[point, points]
	);

	const resolvedProfile = useMemo(
		() =>
			point
				? resolveProfileForPoint(point, editPointIdx, points, routeProfile)
				: editPoint.profile!,
		[
			point,
			editPointIdx,
			points,
			routeProfile,
			editPoint.profile,
		]
	);

	const inheritMode = editPoint.inheritMode ?? DEFAULT_INHERIT_MODE;

	const mutationOptions: UseMutationOptions<
		void,
		Error,
		{
			profile?: RoutingProfile | null;
			inheritMode: RoutingPointInheritMode;
			segmentIds: string[];
		},
		void
	> = useMemo(
		() => ({
			mutationFn: ({ profile, inheritMode }) =>
				updateRoutingPoint(editPoint.id, { profile, inheritMode }),
			onMutate: async () => {
				await dbConnection.queryClient!.cancelQueries({
					queryKey: ['route', route.id],
				});
			},
			onSuccess: async (_data, { profile, inheritMode, segmentIds }) => {
				await dbConnection.queryClient!.invalidateQueries({
					queryKey: ['route', route.id],
				});

				if (segmentIds.length) {
					dispatch(deleteSegments(segmentIds));
				}

				if (inheritMode === 'own' && profile) {
					dispatch(setLastProfile(profile));
				}

				dbConnection?.queryClient && dispatch(processRouting(dbConnection?.queryClient));
				setEditPoint(undefined);
			},
		}),
		[
			editPoint.id,
			route.id,
			dispatch,
			setEditPoint,
		]
	);
	const mutation = useMutation(mutationOptions);

	const onDismiss = useCallback(() => {
		if (!point) {
			setEditPoint(undefined);
			return;
		}
		const modeChanged = inheritMode !== (point.inheritMode ?? DEFAULT_INHERIT_MODE);
		const profileChanged = !isEqual(editPoint.profile, point.profile);

		if (modeChanged || profileChanged) {
			const newProfile = inheritMode === 'own' ? editPoint.profile : undefined;

			const newPoints = points.map((p, i) => {
				if (i === editPointIdx) {
					return { ...p, inheritMode, profile: newProfile };
				}
				return p;
			});

			const segmentIds = getChangedSegmentIds(points, routeProfile, {
				startIdx: editPointIdx,
				newPoints,
			});

			mutation.mutate({
				profile: newProfile ?? null,
				inheritMode,
				segmentIds,
			});
		} else {
			setEditPoint(undefined);
		}
	}, [
		editPoint,
		point,
		points,
		editPointIdx,
		inheritMode,
		routeProfile,
		mutation,
		setEditPoint,
	]);

	const handleSetInheritMode = useCallback(
		(newMode: string) => {
			const mode = newMode as RoutingPointInheritMode;

			if (mode === 'own' && !editPoint.profile) {
				setEditPoint({
					...editPoint,
					inheritMode: mode,
					profile: resolvedProfile,
				});
			} else {
				setEditPoint({
					...editPoint,
					inheritMode: mode,
				});
			}
		},
		[
			editPoint,
			setEditPoint,
			resolvedProfile,
		]
	);

	const handleProfileChange = useCallback(
		(newProfile: RoutingProfile) => {
			setEditPoint({
				...editPoint,
				inheritMode: 'own',
				profile: newProfile,
			});
		},
		[editPoint, setEditPoint]
	);

	const segmentButtons = useMemo(
		() => [
			{
				value: 'route',
				label: t('routing.inheritModeRoute'),
			},
			{
				value: 'prev',
				label: t('routing.inheritModePrev'),
			},
			{
				value: 'own',
				label: t('routing.inheritModeOwn'),
			},
		],
		[t]
	);

	const segmentedButtonsTheme = useMemo(
		() => ({
			colors: {
				secondaryContainer: theme.colors.primaryContainer,
				textColor: theme.colors.onPrimaryContainer,
			},
		}),
		[theme.colors.primaryContainer, theme.colors.onPrimaryContainer]
	);

	return (
		<ModalWrapper
			visible={true}
			onDismiss={onDismiss}
			headerLabel={t('routing.editProfile')}
			innerStyle={sharedStyles.modal}
		>
			<SegmentedButtons
				value={inheritMode}
				onValueChange={handleSetInheritMode}
				theme={segmentedButtonsTheme}
				buttons={segmentButtons}
			/>

			{inheritMode !== 'own' && (
				<RoutingProfileInfo
					profile={resolvedProfile}
					inheritMode={inheritMode}
					distUnit={distUnit}
				/>
			)}

			{inheritMode === 'own' && (
				<ProfileEditControls
					profile={editPoint.profile ?? resolvedProfile}
					onProfileChange={handleProfileChange}
				/>
			)}
		</ModalWrapper>
	);
};

export default EditPointModal;
