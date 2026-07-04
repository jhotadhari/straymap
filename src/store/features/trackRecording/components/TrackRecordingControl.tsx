/**
 * External dependencies
 */
import React, { FC, useCallback } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectMinDistance, selectMinTime, selectMinPrecision } from '../selectors';
import { setMinDistance, setMinTime, setMinPrecision } from '../slice';
import NumericRowControl from '../../../../components/generic/controls/NumericRowControl';
import { sharedStyles } from '../../dashboard/dashboardWidgets/sharedDeps';

const TrackRecordingControl: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const minDistance = useAppSelector(selectMinDistance);
	const minTime = useAppSelector(selectMinTime);
	const minPrecision = useAppSelector(selectMinPrecision);

	const handleMinDistance = useCallback(
		(val: number) => dispatch(setMinDistance(val)),
		[dispatch]
	);
	const handleMinTime = useCallback((val: number) => dispatch(setMinTime(val)), [dispatch]);
	const handleMinPrecision = useCallback(
		(val: number) => dispatch(setMinPrecision(val)),
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
				validate={(v) => v >= 0}
			/>

			<NumericRowControl
				label={t('trackRecording.minTime')}
				value={minTime}
				onUpdate={handleMinTime}
				Info={t('trackRecording.hintMinTime')}
				numType="float"
				validate={(v) => v >= 0}
			/>

			<NumericRowControl
				label={t('trackRecording.minPrecision')}
				value={minPrecision}
				onUpdate={handleMinPrecision}
				Info={t('trackRecording.hintMinPrecision')}
				numType="float"
				validate={(v) => v >= 0}
			/>
		</View>
	);
};

export default TrackRecordingControl;
