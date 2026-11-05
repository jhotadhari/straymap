/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo } from 'react';
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
import { selectUnitPrefs } from '../../general/selectors';
import { formatDistanceUnit, metersToUnit, unitToMeters } from '../../../lib/formatting';
import { roundTo } from '../../../lib/utilsLight';
import NumericRowControl from '../../../components/generic/controls/NumericRowControl';
import ToggleRowControl from '../../../components/generic/controls/ToggleRowControl';
import InfoLabelRow from '../../../components/generic/infoWrapper/InfoLabelRow';
import RecordingLineWidthControl from './controls/RecordingLineWidthControl';
import { sharedStyles } from '../../dashboard/dashboardWidgets/sharedDeps';

const validateNonNegative = (v: number) => v >= 0;

const TrackRecordingControl: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const minDistance = useAppSelector(selectMinDistance);
	const minTime = useAppSelector(selectMinTime);
	const minPrecision = useAppSelector(selectMinPrecision);
	const useDemAltitude = useAppSelector(selectUseDemAltitude);
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const distanceUnitPref = unitPrefs?.distance;
	const distanceUnit = formatDistanceUnit(distanceUnitPref, true);

	// Stored in meters but shown in the user's distance unit
	// (metric → m, imperial → ft, nautical → nm).
	const minDistanceDisplay = useMemo(
		() => roundTo(metersToUnit(minDistance, distanceUnitPref, true), distanceUnitPref.round),
		[minDistance, distanceUnitPref]
	);
	const minPrecisionDisplay = useMemo(
		() => roundTo(metersToUnit(minPrecision, distanceUnitPref, true), distanceUnitPref.round),
		[minPrecision, distanceUnitPref]
	);

	const handleMinDistance = useCallback(
		(val: number) => dispatch(setMinDistance(unitToMeters(val, distanceUnitPref, true))),
		[dispatch, distanceUnitPref]
	);
	const handleMinTime = useCallback((val: number) => dispatch(setMinTime(val)), [dispatch]);
	const handleMinPrecision = useCallback(
		(val: number) => dispatch(setMinPrecision(unitToMeters(val, distanceUnitPref, true))),
		[dispatch, distanceUnitPref]
	);
	const handleUseDemAltitude = useCallback(
		(val: boolean) => dispatch(setUseDemAltitude(val)),
		[dispatch]
	);

	return (
		<View style={sharedStyles.container}>
			<NumericRowControl
				label={t('trackRecording.minDistance', { unit: distanceUnit })}
				value={minDistanceDisplay}
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
				label={t('trackRecording.minPrecision', { unit: distanceUnit })}
				value={minPrecisionDisplay}
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

			<InfoLabelRow
				label={t('trackRecording.lineWidth')}
				Info={t('trackRecording.hintLineWidth')}
			>
				<RecordingLineWidthControl />
			</InfoLabelRow>
		</View>
	);
};

export default TrackRecordingControl;
