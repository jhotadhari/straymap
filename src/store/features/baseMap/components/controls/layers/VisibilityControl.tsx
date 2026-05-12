/**
 * External dependencies
 */
import { FC, useCallback } from 'react';
import { TouchableHighlight, ViewStyle, TextStyle } from 'react-native';
import { useTheme, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import InfoRowControl from '../../../../../../components/generic/controls/InfoRowControl';
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
	}, [
		layer,
	]);

	return (
		<TouchableHighlight
			underlayColor={theme.colors.elevation.level3}
			onPress={handlePress}
			style={{ borderRadius: theme.roundness, ...style }}
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
		<InfoRowControl
			label={t('visibility')}
			Info={t('hint.maps.visibility')}
		>
			<VisibilityControl
				layer={layer}
				updateLayer={updateLayer}
			/>
		</InfoRowControl>
	);
};

export default VisibilityControl;
