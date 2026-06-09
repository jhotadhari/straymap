/**
 * External dependencies
 */
import React, {
	Dispatch,
	FC,
	SetStateAction,
	useCallback,
	useContext,
	useMemo,
	useState,
} from 'react';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ScrollView, TouchableHighlight, View } from 'react-native';
import formatcoords from 'formatcoords';
import { sprintf } from 'sprintf-js';
import DraggableGrid from 'react-native-draggable-grid';
import { get, omit } from 'lodash-es';
import { GetTrackParams } from 'react-native-brouter';
import { createDocument } from 'react-native-scoped-storage';
import MaterialIcons from '@react-native-vector-icons/material-icons/static';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import InfoRadioRow from '../../../../components/generic/InfoRadioRow';
import InfoRowControl from '../../../../components/generic/controls/InfoRowControl';
import ListItemMenuControl from '../../../../components/generic/controls/ListItemMenuControl';
import LoadingIndicator from '../../../../components/generic/LoadingIndicator';
import ModalWrapper from '../../../../components/generic/ModalWrapper';
import { formatDistance, getUpDown } from '../../../../lib/utils';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectUnitPrefs } from '../../general/selectors';
import DrawerContext from '../../drawers/DrawerContext';
import { RoutingSegment, RoutingPoint, RoutingProfile } from '../types';
import { handleSize, iconSize, itemStyles } from '../../drawers/constants';
import { setSegments } from '../routingSlice';
import { selectIsRouting, selectPoints, selectSegments } from '../selectors';
import { updateRoutingPoint } from '../db/actionsRoutingPoint';

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

	const segments = useAppSelector(selectSegments);

	const theme = useTheme();
	const { t } = useTranslation();

	const points = useAppSelector(selectPoints);

	const resetSegmentPositions = useCallback(() => {
		if (segments && editPoint.profile && points) {
			const segmentIdx = segments.findIndex((segment) => segment.fromId === editPoint.id);
			if (-1 !== segmentIdx) {
				const point = points.find((p) => p.id === editPoint.id);
				if (JSON.stringify(point?.profile) !== JSON.stringify(editPoint.profile)) {
					const newSegments = [...segments];
					newSegments.splice(segmentIdx, 1, omit(segments[segmentIdx], ['positions']));
					dispatch(setSegments(newSegments, { updateRoutes: true }));
				}
			}
		}
	}, [
		segments,
		editPoint,
		points,
	]);

	const savePointToDb = useCallback(async () => {
		await updateRoutingPoint(editPoint.id, {
			profile: editPoint.profile,
		});
	}, [editPoint]);

	return (
		<ModalWrapper
			visible={!!editPoint.profile}
			onDismiss={async () => {
				resetSegmentPositions();
				await savePointToDb();
				setEditPoint(undefined);
			}}
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
