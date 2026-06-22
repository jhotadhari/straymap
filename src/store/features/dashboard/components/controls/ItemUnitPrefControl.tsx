/**
 * External dependencies
 */
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { upperFirst, get, omit, isEqual } from 'lodash-es';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { options as unitPrefControlOptions } from '../../../general/components/controls/UnitPrefControl';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectUnitPrefs } from '../../../general/selectors';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import { UnitPref } from '../../../general/types';
import { setItem } from '../../slice';
import { selectEditItem } from '../../selectors';
import { DashboardItem } from '../../types';
import NumericRowControlSegmented from '../../../../../components/generic/controls/NumericRowControlSegmented';
import ListItemMenuControl from '../../../../../components/generic/controls/ListItemMenuControl';
import { sharedStyles } from '../../../../../sharedStyles';

type OptionsWithUnitPref = {
	unitPref?: Partial<UnitPref>;
};

const validate = (val: number) => val >= 0 && val <= 99; // formatting function is limited to 99

const ItemUnitPrefControl: FC<{ unitPrefsKey: string; buttonLabel?: string }> = ({
	unitPrefsKey,
	buttonLabel,
}) => {
	const { item } = useAppSelector((state) => selectEditItem(state)) as {
		item: DashboardItem<OptionsWithUnitPref>;
	};

	const dispatch = useAppDispatch();
	const unitPrefs = useAppSelector(selectUnitPrefs);
	const { t } = useTranslation();
	const theme = useTheme();

	const opts = useMemo(
		() => [
			{
				key: 'default',
				label: 'dashboard.useUnitPref',
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
			if (!item) {
				return;
			}
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
	}, [value, item]);

	// Reset component state on item change.
	useEffect(() => {
		setValue(item?.options?.unitPref ?? {});
	}, [item]);

	// Save item on value change.
	useEffect(() => {
		updateItemRef?.current && updateItemRef.current();
	}, [value]);

	const handleToggleOption = useCallback(() => {
		if (undefined === value?.round) {
			setValue({
				...value,
				round: get(unitPrefs, [unitPrefsKey, 'round']),
			});
		} else {
			setValue(omit(value, 'round'));
		}
	}, [value, unitPrefs]);

	const numValueActive = undefined !== value?.round;

	const handleUpdate = useCallback(
		(newValue: number) => {
			numValueActive &&
				setValue({
					...value,
					round: newValue,
				});
		},
		[numValueActive]
	);

	const handleMenuPress = useCallback((newValue: string) => {
		if ('default' === newValue) {
			setValue((value) => omit(value, 'unit'));
		} else {
			setValue((value) => ({
				...value,
				unit: newValue,
			}));
		}
	}, []);

	const getMenuItemStyle = useCallback(
		(idx: number) =>
			!value?.unit && get(unitPrefs, [unitPrefsKey, 'unit']) === opts[idx].key
				? {
						borderLeftColor: theme.colors.primary,
						borderLeftWidth: 5,
					}
				: {},
		[
			get(unitPrefs, [unitPrefsKey, 'unit']),
			value?.unit,
			opts,
			theme,
		]
	);

	return (
		<View>
			<InfoRowControl
				label={t('unit')}
				Info={t('dashboard.hint.item.unit')}
			>
				<ListItemMenuControl
					listItemStyle={sharedStyles.listItem}
					options={opts}
					value={get(selectedOpt, 'key')}
					setValue={handleMenuPress}
					anchorLabel={t(selectedOpt?.label ?? '')}
					menuItemStyle={getMenuItemStyle}
				/>
			</InfoRowControl>

			<NumericRowControlSegmented
				label={upperFirst(t('decimalPlace', { count: 0 }))}
				buttonLabel={buttonLabel}
				numValueActive={numValueActive}
				toggleOption={handleToggleOption}
				value={value?.round ?? get(unitPrefs, [unitPrefsKey, 'round'])}
				onUpdate={handleUpdate}
				numType="int"
				validate={validate}
			/>
		</View>
	);
};

export default ItemUnitPrefControl;
