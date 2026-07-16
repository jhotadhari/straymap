/**
 * External dependencies
 */
import { ReactNode, useMemo } from 'react';
import {
	Dimensions,
	StyleSheet,
	TextStyle,
	TouchableHighlight,
	View,
	ViewStyle,
} from 'react-native';
import { Text, useTheme, RadioButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../../types';
import { MODAL_WIDTH_FACTOR } from '../../../constants';

const space = 6;

const RadioListItem = ({
	opt,
	onPress,
	labelExtractor,
	descExtractor,
	labelNode,
	labelStyle,
	descStyle,
	status = 'unchecked',
	radioAlign = 'right',
}: {
	opt: OptionBase;
	onPress: () => void;
	labelExtractor?: (opt: OptionBase) => string | null;
	descExtractor?: (opt: OptionBase) => string | null;
	labelNode?: ReactNode;
	labelStyle?: TextStyle;
	descStyle?: TextStyle;
	status?: 'unchecked' | 'checked';
	radioAlign?: 'left' | 'right';
}) => {
	const { width } = Dimensions.get('window');
	const { t } = useTranslation();
	const theme = useTheme();
	const label = !labelNode && labelExtractor ? labelExtractor(opt) : null;
	const desc = descExtractor ? descExtractor(opt) : null;

	const styleTouchable = useMemo(
		() => [
			styles.touchable,
			{
				borderRadius: theme.roundness,
				width: width * MODAL_WIDTH_FACTOR - 4 * space,
			},
		],
		[theme, width]
	);

	const styleRow: ViewStyle[] = useMemo(
		() => [
			styles.row,
			{ justifyContent: 'right' === radioAlign ? 'space-between' : 'flex-start' },
		],
		[radioAlign]
	);

	const styleLabelWrap = useMemo(
		() => [
			'right' === radioAlign && styles.labelWrapGrow
		],
		[radioAlign]
	);

	const styleLabel = useMemo(() => [theme.fonts.bodyLarge, labelStyle], [theme, labelStyle]);

	const styleDesc = useMemo(() => [theme.fonts.bodySmall, descStyle], [theme, descStyle]);

	return (
		<TouchableHighlight
			key={opt.key}
			onPress={onPress}
			underlayColor={theme.colors.elevation.level3}
			style={styleTouchable}
		>
			<View style={styleRow}>
				<View style={styleLabelWrap}>
					{labelNode}
					{label && <Text style={styleLabel}>{t(label)}</Text>}
					{desc && <Text style={styleDesc}>{t(desc)}</Text>}
				</View>
				<RadioButton
					value={opt.key}
					onPress={onPress}
					status={status}
				/>
			</View>
		</TouchableHighlight>
	);
};

const styles = StyleSheet.create({
	touchable: {
		padding: space,
		marginLeft: -space,
		marginRight: -space,
	},
	row: {
		alignItems: 'center',
		flexDirection: 'row',
	},
	labelWrapGrow: {
		flexGrow: 1,
	},
});

export default RadioListItem;
