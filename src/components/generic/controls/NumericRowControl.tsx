/**
 * External dependencies
 */
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { useTheme, TextInput } from 'react-native-paper';

/**
 * Internal dependencies
 */
import InfoRowControl from './InfoRowControl';
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
}: {
	label?: string;
	value: number;
	onUpdate: (newValue: number) => void;
	inputStyle?: TextStyle;
	style?: ViewStyle;
	Info?: ReactNode;
	numType?: NumType;
	saveOnType?: boolean;
	validate?: (val: number) => boolean;
}) => {
	const theme = useTheme();
	// const keyboardShown = useKeyboardShown();

	const [val, setVal] = useState<string>(value + '');

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
	]);

	const saveOnTypeCbRef = useRef<undefined | (() => void)>(undefined);
	useEffect(() => {
		saveOnTypeCbRef.current = () => {
			if (!saveOnType) {
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

	// // call handleBlur on keyboard hide.
	// useEffect(() => {
	// 	if (!keyboardShown && handleBlurCbRef?.current) {
	// 		handleBlurCbRef.current();
	// 	}
	// }, [
	// 	keyboardShown,
	// ]);

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

	const handleBlur = useCallback(
		() => handleBlurCbRef?.current && handleBlurCbRef?.current(),
		[handleBlurCbRef?.current]
	);

	const styleInput = useMemo(() => [styles.flexGrow, inputStyle], [inputStyle]);

	return (
		<InfoRowControl
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
				value={val}
				keyboardType="numeric"
			/>
		</InfoRowControl>
	);
};
export default NumericRowControl;

const styles = StyleSheet.create({
	flexGrow: { flexGrow: 1 },
});
