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
import InfoRowControl from './InfoRowControl';
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
}: {
	label?: string;
	values: number[];
	optLabels: string[];
	onUpdate: (newValues: number[]) => void;
	Info?: ReactNode;
	numType?: NumType;
	saveOnType?: boolean;
	validate?: (val: number) => boolean;
}) => {
	const theme = useTheme();

	const [vals, setVals] = useState(values.map((v) => v + ''));

	useEffect(() => {
		setVals(values.map((v) => v + ''));
	}, [values]);

	const [isValids, setIsValids] = useState([true, true]);

	const saveCbRef = useRef<undefined | ((newValues: number[]) => void)>(undefined);
	useEffect(() => {
		saveCbRef.current = (newValues: number[]) => {
			if (
				newValues[0] !== strValToNb(values[0] + '', numType) ||
				newValues[1] !== strValToNb(values[1] + '', numType)
			) {
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
			const getNewValNb = (idx: number) => {
				let newValNb = strValToNb(vals[idx], numType);
				if (
					'number' !== typeof newValNb ||
					isNaN(newValNb) ||
					(validate && !validate(newValNb))
				) {
					// reset val
					newValNb = strValToNb(values[idx] + '', numType);
					setVals((vals) => {
						const newVals = [...vals];
						newVals[idx] = newValNb + '';
						return newVals;
					});
				}
				return newValNb;
			};
			const newValues = [getNewValNb(0), getNewValNb(1)];
			setIsValids([true, true]);
			saveCbRef?.current && saveCbRef.current(newValues);
		};
	}, [
		vals,
		numType,
		validate,
		values,
	]);

	const saveOnTypeCbRef = useRef<undefined | (() => void)>(undefined);
	useEffect(() => {
		saveOnTypeCbRef.current = () => {
			if (!saveOnType) {
				return;
			}
			let newValNb0 = strValToNb(vals[0], numType);
			let newValNb1 = strValToNb(vals[1], numType);
			if (!validate || (validate(newValNb0) && validate(newValNb1))) {
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
			setVals((vals) => {
				const newVals = [...vals];
				newVals[idx] = newVal;
				return newVals;
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
		<InfoRowControl
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
		</InfoRowControl>
	);
};

const localStyles = StyleSheet.create({
	optionsRow: { flexGrow: 1, gap: 8 },
	optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	input: { maxWidth: 50 },
});

export default NumericRowControlMulti;
