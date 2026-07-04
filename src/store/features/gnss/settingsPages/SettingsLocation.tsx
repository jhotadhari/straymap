/**
 * External dependencies
 */
import React, { FC, useCallback, useContext } from 'react';
import { ScrollView, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectIsActive } from '../selectors';
import { setIsActive } from '../slice';
import { selectIsRecording } from '../../trackRecording/selectors';
import { startRecording, stopRecording } from '../../trackRecording/slice';
import TrackRecordingControl from '../../trackRecording/components/TrackRecordingControl';
import InfoRowControl from '../../../../components/generic/controls/InfoRowControl';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import { MapContext } from '../../../../Context';

const SettingsLocation: FC<{ style?: ViewStyle }> = ({ style }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const { currentMapEventRef } = useContext(MapContext);

	const isGnssActive = useAppSelector(selectIsActive);
	const isRecording = useAppSelector(selectIsRecording);

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
			<InfoRowControl
				label={t('gnss.title')}
				Info={t(isGnssActive ? 'gnss.deactivateGnss' : 'gnss.activateGnss')}
			>
				<ButtonHighlight
					mode={isGnssActive ? 'contained' : 'outlined'}
					compact={true}
					onPress={handleToggleGnss}
					icon={isGnssActive ? 'crosshairs' : 'crosshairs-off'}
					textColor={theme.colors.onBackground}
				>
					{isGnssActive ? t('gnss.deactivateGnss') : t('gnss.activateGnss')}
				</ButtonHighlight>
			</InfoRowControl>

			<InfoRowControl
				label={t('trackRecording.title')}
				Info={t(isRecording ? 'trackRecording.stop' : 'trackRecording.start')}
			>
				<ButtonHighlight
					mode={isRecording ? 'contained' : 'outlined'}
					compact={true}
					onPress={handleToggleRecording}
					icon={isRecording ? 'stop' : 'record-rec'}
					textColor={theme.colors.onBackground}
				>
					{isRecording ? t('trackRecording.stop') : t('trackRecording.start')}
				</ButtonHighlight>
			</InfoRowControl>

			<TrackRecordingControl />
		</ScrollView>
	);
};

export default SettingsLocation;
