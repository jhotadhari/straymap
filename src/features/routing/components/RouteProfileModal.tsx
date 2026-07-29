/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isEqual } from 'lodash-es';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { Text, useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import { useAppDispatch } from '../../../store/hooks';
import { Route, RoutingProfile } from '../types';
import { updateRoute } from '../db/actionsRoute';
import { dbConnection } from '../../dbLoader/DBConnection';
import { DEFAULT_INHERIT_MODE } from '../constants';
import { deleteSegments, processRouting, setLastProfile } from '../slice';
import { getChangedSegmentIds } from '../utils';
import ProfileEditControls from './ProfileEditControls';
import { sharedStyles } from '../../../sharedStyles';

/*
 * Modal for editing the route-level RoutingProfile.
 *
 * Shows a usage stats line ("X points use this profile, Y inherit from
 * previous, Z have custom profiles") and the full ProfileEditControls
 * for the route profile.
 *
 * On save: uses getChangedSegmentIds with newRouteProfile to only delete
 * segments whose resolved profile actually changed, dispatches
 * setLastProfile, then dispatches processRouting.
 */
const RouteProfileModal: FC<{
	route: Route;
	visible: boolean;
	onDismiss: () => void;
}> = ({ route, visible, onDismiss }) => {
	const dispatch = useAppDispatch();

	const { t } = useTranslation();
	const theme = useTheme();

	const [editProfile, setEditProfile] = useState<RoutingProfile | undefined>(undefined);

	const initialProfile = useMemo(
		() => editProfile ?? route.profile,
		[editProfile, route.profile]
	);

	const handleProfileChange = useCallback((newProfile: RoutingProfile) => {
		setEditProfile(newProfile);
	}, []);

	const profileUsage = useMemo(() => {
		if (!route?.points?.length) {
			return null;
		}
		let routeCount = 0,
			prevCount = 0,
			ownCount = 0;
		route.points.forEach((point) => {
			switch (point.inheritMode ?? DEFAULT_INHERIT_MODE) {
				case 'route':
					routeCount++;
					break;
				case 'prev':
					prevCount++;
					break;
				case 'own':
					ownCount++;
					break;
			}
		});
		return { routeCount, prevCount, ownCount };
	}, [route?.points]);

	const mutationOptions: UseMutationOptions<
		void,
		Error,
		{ profile: RoutingProfile; segmentIds: string[] },
		void
	> = useMemo(
		() => ({
			mutationFn: ({ profile }: { profile: RoutingProfile }) =>
				updateRoute(route.id, { profile }),
			onSuccess: async (_data, { profile, segmentIds }) => {
				await dbConnection.queryClient!.invalidateQueries({
					queryKey: ['route', route.id],
				});

				if (segmentIds.length) {
					dispatch(deleteSegments(segmentIds));
				}

				dispatch(setLastProfile(profile));
				dbConnection?.queryClient && dispatch(processRouting(dbConnection.queryClient));
				setEditProfile(undefined);
				onDismiss();
			},
		}),
		[
			route.id,
			dispatch,
			onDismiss,
		]
	);
	const mutation = useMutation(mutationOptions);

	const handleDismiss = useCallback(() => {
		if (!editProfile || isEqual(editProfile, route.profile)) {
			setEditProfile(undefined);
			onDismiss();
			return;
		}

		const segmentIds = getChangedSegmentIds(route.points, route.profile, {
			newRouteProfile: editProfile,
		});

		mutation.mutate({ profile: editProfile, segmentIds });
	}, [
		editProfile,
		route,
		mutation,
		onDismiss,
	]);

	if (!initialProfile) {
		return null;
	}

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={handleDismiss}
			headerLabel={t('routing.editRouteProfile')}
			innerStyle={sharedStyles.modal}
		>
			{profileUsage && (
				<Text style={{ color: theme.colors.onSurfaceVariant }}>
					{t('routing.routeProfileUsage', {
						routeCount: profileUsage.routeCount,
						prevCount: profileUsage.prevCount,
						ownCount: profileUsage.ownCount,
					})}
				</Text>
			)}

			<ProfileEditControls
				profile={initialProfile}
				onProfileChange={handleProfileChange}
			/>
		</ModalWrapper>
	);
};

export default RouteProfileModal;
