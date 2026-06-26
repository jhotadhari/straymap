/**
 * External dependencies
 */
import React, { Fragment, useCallback, useState } from 'react';
import { View } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import ListItemModalControl from '../../../../../components/generic/controls/ListItemModalControl';
import NumericRowControl from '../../../../../components/generic/controls/NumericRowControl';
import HgtSourceRowControl from '../../../../../components/generic/controls/HgtSourceRowControl';
import InfoRadioRow from '../../../../../components/generic/InfoRadioRow';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import {
	selectHgtDirPath,
	selectHgtFileInfoPurgeThreshold,
	selectHgtInterpolation,
	selectHgtReadFileRate,
} from '../../../baseMap/selectors';
import {
	setHgtDirPath,
	setHgtFileInfoPurgeThreshold,
	setHgtInterpolation,
	setHgtReadFileRate,
} from '../../../baseMap/slice';
import { selectAppDirs } from '../../../dirs/selectors';

const validateHgtReadFileRate = (val: number) => val >= 0 && val <= 20000;
const validateHgtFileInfoPurgeThreshold = (val: number) => val >= 0 && val <= 200;

const HgtControl = () => {
	const { t } = useTranslation();

	const theme = useTheme();

	const appDirs = useAppSelector(selectAppDirs);

	const [showAdvanced, setShowAdvanced] = useState(false);

	const dispatch = useAppDispatch();

	const hgtDirPath = useAppSelector(selectHgtDirPath);
	const hgtReadFileRate = useAppSelector(selectHgtReadFileRate);
	const hgtInterpolation = useAppSelector(selectHgtInterpolation);
	const hgtFileInfoPurgeThreshold = useAppSelector(selectHgtFileInfoPurgeThreshold);

	const handleSetHgtDirPath = useCallback(
		(options: object) => {
			dispatch(setHgtDirPath(get(options, 'hgtDirPath') || undefined));
		},
		[dispatch]
	);

	const handleToggleHgtInterpolation = useCallback(() => {
		dispatch(setHgtInterpolation(!hgtInterpolation));
	}, [dispatch, hgtInterpolation]);

	const handleToggleShowAdvanced = useCallback(() => {
		setShowAdvanced((prev) => !prev);
	}, []);

	const handleHgtReadFileRateUpdate = useCallback(
		(newValue: number) => dispatch(setHgtReadFileRate(newValue)),
		[dispatch]
	);

	const handleHgtFileInfoPurgeThresholdUpdate = useCallback(
		(newValue: number) => dispatch(setHgtFileInfoPurgeThreshold(newValue)),
		[dispatch]
	);

	return (
		<ListItemModalControl
			anchorLabel={t('dem')}
			anchorIcon={({ color, style }) => (
				<View style={style}>
					<Icon
						source="elevation-rise"
						color={color}
						size={25}
					/>
				</View>
			)}
			header={t('dem')}
		>
			<HgtSourceRowControl
				options={{ hgtDirPath }}
				setOptions={handleSetHgtDirPath}
				optKey={'hgtDirPath'}
				dirs={get(appDirs, 'dem', [])}
				onlyThreeSeconds={true}
			/>

			<InfoRadioRow
				opt={{
					label: t('general.hgtInterpolation'),
					key: 'hgtInterpolation',
				}}
				onPress={handleToggleHgtInterpolation}
				labelStyle={theme.fonts.bodyMedium}
				labelExtractor={(a) => a.label}
				status={hgtInterpolation ? 'checked' : 'unchecked'}
				radioAlign={'left'}
				Info={t('general.hint.hgtInterpolation')}
			/>

			<InfoRowControl
				label={showAdvanced ? t('advancedSettingsHide') : t('advancedSettingsShow')}
				onLabelPress={handleToggleShowAdvanced}
			/>
			{showAdvanced && (
				<Fragment>
					<NumericRowControl
						label={t('general.hgtReadFileRate')}
						value={hgtReadFileRate}
						onUpdate={handleHgtReadFileRateUpdate}
						validate={validateHgtReadFileRate}
						Info={t('general.hint.hgtReadFileRate')}
					/>

					<NumericRowControl
						label={t('general.hgtFileInfoPurgeThreshold')}
						value={hgtFileInfoPurgeThreshold}
						onUpdate={handleHgtFileInfoPurgeThresholdUpdate}
						validate={validateHgtFileInfoPurgeThreshold}
						Info={t('general.hint.hgtFileInfoPurgeThreshold')}
					/>
				</Fragment>
			)}
		</ListItemModalControl>
	);
};

export default HgtControl;
