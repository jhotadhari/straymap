/**
 * External dependencies
 */
import React, { FC, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import NumericRowControlSegmented from '../../../../../components/generic/controls/NumericRowControlSegmented';
import { roundTo } from '../../../../../lib/utilsLight';
import { ProfileSettingsModalContext } from '../Context';

const RowRatioLock: FC = () => {
	const { t } = useTranslation();
	const { settings, update, currentRatio } = useContext(ProfileSettingsModalContext);

	const numValueActive = settings.ratioMode === 'fixed';

	const handleToggleOption = useCallback(() => {
		if (numValueActive) {
			update({ ratioMode: 'auto' });
		} else {
			// Pre-fill the field with the last auto-ratio.
			update({ ratioMode: 'fixed', ratioValue: currentRatio });
		}
	}, [
		numValueActive,
		update,
		currentRatio,
	]);

	const handleUpdate = useCallback(
		(newValue: number) => {
			update({ ratioValue: newValue });
		},
		[update]
	);

	const rawValue =
		settings.ratioMode === 'fixed'
			? (settings.ratioValue ?? currentRatio ?? '')
			: (currentRatio ?? '');
	const value = 'number' === typeof rawValue ? roundTo(rawValue, 4) : rawValue;

	return (
		<NumericRowControlSegmented
			label={t('altitudeProfile.ratio')}
			buttonLabel={t('altitudeProfile.ratioAuto')}
			numValueActive={numValueActive}
			toggleOption={handleToggleOption}
			value={value}
			onUpdate={handleUpdate}
			numType="float"
			validate={(val) => val > 0}
		/>
	);
};

export default RowRatioLock;
