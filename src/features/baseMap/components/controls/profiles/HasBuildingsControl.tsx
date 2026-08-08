/**
 * External dependencies
 */
import { FC, useCallback } from 'react';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import ToggleRowControl from '../../../../../components/generic/controls/ToggleRowControl';
import { MapsforgeProfile } from '../../../types';
import { useAppDispatch, useAppSelector } from '../../../../../store/hooks';
import { selectMapsforgeProfileTemp } from '../../../selectors';
import { setMapsforgeProfileTemp } from '../../../slice';
import { sharedStyles } from '../../../../../sharedStyles';

const HasBuildingsControl: FC<{}> = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const dispatch = useAppDispatch();
	const profileTemp = useAppSelector(selectMapsforgeProfileTemp);

	const handleChange = useCallback(() => {
		dispatch(
			setMapsforgeProfileTemp(
				(profileTemp) =>
					({
						...(profileTemp ?? {}),
						hasBuildings: !profileTemp?.hasBuildings,
					}) as MapsforgeProfile
			)
		);
	}, [
		dispatch,
	]);

	return (
		<ToggleRowControl
			label={t('baseMap.hasBuildings')}
			value={profileTemp?.hasBuildings ?? false}
			onToggle={handleChange}
			innerStyle={sharedStyles.alignStart}
			labelStyle={theme.fonts.bodyMedium}
		/>
	);
};

export default HasBuildingsControl;
