/**
 * External dependencies
 */
import { ReactNode, useCallback, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Switch, Text, useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import InfoRowControl from './InfoRowControl';
import ButtonHighlight from '../ButtonHighlight';
import { sharedStyles } from './sharedDeps';

const ToggleRowControlSegmented = ({
	label,
	buttonLabel,
	boolValueActive,
	toggleOption,
	value,
	onUpdate,
	style,
	Info,
}: {
	label?: string;
	buttonLabel?: string;
	boolValueActive: boolean;
	toggleOption: () => void;
	value: boolean;
	onUpdate: (newValue: boolean) => void;
	style?: ViewStyle;
	Info?: ReactNode;
}) => {
	const theme = useTheme();

	const styleButton = useMemo(
		() => [
			localStyles.button,
			{
				// opacity: boolValueActive ? 0.5 : 1,
				borderRadius: theme.roundness,
			},
		],
		[boolValueActive, theme]
	);

	const styleButtonLabel = useMemo(
		() => [
			// localStyles.button,
			{
				opacity: boolValueActive ? 0.5 : 1,
				// borderRadius: theme.roundness,
				paddingHorizontal: 0,
			},
		],
		[boolValueActive, theme]
	);

	const handleButtonPress = useCallback(() => {
		toggleOption();
	}, [toggleOption]);

	const handleSwitchChange = useCallback(
		(newValue: boolean) => {
			if (!boolValueActive) {
				toggleOption();
			}
			onUpdate(newValue);
		},
		[
			boolValueActive,
			toggleOption,
			onUpdate,
		]
	);

	const styleSwitch = useMemo(
		() => [
			{ opacity: boolValueActive ? 1 : 0.5 },
		],
		[boolValueActive]
	);

	return (
		<InfoRowControl
			label={label}
			Info={Info}
			style={style}
		>
			<View style={sharedStyles.flexRow}>
				<ButtonHighlight
					mode={boolValueActive ? 'text' : 'outlined'}
					style={styleButton}
					labelStyle={styleButtonLabel}
					onPress={handleButtonPress}
				>
					<Text>{buttonLabel}</Text>
				</ButtonHighlight>

				<Switch
					value={value}
					style={styleSwitch}
					onValueChange={handleSwitchChange}
				/>
			</View>
		</InfoRowControl>
	);
};

const localStyles = StyleSheet.create({
	button: {
		borderWidth: 1,
		marginRight: 10,
	},
});

export default ToggleRowControlSegmented;
