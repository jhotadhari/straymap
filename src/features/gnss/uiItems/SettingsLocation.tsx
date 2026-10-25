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
import { ErrorToastContext } from '../../../components/ErrorToast/Context';
import ensureLocationPermission from '../../../lib/locationPermission';

const SettingsLocation: FC<{ style?: ViewStyle }> = ({ style }) => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { showError } = useContext(ErrorToastContext);

	const isGnssActive = useAppSelector(selectIsActive);
	const isRecording = useAppSelector(selectIsRecording);

	const buttonPropsGnss = useButtonProps({ mode: isGnssActive ? 'contained' : 'outlined' });
	const buttonPropsRecording = useButtonProps({ mode: isRecording ? 'contained' : 'outlined' });

	const handleToggleGnss = useCallback(async () => {
		if (!isGnssActive) {
			const granted = await ensureLocationPermission();
			if (!granted) {
				showError(t('gnss.permissionDenied'));
				return;
			}
		}
		dispatch(setIsActive(!isGnssActive));
	}, [
		dispatch,
		isGnssActive,
		showError,
		t,
	]);

	const handleToggleRecording = useCallback(async () => {
		if (isRecording) {
			dispatch(stopRecording());
			return;
		}
		const granted = await ensureLocationPermission();
		if (!granted) {
			showError(t('gnss.permissionDenied'));
			return;
		}
		dispatch(startRecording());
	}, [
		dispatch,
		isRecording,
		showError,
		t,
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
