/**
 * External dependencies
 */
import React, { FC, ReactNode, useMemo } from 'react';
import {
	GestureResponderEvent,
	TextStyle,
	TouchableHighlight,
	View,
	ViewStyle,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { DashboardWidget, DashboardItem } from '../types';
import { featureRegistry } from '../../FeatureRegistry';

interface ElementFrameProps {
	item: DashboardItem;
	style?: ViewStyle;
	minWidth?: number;
	fontSize: number;
	textAlign?: TextStyle['textAlign'];
	showLabel: boolean;
	showIcon: boolean;
	onPress?: (itemKey: string, event: GestureResponderEvent) => void;
	children: ReactNode;
}

/**
 * Shared wrapper for all dashboard element Displays.
 *
 * Renders the outer TouchableHighlight + View container, an optional label
 * above the value, and an optional icon to the left of the value. The actual
 * value content is passed as children.
 */
const ElementFrame: FC<ElementFrameProps> = ({
	item,
	style = {},
	minWidth,
	fontSize,
	textAlign,
	showLabel,
	showIcon,
	onPress,
	children,
}) => {
	const handlePress = useMemo(() => {
		if (onPress) {
			return (event: GestureResponderEvent) => onPress(item.key, event);
		}
	}, [onPress, item.key]);

	const theme = useTheme();
	const { t } = useTranslation();

	const elementDef = useMemo(
		() =>
			featureRegistry.getDashboardWidgets()[item.elementType] as DashboardWidget | undefined,
		[item.elementType]
	);

	const viewStyle = useMemo(() => [{ minWidth }, style], [minWidth, style]);

	const labelTextStyle = useMemo(
		() => ({ fontSize: Math.max(fontSize - 2, 8), textAlign }) as const,
		[fontSize, textAlign]
	);

	const iconSize = Math.max(fontSize + 2, 12);

	const justifyContent = useMemo(() => {
		switch (textAlign) {
			case 'left':
				return 'flex-start';
			case 'right':
				return 'flex-end';
			default:
				return 'center';
		}
	}, [textAlign]);

	return (
		<TouchableHighlight
			underlayColor={theme.colors.primaryContainer}
			onPress={handlePress}
		>
			<View style={viewStyle}>
				{showLabel && elementDef?.label && (
					<Text style={labelTextStyle}>{t(elementDef.label)}</Text>
				)}
				<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: justifyContent }}>
					{showIcon && elementDef?.Icon && (
						<View style={{ marginRight: 3 }}>
							<elementDef.Icon
								color={theme.colors.onSurface}
								size={iconSize}
							/>
						</View>
					)}
					{children}
				</View>
			</View>
		</TouchableHighlight>
	);
};

export default ElementFrame;
