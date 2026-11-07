/**
 * External dependencies
 */
import React, { FC, useCallback } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectIsCenterActive, selectRecenterDelaySec } from '../../selectors';
import { setIsCenterActive, setRecenterDelaySec } from '../../slice';
import NumericRowControl from '../../../../components/generic/controls/NumericRowControl';
import ToggleRowControl from '../../../../components/generic/controls/ToggleRowControl';
import { sharedStyles } from '../../../dashboard/dashboardWidgets/sharedDeps';

const validateNonNegative = (v: number) => v >= 0;

/**
 * Center-mode settings: on/off toggle plus the panned-away re-centering
 * delay in seconds. Center mode is an independent persisted setting —
 * toggling it does not touch GNSS, and while GNSS is off it simply waits
 * for a fix.
 */
const GnssCenterControl: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const isCenterActive = useAppSelector(selectIsCenterActive);
	const recenterDelaySec = useAppSelector(selectRecenterDelaySec);

	const handleToggleCenterMode = useCallback(() => {
		// Center mode is a standalone persisted setting — toggling it must
		// not touch GNSS. While GNSS is off it simply waits for a fix.
		dispatch(setIsCenterActive(!isCenterActive));
	}, [dispatch, isCenterActive]);

	const handleRecenterDelaySec = useCallback(
		(val: number) => dispatch(setRecenterDelaySec(val)),
		[dispatch]
	);

	return (
		<View style={sharedStyles.container}>
			<ToggleRowControl
				label={t('gnss.centerMode')}
				value={isCenterActive}
				onToggle={handleToggleCenterMode}
				Info={t('gnss.hintCenterMode')}
			/>

			<NumericRowControl
				label={t('gnss.recenterDelay')}
				value={recenterDelaySec}
				onUpdate={handleRecenterDelaySec}
				Info={t('gnss.hintRecenterDelay')}
				numType="float"
				validate={validateNonNegative}
				disabled={!isCenterActive}
			/>
		</View>
	);
};

export default GnssCenterControl;
