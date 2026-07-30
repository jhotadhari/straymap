/**
 * External dependencies
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * Internal dependencies
 */
import ListItemModalControl from '../../../../components/generic/wrapper/ListItemModalControl';
import NumericRowControl from '../../../../components/generic/controls/NumericRowControl';
import IconCustom from '../../../../components/generic/primitives/IconCustom';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectMapsforgeGeneral } from '../../selectors';
import { setMapsforgeGeneral } from '../../slice';
import type { MapsforgeGeneral } from '../../types';

const validate = (val: number) => val >= 0 && val <= 20;

const isEqual = (a: MapsforgeGeneral, b: MapsforgeGeneral) =>
	a.lineScale === b.lineScale &&
	a.textScale === b.textScale &&
	a.symbolScale === b.symbolScale;

const MapsforgeGeneralControl = () => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const storeSettings = useAppSelector(selectMapsforgeGeneral);

	// Snapshot store values into local editing state so keystrokes (including
	// partial floats like "1.") don't dispatch to the store and trigger a full
	// map destroy/recreate cycle on every character.
	const [localSettings, setLocalSettings] = useState(storeSettings);
	const localSettingsRef = useRef(localSettings);
	localSettingsRef.current = localSettings;

	// Re-sync local state from the store when an external change occurs
	// (e.g. storage restore, another control).  The setMapsforgeGeneral
	// reducer creates a new object reference, so this effect is a reliable
	// "store changed" signal.
	useEffect(() => {
		setLocalSettings(storeSettings);
	}, [storeSettings]);

	const handleLineScale = useCallback(
		(newValue: number) =>
			setLocalSettings((prev) => ({ ...prev, lineScale: newValue })),
		[]
	);

	const handleTextScale = useCallback(
		(newValue: number) =>
			setLocalSettings((prev) => ({ ...prev, textScale: newValue })),
		[]
	);

	const handleSymbolScale = useCallback(
		(newValue: number) =>
			setLocalSettings((prev) => ({ ...prev, symbolScale: newValue })),
		[]
	);

	// Commit local state to the store only when the modal is dismissed,
	// and only if anything actually changed.  Ref-based reads keep the
	// callback stable so ListItemModalControl's effect doesn't re-fire.
	const storeSettingsRef = useRef(storeSettings);
	storeSettingsRef.current = storeSettings;
	const handleAfterDismiss = useCallback(() => {
		const current = localSettingsRef.current;
		if (!isEqual(current, storeSettingsRef.current)) {
			dispatch(setMapsforgeGeneral(current));
		}
	}, [dispatch]);

	return (
		<ListItemModalControl
			anchorLabel={t('baseMap.mapsforgeGeneral')}
			anchorIcon={(props) => (
				<IconCustom
					size={25}
					name="mapsforge_puzzle_cog"
					{...props}
				/>
			)}
			header={t('baseMap.mapsforgeGeneral')}
			afterDismiss={handleAfterDismiss}
		>
			<View style={styles.gap}>
				<Text style={styles.applyHint}>{t('baseMap.hint.applyToAllMapsforge')}</Text>

				<NumericRowControl
					label={t('baseMap.lineScale')}
					numType={'float'}
					value={localSettings.lineScale}
					onUpdate={handleLineScale}
					validate={validate}
					Info={t('baseMap.hint.lineScale')}
				/>

				<NumericRowControl
					label={t('baseMap.textScale')}
					numType={'float'}
					value={localSettings.textScale}
					onUpdate={handleTextScale}
					validate={validate}
					Info={t('baseMap.hint.textScale')}
				/>

				<NumericRowControl
					label={t('baseMap.symbolScale')}
					numType={'float'}
					value={localSettings.symbolScale}
					onUpdate={handleSymbolScale}
					validate={validate}
					Info={t('baseMap.hint.symbolScale')}
				/>
			</View>
		</ListItemModalControl>
	);
};

const styles = StyleSheet.create({
	gap: {
		gap: 24,
	},
	applyHint: {
		marginBottom: 10,
	},
});

export default MapsforgeGeneralControl;
