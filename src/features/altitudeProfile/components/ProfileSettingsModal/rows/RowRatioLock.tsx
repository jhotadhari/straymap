/**
 * External dependencies
 */
import React, { FC, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import NumericRowControl from '../../../../../components/generic/controls/NumericRowControl';
import { useAppDispatch } from '../../../../../store/hooks';
import { roundTo } from '../../../../../lib/utilsLight';
import { setProfileSettings } from '../../../slice';
import { ProfileSettingsModalContext } from '../Context';

/**
 * The ratio is always per-profile ("custom"): read from and written to
 * the profile's own entry, independent of the Default/Custom mode.
 * The field is always editable; the button resets the value to the
 * natural fit ratio and requests a full viewport reset.
 */
const RowRatioLock: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();
	const { profileKey, settings, currentRatio, fitRatio, onFitScreen } = useContext(
		ProfileSettingsModalContext
	);

	const handleFitScreen = useCallback(() => {
		dispatch(setProfileSettings({ key: profileKey, settings: { ratioValue: fitRatio } }));
		onFitScreen && onFitScreen();
	}, [
		dispatch,
		profileKey,
		fitRatio,
		onFitScreen,
	]);

	const handleUpdate = useCallback(
		(newValue: number) => {
			dispatch(setProfileSettings({ key: profileKey, settings: { ratioValue: newValue } }));
		},
		[dispatch, profileKey]
	);

	const rawValue = currentRatio;
	const value =
		'number' === typeof rawValue && isFinite(rawValue) ? roundTo(rawValue, 4) : rawValue;

	return (
		<NumericRowControl
			label={t('altitudeProfile.ratio')}
			buttonLabel={t('altitudeProfile.ratioFit')}
			onButtonPress={handleFitScreen}
			value={settings.followMap ? undefined : value}
			onUpdate={handleUpdate}
			numType="float"
			validate={(val) => val > 0}
			disabled={settings.followMap}
		/>
	);
};

export default RowRatioLock;
