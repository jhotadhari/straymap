/**
 * External dependencies
 */
import { FC, useCallback, useMemo } from 'react';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import InfoRadioRow from '../../../../../../components/generic/InfoRadioRow';
import { MapsforgeProfile } from '../../../types';
import { OptionBase } from '../../../../../../types';
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { selectMapsforgeProfileTemp } from '../../../selectors';
import { setMapsforgeProfileTemp } from '../../../slice';

const labelExtractor = (a: { label: string }) => a.label;

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
	}, []);

	const opt: OptionBase = useMemo(
		() => ({
			label: t('baseMap.hasBuildings'),
			key: 'hasBuildings',
		}),
		[t]
	);
	return (
		<InfoRadioRow
			opt={opt}
			onPress={handleChange}
			labelStyle={theme.fonts.bodyMedium}
			labelExtractor={labelExtractor}
			status={profileTemp?.hasBuildings ? 'checked' : 'unchecked'}
			radioAlign={'left'}
		/>
	);
};

export default HasBuildingsControl;
