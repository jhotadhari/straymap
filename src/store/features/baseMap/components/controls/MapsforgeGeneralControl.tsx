/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * Internal dependencies
 */
import ListItemModalControl from '../../../../../components/generic/controls/ListItemModalControl';
import NumericRowControl from '../../../../../components/generic/controls/NumericRowControl';
import IconIcomoon from '../../../../../components/generic/IconIcomoon';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectMapsforgeGeneral } from '../../selectors';
import { setMapsforgeGeneral } from '../../slice';

const validate = (val: number) => val >= 0 && val <= 20;

const MapsforgeGeneralControl = () => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const settings = useAppSelector(selectMapsforgeGeneral);

	const handleLineScale = useCallback((newValue: number) => {
		dispatch(
			setMapsforgeGeneral((current) => ({
				...current,
				lineScale: newValue,
			}))
		);
	}, []);

	const handleTextScale = useCallback((newValue: number) => {
		dispatch(
			setMapsforgeGeneral((current) => ({
				...current,
				textScale: newValue,
			}))
		);
	}, []);

	const handleSymbolScale = useCallback((newValue: number) => {
		dispatch(
			setMapsforgeGeneral((current) => ({
				...current,
				symbolScale: newValue,
			}))
		);
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
			<View style={styles.gap}>
				<Text style={{ marginBottom: 10 }}>{t('baseMap.hint.applyToAllMapsforge')}</Text>

				<NumericRowControl
					label={t('baseMap.lineScale')}
					numType={'float'}
					value={settings.lineScale}
					onUpdate={handleLineScale}
					validate={validate}
					Info={t('baseMap.hint.maps.lineScale')}
				/>

				<NumericRowControl
					label={t('baseMap.textScale')}
					numType={'float'}
					value={settings.textScale}
					onUpdate={handleTextScale}
					validate={validate}
					Info={t('baseMap.hint.maps.textScale')}
				/>

				<NumericRowControl
					label={t('baseMap.symbolScale')}
					numType={'float'}
					value={settings.symbolScale}
					onUpdate={handleSymbolScale}
					validate={validate}
					Info={t('baseMap.hint.maps.symbolScale')}
				/>
			</View>
		</ListItemModalControl>
	);
};

const styles = StyleSheet.create({
	gap: {
		gap: 24,
	},
});

export default MapsforgeGeneralControl;
