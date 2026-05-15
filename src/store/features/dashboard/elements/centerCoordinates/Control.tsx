/**
 * External dependencies
 */
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Menu, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { upperFirst, get, omit, isEqual } from 'lodash-es';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { NumericRowControl } from '../../../../../components/generic/controls/NumericRowControlsNew';
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

// const opts = [
// 	{
// 		key: 'default',
// 		label: 'useUnitPref',
// 	},
// 	...unitPrefControlOptions.coordinates,
// ];

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
	const [isSetByControl, setIsSetByControl] = useState(false);

	const selectedOpt = opts.find((opt) => opt.key === (value?.unit ?? 'default'));

	const updateItemRef = useRef<undefined | (() => void)>(undefined);
	useEffect(() => {
		updateItemRef.current = () => {
			if ( ! isSetByControl ) {
				return;
			}
			let newItem = { ...item };
			if (Object.keys(value).length > 0) {
				newItem = {
					...newItem,
					options: {
						...newItem?.options,
						unitPref: value,
					}
				}
			} else {
				newItem = {
					...newItem,
					options: omit(newItem?.options ?? {}, 'unitPref')
				}
			}
			if (!isEqual(item?.options?.unitPref, newItem?.options?.unitPref)) {
				dispatch(setItem(newItem));
			}
		};
	}, [isSetByControl, value, item]);

	// Reset component state on item change.
	useEffect(() => {
		setIsSetByControl( false );
		setValue(item?.options?.unitPref ?? {});
	}, [item]);

	// Save item on value change.
	useEffect(() => {
		if ( isSetByControl ) {
			updateItemRef?.current && updateItemRef.current();
		}
	}, [isSetByControl, value]);

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
						<MenuItem
							key={opt.key}
							onPress={() => {
								setMenuVisible(false);
								if ('default' === opt.key) {
									setValue(omit(value, 'unit'));
								} else {
									setValue({
										...value,
										unit: opt.key,
									});
								}
								setIsSetByControl( true );
							}}
							title={t(opt.label)}
							active={value ? opt.key === value.unit : false}
							style={
								!value?.unit &&
								unitPrefs &&
								unitPrefs?.coordinates?.unit === opt.key
									? {
											borderLeftColor: theme.colors.primary,
											borderLeftWidth: 5,
										}
									: {}
							}
						/>
					))}
				</Menu>
			</InfoRowControl>

			<NumericRowControl
				label={upperFirst(t('decimalPlace', { count: 0 }))}
				value={value.round ?? get(unitPrefs, [unitPrefsKey, 'round'])}
				onUpdate={(newValue) => {
					console.log('debug newValue', newValue); // debug
					if (newValue === get(unitPrefs, [unitPrefsKey, 'round'])) {
						setValue(omit(value, 'round'));
					} else {
						setValue({
							...value,
							round: newValue,
						});
					}
					setIsSetByControl( true );
				}}
				numType="int"
				validate={(val) => val >= 0 && val <= 20}
			/>
		</View>
	);
};

const Control: FC<{
	item: DashboardItem<Options>;
}> = ({
	item,
	// updateElement,
}) => {
	const unitPrefs = useAppSelector(selectUnitPrefs);
	const { t } = useTranslation();
	const theme = useTheme();
	// const [menuVisible, setMenuVisible] = useState(false);

	return (
		<View>
			<UnitPrefControl
				item={item}
				unitPrefsKey="coordinates"
			/>
		</View>
	);
};

export default Control;
