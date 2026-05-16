/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ListItemModalControl from '../../../../../components/generic/controls/ListItemModalControl';
import { NumericRowControl } from '../../../../../components/generic/controls/NumericRowControls';
import IconIcomoon from '../../../../../components/generic/IconIcomoon';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectMapsforgeGeneral } from '../../selectors';
import { setMapsforgeGeneral } from '../../baseMapSlice';
import { MapsforgeGeneral } from '../../types';

const MapsforgeGeneralControl = () => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const settings = useAppSelector(selectMapsforgeGeneral);

	const handleChange = useCallback((newSettings: MapsforgeGeneral) => {
		dispatch(setMapsforgeGeneral(newSettings));
	}, []);

	return (
		<ListItemModalControl
			anchorLabel={t('baseMap.mapsforgeGeneral')}
			anchorIcon={(props) => (
				<IconIcomoon
					size={25}
					name="mapsforge_puzzle_cog"
					{...props}
				/>
			)}
			header={t('baseMap.mapsforgeGeneral')}
			hasHeaderBackPress={true}
		>
			<Text style={{ marginBottom: 10 }}>{t('baseMap.hint.applyToAllMapsforge')}</Text>
			<Text style={{ marginBottom: 10 }}>{t('baseMap.hint.changeNeedsRestart')}</Text>

			<NumericRowControl
				label={t('baseMap.lineScale')}
				optKey={'lineScale'}
				numType={'float'}
				options={settings}
				setOptions={handleChange}
				validate={(val) => val >= 0 && val <= 20}
				Info={t('baseMap.hint.maps.lineScale')}
			/>

			<NumericRowControl
				label={t('baseMap.textScale')}
				optKey={'textScale'}
				numType={'float'}
				options={settings}
				setOptions={handleChange}
				validate={(val) => val >= 0 && val <= 20}
				Info={t('baseMap.hint.maps.textScale')}
			/>

			<NumericRowControl
				label={t('baseMap.symbolScale')}
				optKey={'symbolScale'}
				numType={'float'}
				options={settings}
				setOptions={handleChange}
				validate={(val) => val >= 0 && val <= 20}
				Info={t('baseMap.hint.maps.symbolScale')}
			/>
		</ListItemModalControl>
	);
};

export default MapsforgeGeneralControl;
