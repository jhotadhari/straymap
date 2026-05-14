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
			anchorLabel={t('settings.mapsforgeGeneral')}
			anchorIcon={(props) => (
				<IconIcomoon
					size={25}
					name="mapsforge_puzzle_cog"
					{...props}
				/>
			)}
			header={t('settings.mapsforgeGeneral')}
			hasHeaderBackPress={true}
		>
			<Text style={{ marginBottom: 10 }}>{t('hint.applyToAllMapsforge')}</Text>
			<Text style={{ marginBottom: 10 }}>{t('hint.changeNeedsRestart')}</Text>

			<NumericRowControl
				label={t('lineScale')}
				optKey={'lineScale'}
				numType={'float'}
				options={settings}
				setOptions={handleChange}
				validate={(val) => val >= 0 && val <= 20 }
				Info={t('hint.maps.lineScale')}
			/>

			<NumericRowControl
				label={t('textScale')}
				optKey={'textScale'}
				numType={'float'}
				options={settings}
				setOptions={handleChange}
				validate={(val) => val >= 0 && val <= 20 }
				Info={t('hint.maps.textScale')}
			/>

			<NumericRowControl
				label={t('symbolScale')}
				optKey={'symbolScale'}
				numType={'float'}
				options={settings}
				setOptions={handleChange}
				validate={(val) => val >= 0 && val <= 20 }
				Info={t('hint.maps.symbolScale')}
			/>
		</ListItemModalControl>
	);
};

export default MapsforgeGeneralControl;
