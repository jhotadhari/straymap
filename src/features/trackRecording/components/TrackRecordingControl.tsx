/**
 * External dependencies
 */
import React, { FC, useCallback } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
	selectMinDistance,
	selectMinTime,
	selectMinPrecision,
	selectUseDemAltitude,
} from '../selectors';
import { setMinDistance, setMinTime, setMinPrecision, setUseDemAltitude } from '../slice';
import NumericRowControl from '../../../components/generic/controls/NumericRowControl';
import ToggleRowControl from '../../../components/generic/controls/ToggleRowControl';
import { sharedStyles } from '../../dashboard/dashboardWidgets/sharedDeps';

const validateNonNegative = (v: number) => v >= 0;

const TrackRecordingControl: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const minDistance = useAppSelector(selectMinDistance);
	const minTime = useAppSelector(selectMinTime);
	const minPrecision = useAppSelector(selectMinPrecision);
	const useDemAltitude = useAppSelector(selectUseDemAltitude);

	const handleMinDistance = useCallback(
		(val: number) => dispatch(setMinDistance(val)),
		[dispatch]
	);
	const handleMinTime = useCallback((val: number) => dispatch(setMinTime(val)), [dispatch]);
	const handleMinPrecision = useCallback(
		(val: number) => dispatch(setMinPrecision(val)),
		[dispatch]
	);
	const handleUseDemAltitude = useCallback(
		(val: boolean) => dispatch(setUseDemAltitude(val)),
		[dispatch]
	);

	return (
		<View style={sharedStyles.container}>
			<NumericRowControl
				label={t('trackRecording.minDistance')}
				value={minDistance}
				onUpdate={handleMinDistance}
				Info={t('trackRecording.hintMinDistance')}
				numType="float"
				validate={validateNonNegative}
			/>

			<NumericRowControl
				label={t('trackRecording.minTime')}
				value={minTime}
				onUpdate={handleMinTime}
				Info={t('trackRecording.hintMinTime')}
				numType="float"
				validate={validateNonNegative}
			/>

			<NumericRowControl
				label={t('trackRecording.minPrecision')}
				value={minPrecision}
				onUpdate={handleMinPrecision}
				Info={t('trackRecording.hintMinPrecision')}
				numType="float"
				validate={validateNonNegative}
			/>

			<ToggleRowControl
				label={t('trackRecording.useDemAltitude')}
				value={useDemAltitude}
				onToggle={() => handleUseDemAltitude(!useDemAltitude)}
				Info={t('trackRecording.hintUseDemAltitude')}
			/>
		</View>
	);
};

export default TrackRecordingControl;
