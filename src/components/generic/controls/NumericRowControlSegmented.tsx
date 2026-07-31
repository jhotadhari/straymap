/**
 * External dependencies
 */
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { useTheme, TextInput } from 'react-native-paper';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../infoWrapper/InfoLabelRow';
import ButtonHighlight from '../primitives/ButtonHighlight';
import { sharedStyles } from './sharedDeps';
import { sharedStyles as appSharedStyles } from '../../../sharedStyles';
import useKeyboardShown from '../../../compose/useKeyboardShown';
import { strValToNb } from '../../../lib/utils';
import { NumType } from '../../../types';
import { useButtonProps } from '../../../compose/useButtonProps';
import { OPACITY_DISABLED } from '../../../constants';

const NumericRowControlSegmented = ({
	label,
	buttonLabel,
	numValueActive,
	toggleOption,
	value,
	onUpdate,
	inputStyle,
	style,
	Info,
	numType = 'int',
	saveOnType = true,
	validate,
}: {
	label?: string;
	buttonLabel?: string;
	numValueActive: boolean;
	saveOnType?: boolean;
	toggleOption: () => void;
	value: number | string;
	onUpdate: (newValue: number) => void;
	inputStyle?: TextStyle;
	style?: ViewStyle;
	Info?: ReactNode;
	numType?: NumType;
	validate?: (val: number) => boolean;
}) => {
	const theme = useTheme();

	const [val, setVal] = useState(value + '');
	useEffect(() => {
		setVal(value + '');
	}, [value]);

	const [isValid, setIsValid] = useState(true);

	const saveCbRef = useRef<undefined | ((newValue: number) => void)>(undefined);
	useEffect(() => {
		saveCbRef.current = (newValue: number) => {
			if (newValue !== strValToNb(value + '', numType)) {
				onUpdate(newValue);
			}
		};
	}, [
		onUpdate,
		value,
		numType,
	]);

	const handleBlurCbRef = useRef<undefined | (() => void)>(undefined);
	useEffect(() => {
		handleBlurCbRef.current = () => {
			if (!numValueActive) {
				return;
			}
			let newValNb = strValToNb(val, numType);
			if (
				'number' !== typeof newValNb ||
				isNaN(newValNb) ||
				(validate && !validate(newValNb))
			) {
				// reset val
				newValNb = strValToNb(value + '', numType);
				setVal(newValNb + '');
			}
			setIsValid(true);
			saveCbRef?.current && saveCbRef.current(newValNb);
		};
	}, [
		val,
		numType,
		validate,
		value,
		numValueActive,
	]);

	const saveOnTypeCbRef = useRef<undefined | (() => void)>(undefined);
	useEffect(() => {
		saveOnTypeCbRef.current = () => {
			if (!numValueActive || !saveOnType) {
				return;
			}
			let newValNb = strValToNb(val, numType);
			if (
				'number' === typeof newValNb &&
				!isNaN(newValNb) &&
				(!validate || validate(newValNb))
			) {
				saveCbRef?.current && saveCbRef.current(newValNb);
			}
		};
	}, [
		val,
		numType,
		validate,
		value,
		numValueActive,
		saveOnType,
	]);

	useEffect(() => {
		saveOnTypeCbRef?.current && saveOnTypeCbRef.current();
	}, [val]);

	const isFocusedRef = useRef(false);
	const wasKeyboardShownRef = useRef(false);
	const { keyboardShown } = useKeyboardShown();

	useEffect(() => {
		if (wasKeyboardShownRef.current && !keyboardShown && isFocusedRef.current) {
			isFocusedRef.current = false;
			handleBlurCbRef?.current && handleBlurCbRef.current();
		}
		wasKeyboardShownRef.current = keyboardShown;
	}, [keyboardShown]);

	const handleChangeText = useCallback(
		(newVal: string) => {
			if (validate) {
				let newValNb = strValToNb(newVal, numType);
				if ('number' !== typeof newValNb || isNaN(newValNb) || !validate(newValNb)) {
					setIsValid(false);
				} else {
					setIsValid(true);
				}
			}
			setVal(newVal);
		},
		[validate, numType]
	);

	const overwriteTheme = useMemo(
		() => ({
			fonts: {
				bodyLarge: {
					...theme.fonts.bodySmall,
					fontFamily: 'sans-serif',
				},
			},
		}),
		[theme]
	);

	const handleBlur = useCallback(() => {
		isFocusedRef.current = false;
		handleBlurCbRef?.current && handleBlurCbRef?.current();
	}, []);

	const handleButtonPress = useCallback(() => {
		numValueActive && toggleOption();
	}, [numValueActive, toggleOption]);

	const handleFocus = useCallback(() => {
		isFocusedRef.current = true;
		if (!numValueActive) {
			toggleOption();
		}
	}, [
		numValueActive,
		toggleOption,
	]);

	const styleInput = useMemo(
		() => [
			localStyles.input,
			!numValueActive && appSharedStyles.disabled,
			inputStyle,
		],
		[numValueActive, inputStyle]
	);

	const buttonProps = useButtonProps({
		mode: 'outlined',
		style: numValueActive
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

				<TextInput
					style={styleInput}
					underlineColor="transparent"
					error={!isValid}
					dense={true}
					theme={overwriteTheme}
					onChangeText={handleChangeText}
					onBlur={handleBlur}
					onFocus={handleFocus}
					value={val}
					keyboardType="numeric"
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
	input: { flexGrow: 1 },
});

export default NumericRowControlSegmented;
