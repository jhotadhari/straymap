/**
 * External dependencies
 */
import React, { FC, useCallback, useContext } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectIsCenterActive, selectRecenterDelaySec } from '../../selectors';
import { setIsActive, setIsCenterActive, setRecenterDelaySec } from '../../slice';
import NumericRowControl from '../../../../components/generic/controls/NumericRowControl';
import ToggleRowControl from '../../../../components/generic/controls/ToggleRowControl';
import { sharedStyles } from '../../../dashboard/dashboardWidgets/sharedDeps';
import { ErrorToastContext } from '../../../../components/ErrorToast/Context';
import ensureLocationPermission from '../../../../lib/locationPermission';

const validateNonNegative = (v: number) => v >= 0;

/**
 * Center-mode settings: on/off toggle plus the panned-away re-centering
 * delay in seconds. Enabling center mode also turns GNSS on.
 */
const GnssCenterControl: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { showError } = useContext(ErrorToastContext);

	const isCenterActive = useAppSelector(selectIsCenterActive);
	const recenterDelaySec = useAppSelector(selectRecenterDelaySec);

	const handleToggleCenterMode = useCallback(async () => {
		if (isCenterActive) {
			dispatch(setIsCenterActive(false));
			return;
		}
		const granted = await ensureLocationPermission();
		if (!granted) {
			showError(t('gnss.permissionDenied'));
			return;
		}
		dispatch(setIsActive(true));
		dispatch(setIsCenterActive(true));
	}, [
		dispatch,
		isCenterActive,
		showError,
		t,
	]);

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

			{isCenterActive && (
				<NumericRowControl
					label={t('gnss.recenterDelay')}
					value={recenterDelaySec}
					onUpdate={handleRecenterDelaySec}
					Info={t('gnss.hintRecenterDelay')}
					numType="float"
					validate={validateNonNegative}
				/>
			)}
		</View>
	);
};

export default GnssCenterControl;
