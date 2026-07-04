/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { GestureResponderEvent, TouchableHighlight, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { DashboardElementProps, DashboardElement } from '../../../dashboard/types';
import useItemStyle from '../../../dashboard/hooks/useItemStyle';
import { featureRegistry } from '../../../FeatureRegistry';
import { useAppSelector } from '../../../../hooks';
import { selectIsRecording, selectActiveLineId } from '../../selectors';
import { queryLineGeom } from '../../../lines/db/queryFns';
import { formatDistance } from '../../../../../lib/formatting';
import { selectUnitPrefs } from '../../../general/selectors';
import { get } from 'lodash-es';

export interface Options {
	statField: string;
}

const STAT_LABELS: Record<string, string> = {
	distance: 'trackRecording.distance',
	duration: 'trackRecording.duration',
	uphill: 'trackRecording.uphill',
	downhill: 'trackRecording.downhill',
	speed: 'trackRecording.speed',
	avgSpeed: 'trackRecording.avgSpeed',
	pointCount: 'trackRecording.pointCount',
};

const Display: FC<DashboardElementProps<Options>> = ({
	item,
	style = {},
	onPress,
}) => {
	const handlePress = useMemo(() => {
		if (onPress) {
			return (event: GestureResponderEvent) => onPress(item.key, event);
		}
	}, [onPress, item.key]);

	const theme = useTheme();
	const { t } = useTranslation();

	const { fontSize, minWidth, textAlign } = useItemStyle(item);
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const isRecording = useAppSelector(selectIsRecording);
	const activeLineId = useAppSelector(selectActiveLineId);

	const statField = item?.options?.statField ?? 'distance';

	// Fetch line geometry for stats computation
	const lineId = (isRecording ? activeLineId : null) ?? -1;
	const { data: line } = useQuery({
		queryKey: ['lineGeom', lineId, 'trackingStats'],
		queryFn: queryLineGeom,
		enabled: !!isRecording && !!activeLineId,
		gcTime: 1000 * 10,
	});

	const statValue = useMemo(() => {
		if (!line?.geometry?.coordinates) {
			return null;
		}
		const coords = line.geometry.coordinates;

		switch (statField) {
			case 'distance': {
				// Compute length via SpatiaLite would require a separate query.
				// For the dashboard we approximate with a simple Haversine sum.
				const R = 6371000;
				const toRad = (deg: number) => (deg * Math.PI) / 180;
				let total = 0;
				for (let i = 1; i < coords.length; i++) {
					const [lng1, lat1] = coords[i - 1];
					const [lng2, lat2] = coords[i];
					const dLat = toRad(lat2 - lat1);
					const dLng = toRad(lng2 - lng1);
					const a =
						Math.sin(dLat / 2) * Math.sin(dLat / 2) +
						Math.cos(toRad(lat1)) *
							Math.cos(toRad(lat2)) *
							Math.sin(dLng / 2) *
							Math.sin(dLng / 2);
					total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
				}
				const distUnit = get(unitPrefs, ['distance']);
				return formatDistance(total, distUnit);
			}
			case 'pointCount':
				return `${coords.length}`;
			case 'speed':
			case 'avgSpeed':
				return '-';
			case 'duration':
				return '-';
			default:
				return '-';
		}
	}, [line, statField, unitPrefs]);

	const viewStyle = useMemo(() => [{ minWidth }, style], [minWidth, style]);
	const textStyle = useMemo(() => ({ fontSize, textAlign }), [fontSize, textAlign]);

	const showLabel = item.showLabel !== false;
	const showIcon = item.showIcon !== false;

	const elementDef = useMemo(
		() =>
			featureRegistry.getDashboardElements()[item.elementType] as
				| DashboardElement
				| undefined,
		[item.elementType]
	);

	const labelTextStyle = useMemo(
		() => ({ fontSize: Math.max(fontSize - 2, 8), textAlign } as const),
		[fontSize, textAlign]
	);

	const iconSize = Math.max(fontSize + 2, 12);

	return (
		<TouchableHighlight
			underlayColor={theme.colors.primaryContainer}
			onPress={handlePress}
		>
			<View style={viewStyle}>
				{showLabel && elementDef?.label && (
					<Text style={labelTextStyle}>{t(elementDef.label)}</Text>
				)}
				<View style={{ flexDirection: 'row', alignItems: 'center' }}>
					{showIcon && elementDef?.Icon && (
						<View style={{ marginRight: 3 }}>
							<elementDef.Icon
								color={theme.colors.onSurface}
								size={iconSize}
							/>
						</View>
					)}
					<Text style={textStyle}>{statValue ?? '-'}</Text>
				</View>
			</View>
		</TouchableHighlight>
	);
};

export default Display;
