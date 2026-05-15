/**
 * External dependencies
 */
import React, {
	Dispatch,
	FC,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { Menu, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { upperFirst, get, omit, isEqual } from 'lodash-es';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { SegmentedNumericRowControl } from '../../../../../components/generic/controls/NumericRowControlsNew';
import { options as unitPrefControlOptions } from '../../../general/components/controls/UnitPrefControl';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectUnitPrefs } from '../../../general/selectors';
import { DashboardItem } from '../../types';
import MenuItem from '../../../../../components/generic/MenuItem';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { Options } from './Display';
import { UnitPref } from '../../../general/types';
import { setItem } from '../../dashboardSlice';
import { OptionBase } from '../../../../../types';

const UnitOption: FC<{
	setMenuVisible: Dispatch<SetStateAction<boolean>>;
	opt: OptionBase;
	setValue: Dispatch<SetStateAction<Partial<UnitPref>>>;
	value: Partial<UnitPref>;
	unitPrefsKey: string;
}> = ({ setMenuVisible, opt, setValue, value, unitPrefsKey }) => {
	const unitPrefs = useAppSelector(selectUnitPrefs);
	const theme = useTheme();
	const { t } = useTranslation();

	const handleMenuPress = useCallback(() => {
		setMenuVisible(false);
		if ('default' === opt.key) {
			setValue(omit(value, 'unit'));
		} else {
			setValue({
				...value,
				unit: opt.key,
			});
		}
	}, []);

	const style = useMemo(
		() =>
			!value?.unit && get(unitPrefs, [unitPrefsKey, 'unit']) === opt.key
				? {
						borderLeftColor: theme.colors.primary,
						borderLeftWidth: 5,
					}
				: {},
		[
			get(unitPrefs, [unitPrefsKey, 'unit']),
			value?.unit,
			opt.key,
			theme,
		]
	);

	return (
		<MenuItem
			key={opt.key}
			onPress={handleMenuPress}
			title={t(opt.label)}
			active={value ? opt.key === value.unit : false}
			style={style}
		/>
	);
};

const UnitPrefControl: FC<{
	item: DashboardItem<Options>;
	unitPrefsKey: string;
}> = ({ item, unitPrefsKey }) => {
	const dispatch = useAppDispatch();
	const unitPrefs = useAppSelector(selectUnitPrefs);
	const { t } = useTranslation();
	const theme = useTheme();
	const [menuVisible, setMenuVisible] = useState(false);

	const opts = useMemo(
		() => [
			{
				key: 'default',
				label: 'useUnitPref',
			},
			...get(unitPrefControlOptions, unitPrefsKey, []),
		],
		[unitPrefsKey]
	);

	const [value, setValue] = useState<Partial<UnitPref>>(item?.options?.unitPref ?? {});

	const selectedOpt = opts.find((opt) => opt.key === (value?.unit ?? 'default'));

	const updateItemRef = useRef<undefined | (() => void)>(undefined);
	useEffect(() => {
		updateItemRef.current = () => {
			let newItem = { ...item };
			if (Object.keys(value).length > 0) {
				newItem = {
					...newItem,
					options: {
						...newItem?.options,
						unitPref: value,
					},
				};
			} else {
				newItem = {
					...newItem,
					options: omit(newItem?.options ?? {}, 'unitPref'),
				};
			}
			if (!isEqual(item?.options?.unitPref, newItem?.options?.unitPref)) {
				dispatch(setItem(newItem));
			}
		};
	}, [
		value,
		item,
	]);

	// Reset component state on item change.
	useEffect(() => {
		setValue(item?.options?.unitPref ?? {});
	}, [item]);

	// Save item on value change.
	useEffect(() => {
		updateItemRef?.current && updateItemRef.current();
	}, [
		value,
	]);

	return (
		<View>
			<InfoRowControl
				label={t('unit')}
				Info={t('hint.dashboard.item.unit')}
			>
				<Menu
					contentStyle={{
						borderColor: theme.colors.outline,
						borderWidth: 1,
					}}
					visible={menuVisible}
					onDismiss={() => setMenuVisible(false)}
					anchor={
						<ButtonHighlight
							style={{ marginTop: 3, alignItems: 'flex-start' }}
							onPress={() => setMenuVisible(true)}
						>
							<Text>{t(selectedOpt?.label ?? '')}</Text>
						</ButtonHighlight>
					}
				>
					{[...opts].map((opt) => (
						<UnitOption
							key={opt.key}
							unitPrefsKey={unitPrefsKey}
							setMenuVisible={setMenuVisible}
							opt={opt}
							setValue={setValue}
							value={value}
						/>
					))}
				</Menu>
			</InfoRowControl>

			<SegmentedNumericRowControl
				label={upperFirst(t('decimalPlace', { count: 0 }))}
				buttonLabel={t('follow global setting')}
				numValueActive={value.hasOwnProperty('round')}
				toggleOption={() => {
					if (undefined === value?.round) {
						setValue({
							...value,
							round: get(unitPrefs, [unitPrefsKey, 'round']),
						});
					} else {
						setValue(omit(value, 'round'));
					}
				}}
				value={value.round ?? get(unitPrefs, [unitPrefsKey, 'round'])}
				onUpdate={(newValue) => {
					setValue({
						...value,
						round: newValue,
					});
				}}
				numType="int"
				validate={(val) => val >= 0 && val <= 20}
			/>
		</View>
	);
};

export default UnitPrefControl;
