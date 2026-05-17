/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction, useContext, useMemo, useState } from 'react';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { ScrollView, TouchableHighlight, View } from 'react-native';
import formatcoords from 'formatcoords';
import { sprintf } from 'sprintf-js';
import DraggableGrid from 'react-native-draggable-grid';
import { get, omit } from 'lodash-es';
import { GetTrackParams } from 'react-native-brouter';
import { createDocument } from 'react-native-scoped-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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
import { RoutingSegment, RoutingPoint } from '../types';
import { handleSize, iconSize, itemStyles } from '../../drawers/constants';
import PointsList from './PointsList';
import { RoutingContext } from '../RoutingContext';
import { setSegments } from '../routingSlice';
import { selectIsRouting, selectPoints, selectSegments } from '../selectors';

const ProfileRowControl = ({
	editSegment,
	setEditSegment,
}: {
	editSegment: RoutingSegment;
	setEditSegment: Dispatch<SetStateAction<null | RoutingSegment>>;
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

	const selectedOpt = options.find((opt) => opt.key === editSegment.profile.v);

	return (
		<InfoRowControl label={t('profile???')}>
			<ListItemMenuControl
				options={options}
				value={get(selectedOpt, 'key')}
				setValue={(newValue) =>
					setEditSegment({
						...editSegment,
						profile: {
							...editSegment.profile,
							v: newValue as GetTrackParams['v'],
						},
					})
				}
				anchorLabel={get(selectedOpt, 'label', '')}
			/>
		</InfoRowControl>
	);
};

const EditSegmentModal: FC<{
	editSegment: RoutingSegment;
	setEditSegment: Dispatch<SetStateAction<RoutingSegment | null>>;
	// scrollEnabled: boolean;
	// setScrollEnabled: Dispatch<SetStateAction<boolean>>;
}> = ({ editSegment, setEditSegment }) => {
	const dispatch = useAppDispatch();

	const segments = useAppSelector(selectSegments);

	const { triggerSegmentsUpdate } = useContext(RoutingContext);

	const theme = useTheme();
	const { t } = useTranslation();

	const updateSegment = () => {
		if (segments && editSegment && setSegments) {
			const segmentIdx = segments.findIndex((segment) => segment.key === editSegment.key);
			if (-1 !== segmentIdx) {
				if (
					JSON.stringify(segments[segmentIdx].profile) !==
					JSON.stringify(editSegment.profile)
				) {
					const newSegments = [...segments];
					newSegments.splice(segmentIdx, 1, omit(editSegment, ['positions']));
					dispatch(setSegments(newSegments));
					triggerSegmentsUpdate && triggerSegmentsUpdate();
				}
			}
		}
	};

	return (
		<ModalWrapper
			visible={!!editSegment}
			onDismiss={() => {
				updateSegment();
				setEditSegment(null);
			}}
			onHeaderBackPress={() => {
				updateSegment();
				setEditSegment(null);
			}}
			header={'editProfile???'}
		>
			<ProfileRowControl
				editSegment={editSegment}
				setEditSegment={setEditSegment}
			/>

			<InfoRadioRow
				opt={{
					label: t('fast'),
					key: 'fast',
				}}
				onPress={() =>
					setEditSegment({
						...editSegment,
						profile: {
							...editSegment.profile,
							fast: !editSegment.profile.fast,
						},
					})
				}
				labelStyle={theme.fonts.bodyMedium}
				labelExtractor={(a) => a.label}
				status={editSegment.profile.fast ? 'checked' : 'unchecked'}
				radioAlign={'left'}
				Info={t('hint.maps.hgtInterpolation')}
			/>
		</ModalWrapper>
	);
};

export default EditSegmentModal;
