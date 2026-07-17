/**
 * External dependencies
 */
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme, TextInput } from 'react-native-paper';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../infoWrapper/InfoLabelRow';
import { strValToNb } from '../../../lib/utils';
import { NumType } from '../../../types';
import { sharedStyles } from './sharedDeps';

const NumericRowControlMulti = ({
	label,
	values,
	optLabels,
	onUpdate,
	Info,
	numType = 'int',
	saveOnType = true,
	validate,
	onClear,
}: {
	label?: string;
	values: (number | undefined)[];
	optLabels: string[];
	onUpdate: (newValues: number[]) => void;
	Info?: ReactNode;
	numType?: NumType;
	saveOnType?: boolean;
	validate?: (val: number) => boolean;
	/** Called when the user clears an input and blurs, per index. When omitted, clearing resets to the previous value. */
	onClear?: (index: number) => void;
}) => {
	const theme = useTheme();

	const [vals, setVals] = useState(values.map((v) => (v !== undefined ? v + '' : '')));

	useEffect(() => {
		setVals(values.map((v) => (v !== undefined ? v + '' : '')));
	}, [values]);

	const [isValids, setIsValids] = useState([true, true]);

	const saveCbRef = useRef<undefined | ((newValues: number[]) => void)>(undefined);
	useEffect(() => {
		saveCbRef.current = (newValues: number[]) => {
			const changed = newValues.some((nv, idx) => {
				return values[idx] === undefined || nv !== strValToNb(values[idx] + '', numType);
			});
			if (changed) {
				onUpdate(newValues);
			}
		};
	}, [
		onUpdate,
		values,
		numType,
	]);

	const handleBlurCbRef = useRef<undefined | (() => void)>(undefined);
	useEffect(() => {
		handleBlurCbRef.current = () => {
			const getNewValNb = (idx: number): number | undefined => {
				if (vals[idx].trim() === '') {
					if (onClear) {
						onClear(idx);
					} else if (values[idx] !== undefined) {
						// No onClear — reset to previous value.
						const prevNb = strValToNb(values[idx] + '', numType);
						if ('number' === typeof prevNb && !isNaN(prevNb)) {
							setVals((v) => {
								const nv = [...v];
								nv[idx] = prevNb + '';
								return nv;
							});
						}
					}
					return undefined;
				}
				let newValNb = strValToNb(vals[idx], numType);
				if (
					'number' !== typeof newValNb ||
					isNaN(newValNb) ||
					(validate && !validate(newValNb))
				) {
					const prevVal = values[idx];
					newValNb = prevVal !== undefined ? strValToNb(prevVal + '', numType) : NaN;
					if ('number' === typeof newValNb && !isNaN(newValNb)) {
						setVals((v) => {
							const nv = [...v];
							nv[idx] = newValNb + '';
							return nv;
						});
					} else {
						setVals((v) => {
							const nv = [...v];
							nv[idx] = '';
							return nv;
						});
					}
				}
				if ('number' === typeof newValNb && !isNaN(newValNb)) {
					return newValNb;
				}
				return undefined;
			};
			const newVal0 = getNewValNb(0);
			const newVal1 = getNewValNb(1);
			setIsValids([true, true]);
			if (newVal0 !== undefined && newVal1 !== undefined) {
				saveCbRef?.current && saveCbRef.current([newVal0, newVal1]);
			}
		};
	}, [
		vals,
		numType,
		validate,
		values,
		onClear,
	]);

	const saveOnTypeCbRef = useRef<undefined | (() => void)>(undefined);
	useEffect(() => {
		saveOnTypeCbRef.current = () => {
			if (!saveOnType) {
				return;
			}
			// Only save-on-type when both inputs are non-empty and valid.
			if (vals[0].trim() === '' || vals[1].trim() === '') {
				return;
			}
			const newValNb0 = strValToNb(vals[0], numType);
			const newValNb1 = strValToNb(vals[1], numType);
			if (
				'number' === typeof newValNb0 &&
				!isNaN(newValNb0) &&
				'number' === typeof newValNb1 &&
				!isNaN(newValNb1) &&
				(!validate || (validate(newValNb0) && validate(newValNb1)))
			) {
				saveCbRef?.current && saveCbRef.current([newValNb0, newValNb1]);
			}
		};
	}, [
		vals,
		numType,
		validate,
		values,
		saveOnType,
	]);

	useEffect(() => {
		saveOnTypeCbRef?.current && saveOnTypeCbRef.current();
	}, [vals]);

	const handleChangeText = useCallback(
		(newVal: string, idx: number) => {
			if (newVal.trim() === '') {
				setIsValids((valids) => {
					const newValids = [...valids];
					newValids[idx] = true;
					return newValids;
				});
				setVals((v) => {
					const nv = [...v];
					nv[idx] = '';
					return nv;
				});
				return;
			}
			if (validate) {
				let newValNb = strValToNb(newVal, numType);
				if ('number' !== typeof newValNb || isNaN(newValNb) || !validate(newValNb)) {
					setIsValids((valids) => {
						const newValids = [...valids];
						newValids[idx] = false;
						return newValids;
					});
				} else {
					setIsValids((valids) => {
						const newValids = [...valids];
						newValids[idx] = true;
						return newValids;
					});
				}
			}
			setVals((v) => {
				const nv = [...v];
				nv[idx] = newVal;
				return nv;
			});
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
		[]
	);

	return (
		<InfoLabelRow
			label={label}
			Info={Info}
		>
			<View style={[sharedStyles.flexRow, localStyles.optionsRow]}>
				{values.map((_value, idx) => (
					<View
						key={idx}
						style={localStyles.optionRow}
					>
						{get(optLabels, idx, undefined) && <Text>{get(optLabels, idx)}</Text>}
						<TextInput
							style={localStyles.input}
							underlineColor="transparent"
							error={!isValids[idx]}
							dense={true}
							theme={overwriteTheme}
							onChangeText={(newVal) => handleChangeText(newVal, idx)}
							onBlur={handleBlur}
							value={vals[idx]}
							keyboardType="numeric"
						/>
					</View>
				))}
			</View>
		</InfoLabelRow>
	);
};

const localStyles = StyleSheet.create({
	optionsRow: { flexGrow: 1, gap: 8 },
	optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	input: { maxWidth: 50 },
});

export default NumericRowControlMulti;
