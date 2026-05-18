/**
 * External dependencies
 */
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { Text, useTheme, TextInput } from 'react-native-paper';

/**
 * Internal dependencies
 */
import InfoRowControl from './InfoRowControl';
import useKeyboardShown from '../../../compose/useKeyboardShown';
import ButtonHighlight from '../ButtonHighlight';

type NumType = 'int' | 'float';

const strValToNb = (val: string, numType: NumType = 'int'): number => {
	switch (numType) {
		case 'int':
			return parseInt(
				(val.trim().startsWith('-') ? '-' : '') + val.trim().replace(/[^0-9]/g, ''),
				10
			);
		case 'float':
			return parseFloat(
				(val.trim().startsWith('-') ? '-' : '') +
					val
						.trim()
						.replace(/,/g, '.')
						.replace(/[^0-9.]/g, '')
			);
	}
};

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

	return (
		<InfoRowControl
			label={label}
			Info={Info}
			style={style}
		>
			<TextInput
				style={{ flexGrow: 1, ...inputStyle }}
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

export const styles = StyleSheet.create({
	flexRow: {
		position: 'relative',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
});
