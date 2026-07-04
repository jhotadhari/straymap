/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { DrawerItem } from '../../drawers/types';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectMapUpdateInterval, selectUnitPrefs } from '../../general/selectors';
import { selectIsActive } from '../selectors';
import { setIsActive } from '../slice';
import { formatCoords, formatSpeed, formatHeightDepth } from '../../../../lib/formatting';
import { MapContext } from '../../../../Context';

const GpsDrawerContent: FC = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const dispatch = useAppDispatch();

	const isActive = useAppSelector(selectIsActive);
	const mapUpdateInterval = useAppSelector(selectMapUpdateInterval);
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const { currentMapEventRef } = useContext(MapContext);

	const [centerLat, setCenterLat] = useState<number | undefined>(undefined);
	const [centerLng, setCenterLng] = useState<number | undefined>(undefined);
	const [altitude, setAltitude] = useState<number | undefined>(undefined);
	const [accuracy, setAccuracy] = useState<number | undefined>(undefined);
	const [speed, setSpeed] = useState<number | undefined>(undefined);

	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		intervalRef.current = setInterval(() => {
			const ev = currentMapEventRef?.current;
			setCenterLat(ev?.center?.[1]);
			setCenterLng(ev?.center?.[0]);
			setAltitude(ev?.center?.[2]);
			setAccuracy((ev as any)?.accuracy);
			setSpeed((ev as any)?.speed);
		}, mapUpdateInterval);
		return () => {
			intervalRef.current && clearInterval(intervalRef.current);
		};
	}, [currentMapEventRef, mapUpdateInterval]);

	const handleToggleGps = useCallback(() => {
		dispatch(setIsActive(!isActive));
	}, [dispatch, isActive]);

	const coordUnit = get(unitPrefs, ['coordinates', 'unit'], 'dd');
	const coordRound = get(unitPrefs, ['coordinates', 'round'], 4);
	const heightUnit = get(unitPrefs, ['heightDepth']);
	const speedUnit = get(unitPrefs, ['speed']);

	return (
		<View style={styles.container}>
			<Text style={theme.fonts.titleMedium}>{t('gnss.title')}</Text>

			<View style={styles.row}>
				<Text>{t('gnss.gpsCoordinates')}:</Text>
				<Text style={styles.value}>
					{centerLat !== undefined && centerLng !== undefined
						? formatCoords(centerLat, centerLng, {
								unit: coordUnit,
								round: coordRound,
							})
						: '-'}
				</Text>
			</View>

			<View style={styles.row}>
				<Text>{t('gnss.gpsAccuracy')}:</Text>
				<Text style={styles.value}>
					{accuracy !== undefined ? `${accuracy.toFixed(1)} m` : '-'}
				</Text>
			</View>

			<View style={styles.row}>
				<Text>{t('gnss.gpsAltitude')}:</Text>
				<Text style={styles.value}>
					{altitude !== undefined ? formatHeightDepth(altitude, heightUnit) : '-'}
				</Text>
			</View>

			<View style={styles.row}>
				<Text>{t('gnss.gpsSpeed')}:</Text>
				<Text style={styles.value}>
					{speed !== undefined ? formatSpeed(speed, speedUnit) : '-'}
				</Text>
			</View>

			<Button
				mode={isActive ? 'outlined' : 'contained'}
				onPress={handleToggleGps}
				style={styles.button}
			>
				{isActive ? t('gnss.deactivateGps') : t('gnss.activateGps')}
			</Button>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 16,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	value: {
		fontWeight: 'bold',
	},
	button: {
		marginTop: 8,
	},
});

export default {
	key: 'gnss',
	label: 'gnss.title',
	DisplayComponent: GpsDrawerContent,
	iconSource: 'crosshairs-gps',
} as DrawerItem;
