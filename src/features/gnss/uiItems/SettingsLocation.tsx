/**
 * External dependencies
 */
import React, { FC, useCallback, useContext } from 'react';
import { ScrollView, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectIsActive } from '../selectors';
import { setIsActive } from '../slice';
import { selectIsRecording } from '../../trackRecording/selectors';
import { startRecording, stopRecording } from '../../trackRecording/slice';
import TrackRecordingControl from '../../trackRecording/components/TrackRecordingControl';
import InfoLabelRow from '../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../compose/useButtonProps';
import { MapContext } from '../../../Context';

const SettingsLocation: FC<{ style?: ViewStyle }> = ({ style }) => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { currentMapEventRef } = useContext(MapContext);

	const isGnssActive = useAppSelector(selectIsActive);
	const isRecording = useAppSelector(selectIsRecording);

	const buttonPropsGnss = useButtonProps({ mode: isGnssActive ? 'contained' : 'outlined' });
	const buttonPropsRecording = useButtonProps({ mode: isRecording ? 'contained' : 'outlined' });

	const handleToggleGnss = useCallback(() => {
		dispatch(setIsActive(!isGnssActive));
	}, [dispatch, isGnssActive]);

	const handleToggleRecording = useCallback(() => {
		if (isRecording) {
			dispatch(stopRecording());
		} else {
			const ev = currentMapEventRef?.current;
			const lng = ev?.center?.[0];
			const lat = ev?.center?.[1];
			if (lng !== undefined && lat !== undefined) {
				dispatch(
					startRecording({
						lng,
						lat,
						z: ev?.center?.[2],
					})
				);
			}
		}
	}, [
		dispatch,
		isRecording,
		currentMapEventRef,
	]);

	return (
		<ScrollView style={style}>
			<InfoLabelRow
				label={t('gnss.title')}
				Info={t(isGnssActive ? 'gnss.deactivateGnss' : 'gnss.activateGnss')}
			>
				<ButtonHighlight
					{...buttonPropsGnss}
					compact={true}
					onPress={handleToggleGnss}
					icon={isGnssActive ? 'crosshairs-gps' : 'crosshairs-off'}
				>
					{isGnssActive ? t('gnss.deactivateGnss') : t('gnss.activateGnss')}
				</ButtonHighlight>
			</InfoLabelRow>

			<InfoLabelRow
				label={t('trackRecording.title')}
				Info={t(isRecording ? 'trackRecording.stop' : 'trackRecording.start')}
			>
				<ButtonHighlight
					{...buttonPropsRecording}
					compact={true}
					onPress={handleToggleRecording}
					icon={isRecording ? 'stop' : 'record-rec'}
				>
					{isRecording ? t('trackRecording.stop') : t('trackRecording.start')}
				</ButtonHighlight>
			</InfoLabelRow>

			<TrackRecordingControl />
		</ScrollView>
	);
};

export default SettingsLocation;
