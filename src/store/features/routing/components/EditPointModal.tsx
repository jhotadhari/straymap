/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get, omit } from 'lodash-es';
import { GetTrackParams } from 'react-native-brouter';

/**
 * Internal dependencies
 */
import InfoRadioRow from '../../../../components/generic/InfoRadioRow';
import InfoRowControl from '../../../../components/generic/controls/InfoRowControl';
import ListItemMenuControl from '../../../../components/generic/controls/ListItemMenuControl';
import ModalWrapper from '../../../../components/generic/ModalWrapper';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { RoutingPoint } from '../types';
import { selectPoints } from '../selectors';
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

	// const segments = useAppSelector(selectSegmentsArr);

	const theme = useTheme();
	const { t } = useTranslation();

	const points = useAppSelector(selectPoints);

	const resetSegmentPositions = useCallback(() => {

		// ??? TODO


		// if (segments && editPoint.profile && points) {
		// 	const segmentIdx = segments.findIndex((segment) => segment.fromId === editPoint.id);
		// 	if (-1 !== segmentIdx) {
		// 		const point = points.find((p) => p.id === editPoint.id);
		// 		if (JSON.stringify(point?.profile) !== JSON.stringify(editPoint.profile)) {
		// 			const newSegments = [...segments];
		// 			newSegments.splice(segmentIdx, 1, omit(segments[segmentIdx], ['positions']));
		// 			dispatch(setSegments(newSegments, { updateRoutes: true }));
		// 		}
		// 	}
		// }
	}, [
		// segments,
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
