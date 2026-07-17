/**
 * External dependencies
 */
import { ReactNode, useCallback, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Switch, Text, useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../infoWrapper/InfoLabelRow';
import ButtonHighlight from '../primitives/ButtonHighlight';
import { sharedStyles } from './sharedDeps';
import { sharedStyles as appSharedStyles } from '../../../sharedStyles';

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
				borderRadius: theme.roundness,
			},
		],
		[theme]
	);

	const styleButtonLabel = useMemo(
		() => [
			// localStyles.button,
			{
				...(boolValueActive && appSharedStyles.disabled),
				paddingHorizontal: 0,
			},
		],
		[boolValueActive]
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
			!boolValueActive && appSharedStyles.disabled,
		],
		[boolValueActive]
	);

	return (
		<InfoLabelRow
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
		</InfoLabelRow>
	);
};

const localStyles = StyleSheet.create({
	button: {
		borderWidth: 1,
		marginRight: 10,
	},
});

export default ToggleRowControlSegmented;
