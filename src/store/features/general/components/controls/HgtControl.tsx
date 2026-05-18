/**
 * External dependencies
 */
import React, { Fragment, useState } from 'react';
import { View } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import ListItemModalControl from '../../../../../components/generic/controls/ListItemModalControl';
import { NumericRowControl } from '../../../../../components/generic/controls/NumericRowControlsNew';
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
} from '../../../baseMap/baseMapSlice';
import { selectAppDirs } from '../../../dirs/selectors';

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
			hasHeaderBackPress={true}
		>
			<HgtSourceRowControl
				options={{ hgtDirPath }}
				setOptions={(options) => {
					dispatch(setHgtDirPath(get(options, 'hgtDirPath') || undefined));
				}}
				optKey={'hgtDirPath'}
				dirs={get(appDirs, 'dem', [])}
				onlyThreeSeconds={true}
			/>

			<InfoRadioRow
				opt={{
					label: t('general.hgtInterpolation'),
					key: 'hgtInterpolation',
				}}
				onPress={() => dispatch(setHgtInterpolation(!hgtInterpolation))}
				labelStyle={theme.fonts.bodyMedium}
				labelExtractor={(a) => a.label}
				status={hgtInterpolation ? 'checked' : 'unchecked'}
				radioAlign={'left'}
				Info={t('general.hint.hgtInterpolation')}
			/>

			<InfoRowControl
				label={showAdvanced ? t('advancedSettingsHide') : t('advancedSettingsShow')}
				onLabelPress={() => setShowAdvanced(!showAdvanced)}
			/>
			{showAdvanced && (
				<Fragment>
					<NumericRowControl
						label={t('general.hgtReadFileRate')}
						value={hgtReadFileRate}
						onUpdate={(newValue) =>
							dispatch(setHgtReadFileRate(newValue))
						}
						validate={(val) => val >= 0 && val <= 20000}
						Info={t('general.hint.hgtReadFileRate')}
					/>

					<NumericRowControl
						label={t('general.hgtFileInfoPurgeThreshold')}
						value={hgtFileInfoPurgeThreshold}
						onUpdate={(newValue) =>
							dispatch(setHgtFileInfoPurgeThreshold(newValue))
						}
						validate={(val) => val >= 0 && val <= 200}
						Info={t('general.hint.hgtFileInfoPurgeThreshold')}
					/>
				</Fragment>
			)}
		</ListItemModalControl>
	);
};

export default HgtControl;
