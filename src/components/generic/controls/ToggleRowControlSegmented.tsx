/**
 * External dependencies
 */
import { ReactNode, useCallback, useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import { Switch } from 'react-native-paper';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../infoWrapper/InfoLabelRow';
import ButtonHighlight from '../primitives/ButtonHighlight';
import { sharedStyles } from './sharedDeps';
import { sharedStyles as appSharedStyles } from '../../../sharedStyles';
import { useButtonProps } from '../../../compose/useButtonProps';
import { OPACITY_DISABLED } from '../../../constants';

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

	const buttonProps = useButtonProps({
		mode: 'outlined',
		style: boolValueActive
			? {
					borderColor: 'transparent',
					opacity: OPACITY_DISABLED,
				}
			: undefined,
	});

	return (
		<InfoLabelRow
			label={label}
			Info={Info}
			style={style}
		>
			<View style={sharedStyles.flexRow}>
				<ButtonHighlight
					{...buttonProps}
					onPress={handleButtonPress}
				>
					{buttonLabel}
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

export default ToggleRowControlSegmented;
