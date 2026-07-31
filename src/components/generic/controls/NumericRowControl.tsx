/**
 * External dependencies
 */
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { useTheme, TextInput } from 'react-native-paper';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../infoWrapper/InfoLabelRow';
import useKeyboardShown from '../../../compose/useKeyboardShown';
import { strValToNb } from '../../../lib/utils';
import { NumType } from '../../../types';

const NumericRowControl = ({
	label,
	value,
	onUpdate,
	inputStyle,
	style,
	Info,
	numType = 'int',
	saveOnType = true,
	validate,
	onClear,
}: {
	label?: string;
	value: number | undefined;
	onUpdate: (newValue: number) => void;
	inputStyle?: TextStyle;
	style?: ViewStyle;
	Info?: ReactNode;
	numType?: NumType;
	saveOnType?: boolean;
	validate?: (val: number) => boolean;
	/** Called when the user clears the input and blurs (value becomes undefined). When omitted, clearing resets to the previous value. */
	onClear?: () => void;
}) => {
	const theme = useTheme();

	const [val, setVal] = useState<string>(value !== undefined ? value + '' : '');

	useEffect(() => {
		setVal(value !== undefined ? value + '' : '');
	}, [value]);

	const [isValid, setIsValid] = useState(true);

	const saveCbRef = useRef<undefined | ((newValue: number) => void)>(undefined);
	useEffect(() => {
		saveCbRef.current = (newValue: number) => {
			if (value === undefined || newValue !== strValToNb(value + '', numType)) {
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
			if (val.trim() === '') {
				setIsValid(true);
				if (onClear) {
					onClear();
				} else if (value !== undefined) {
					// No onClear — reset to previous value.
					const prevNb = strValToNb(value + '', numType);
					if ('number' === typeof prevNb && !Number.isNaN(prevNb)) {
						setVal(prevNb + '');
					}
				}
				return;
			}
			let newValNb = strValToNb(val, numType);
			if (
				'number' !== typeof newValNb ||
				Number.isNaN(newValNb) ||
				(validate && !validate(newValNb))
			) {
				// reset val
				newValNb = value !== undefined ? strValToNb(value + '', numType) : NaN;
				if ('number' === typeof newValNb && !Number.isNaN(newValNb)) {
					setVal(newValNb + '');
				} else {
					setVal('');
				}
			}
			setIsValid(true);
			if ('number' === typeof newValNb && !isNaN(newValNb)) {
				saveCbRef?.current && saveCbRef.current(newValNb);
			}
		};
	}, [
		val,
		numType,
		validate,
		value,
		onClear,
	]);

	const saveOnTypeCbRef = useRef<undefined | (() => void)>(undefined);
	useEffect(() => {
		saveOnTypeCbRef.current = () => {
			if (!saveOnType || val.trim() === '') {
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
		saveOnType,
	]);

	useEffect(() => {
		saveOnTypeCbRef?.current && saveOnTypeCbRef.current();
	}, [val]);

	const handleChangeText = useCallback(
		(newVal: string) => {
			if (newVal.trim() === '') {
				setIsValid(true);
				setVal('');
				return;
			}
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

	const handleBlur = useCallback(() => {
		if (!isFocusedRef.current) return;
		isFocusedRef.current = false;
		handleBlurCbRef?.current && handleBlurCbRef?.current();
	}, []);

	const handleFocus = useCallback(() => {
		isFocusedRef.current = true;
	}, []);

	const styleInput = useMemo(() => [styles.flexGrow, inputStyle], [inputStyle]);

	return (
		<InfoLabelRow
			label={label}
			Info={Info}
			style={style}
		>
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
		</InfoLabelRow>
	);
};
export default NumericRowControl;

const styles = StyleSheet.create({
	flexGrow: { flexGrow: 1 },
});
