/**
 * External dependencies
 */
import React, { FC, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { GestureResponderEvent, TouchableHighlight, View } from 'react-native';

/**
 * Internal dependencies
 */
import { MapContext } from '../../../../../Context';
import { useAppSelector } from '../../../../hooks';
import { selectMapUpdateInterval } from '../../../general/selectors';
import { DashboardElementProps, DashboardElement } from '../../../dashboard/types';
import useItemStyle from '../../../dashboard/hooks/useItemStyle';
import { featureRegistry } from '../../../FeatureRegistry';
import { useTranslation } from 'react-i18next';

export interface Options {}

const Display: FC<DashboardElementProps<Options>> = ({ item, style = {}, onPress }) => {
	const handlePress = useMemo(() => {
		if (onPress) {
			return (event: GestureResponderEvent) => onPress(item.key, event);
		}
	}, [onPress, item.key]);

	const theme = useTheme();
	const { t } = useTranslation();

	const { fontSize, minWidth, textAlign } = useItemStyle(item);

	const mapUpdateInterval = useAppSelector(selectMapUpdateInterval);
	const { currentMapEventRef } = useContext(MapContext);

	const [accuracy, setAccuracy] = useState<number | undefined>(undefined);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		intervalRef.current = setInterval(() => {
			setAccuracy((currentMapEventRef?.current as any)?.accuracy);
		}, mapUpdateInterval);
		return () => {
			intervalRef.current && clearInterval(intervalRef.current);
		};
	}, [currentMapEventRef, mapUpdateInterval]);

	const viewStyle = useMemo(() => [{ minWidth }, style], [minWidth, style]);
	const textStyle = useMemo(() => ({ fontSize, textAlign }), [fontSize, textAlign]);

	const showLabel = item.showLabel !== false;
	const showIcon = item.showIcon !== false;

	const elementDef = useMemo(
		() => featureRegistry.getDashboardElements()[item.elementType] as DashboardElement | undefined,
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
					<Text style={textStyle}>
						{accuracy !== undefined ? `${accuracy.toFixed(1)} m` : '-'}
					</Text>
				</View>
			</View>
		</TouchableHighlight>
	);
};

export default Display;
