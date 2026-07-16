/**
 * External dependencies
 */
import { FC, useCallback, useMemo } from 'react';
import { TouchableHighlight, ViewStyle } from 'react-native';
import { useTheme, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../../components/generic/infoWrapper/InfoLabelRow';
import { LayerConfig } from '../../../types';

const VisibilityControl: FC<{
	style?: ViewStyle;
	layer: LayerConfig;
	updateLayer: (newLayer: LayerConfig) => void;
}> = ({ style, layer, updateLayer }) => {
	const theme = useTheme();

	const handlePress = useCallback(() => {
		updateLayer({
			...layer,
			visible: !layer.visible,
		});
	}, [layer, updateLayer]);

	const styleTouchable = useMemo(
		() => ({ borderRadius: theme.roundness, ...style }),
		[theme, style]
	);

	return (
		<TouchableHighlight
			underlayColor={theme.colors.elevation.level3}
			onPress={handlePress}
			style={styleTouchable}
		>
			<Icon
				source={layer?.visible ? 'eye-outline' : 'eye-off-outline'}
				size={25}
			/>
		</TouchableHighlight>
	);
};

export const VisibilityRowControl: FC<{
	layer: LayerConfig;
	updateLayer: (newLayer: LayerConfig) => void;
}> = ({ layer, updateLayer }) => {
	const { t } = useTranslation();
	return (
		<InfoLabelRow
			label={t('baseMap.visibility')}
			Info={t('baseMap.hint.visibility')}
		>
			<VisibilityControl
				layer={layer}
				updateLayer={updateLayer}
			/>
		</InfoLabelRow>
	);
};

export default VisibilityControl;
