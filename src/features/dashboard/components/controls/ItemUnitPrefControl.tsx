/**
 * External dependencies
 */
import React, { FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { upperFirst, get, omit, isEqual } from 'lodash-es';

/**
 * Internal dependencies
 */
import { options as unitPrefControlOptions } from '../../../general/components/controls/UnitPrefControl';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectUnitPrefs } from '../../../general/selectors';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import { UnitPref } from '../../../general/types';
import { setItem } from '../../slice';
import { selectEditItem } from '../../selectors';
import { DashboardItem } from '../../types';
import NumericRowControlSegmented from '../../../../components/generic/controls/NumericRowControlSegmented';
import ToggleRowControlSegmented from '../../../../components/generic/controls/ToggleRowControlSegmented';
import ButtonHighlightMenuControl from '../../../../components/generic/wrapper/ButtonHighlightMenuControl';

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
	}, [
		dispatch,
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
	}, [
		value,
		unitPrefs,
		unitPrefsKey,
	]);

	const numValueActive = undefined !== value?.round;

	const handleUpdate = useCallback(
		(newValue: number) => {
			numValueActive &&
				setValue({
					...value,
					round: newValue,
				});
		},
		[numValueActive, value]
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

	const handleCoordsPadLngToggleOption = useCallback(() => {
		if (undefined === value?.coordsPadLng) {
			setValue({
				...value,
				coordsPadLng: get(unitPrefs, [unitPrefsKey, 'coordsPadLng']),
			});
		} else {
			setValue(omit(value, 'coordsPadLng'));
		}
	}, [
		value,
		unitPrefs,
		unitPrefsKey,
	]);

	const handleCoordsPadLngUpdate = useCallback(
		(newValue: boolean) => {
			setValue({
				...value,
				coordsPadLng: newValue,
			});
		},
		[value]
	);

	const handleCoordsPadLatToggleOption = useCallback(() => {
		if (undefined === value?.coordsPadLat) {
			setValue({
				...value,
				coordsPadLat: get(unitPrefs, [unitPrefsKey, 'coordsPadLat']),
			});
		} else {
			setValue(omit(value, 'coordsPadLat'));
		}
	}, [
		value,
		unitPrefs,
		unitPrefsKey,
	]);

	const handleCoordsPadLatUpdate = useCallback(
		(newValue: boolean) => {
			setValue({
				...value,
				coordsPadLat: newValue,
			});
		},
		[value]
	);

	const handleCoordsForceNEToggleOption = useCallback(() => {
		if (undefined === value?.coordsForceNE) {
			setValue({
				...value,
				coordsForceNE: get(unitPrefs, [unitPrefsKey, 'coordsForceNE']),
			});
		} else {
			setValue(omit(value, 'coordsForceNE'));
		}
	}, [
		value,
		unitPrefs,
		unitPrefsKey,
	]);

	const handleCoordsForceNEUpdate = useCallback(
		(newValue: boolean) => {
			setValue({
				...value,
				coordsForceNE: newValue,
			});
		},
		[value]
	);

	const handleCoordsOrderUpdate = useCallback((newValue: string) => {
		if ('default' === newValue) {
			setValue((value) => omit(value, 'coordsOrder'));
		} else if (
			[
				'lat_lng',
				'lng_lat',
				'lat',
				'lng',
			].includes(newValue as string)
		) {
			setValue((value) => ({
				...value,
				coordsOrder: newValue as UnitPref['coordsOrder'],
			}));
		}
	}, []);

	const coordsPadLngActive = undefined !== value?.coordsPadLng;
	const coordsPadLatActive = undefined !== value?.coordsPadLat;
	const coordsForceNEActive = undefined !== value?.coordsForceNE;

	const coordsOrderOpts = useMemo(
		() => [
			{
				key: 'default',
				label: 'dashboard.useUnitPref',
			},
			...get(unitPrefControlOptions, 'coordsOrder', []),
		],
		[]
	);

	const selectedCoordsOrderOpt = coordsOrderOpts.find(
		(opt) => opt.key === (value?.coordsOrder ?? 'default')
	);

	const getCoordsOrderMenuItemStyle = useCallback(
		(idx: number) =>
			!value?.coordsOrder &&
			get(unitPrefs, [unitPrefsKey, 'coordsOrder']) === coordsOrderOpts[idx].key
				? {
						borderLeftColor: theme.colors.primary,
						borderLeftWidth: 5,
					}
				: {},
		[
			value?.coordsOrder,
			coordsOrderOpts,
			theme,
			unitPrefs,
			unitPrefsKey,
		]
	);

	const getMenuItemStyle = useCallback(
		(idx: number) =>
			!value?.unit && get(unitPrefs, [unitPrefsKey, 'unit']) === opts[idx].key
				? {
						borderLeftColor: theme.colors.primary,
						borderLeftWidth: 5,
					}
				: {},
		[
			value?.unit,
			opts,
			theme,
			unitPrefs,
			unitPrefsKey,
		]
	);

	return (
		<Fragment>
			<InfoLabelRow
				label={t('unit')}
				Info={t('dashboard.hint.item.unit')}
			>
				<ButtonHighlightMenuControl
					options={opts}
					value={get(selectedOpt, 'key')}
					setValue={handleMenuPress}
					anchorLabel={t(selectedOpt?.label ?? '')}
					menuItemStyle={getMenuItemStyle}
				/>
			</InfoLabelRow>

			<NumericRowControlSegmented
				label={upperFirst(t('decimalPlace', { count: 0 }))}
				buttonLabel={buttonLabel}
				numValueActive={numValueActive}
				toggleOption={handleToggleOption}
				value={value?.round ?? get(unitPrefs, [unitPrefsKey, 'round'])}
				onUpdate={handleUpdate}
				numType="int"
				validate={validate}
				Info={t('dashboard.hint.item.decimalPlaces')}
			/>

			{'coordinates' === unitPrefsKey && (
				<>
					<ToggleRowControlSegmented
						label={t('coordsPadLng')}
						buttonLabel={buttonLabel}
						boolValueActive={coordsPadLngActive}
						toggleOption={handleCoordsPadLngToggleOption}
						value={
							value?.coordsPadLng ??
							get(unitPrefs, [
								unitPrefsKey,
								'coordsPadLng',
							]) ??
							false
						}
						onUpdate={handleCoordsPadLngUpdate}
						Info={t('general.hint.units.coordsPadLng')}
					/>
					<ToggleRowControlSegmented
						label={t('coordsPadLat')}
						buttonLabel={buttonLabel}
						boolValueActive={coordsPadLatActive}
						toggleOption={handleCoordsPadLatToggleOption}
						value={
							value?.coordsPadLat ??
							get(unitPrefs, [
								unitPrefsKey,
								'coordsPadLat',
							]) ??
							false
						}
						onUpdate={handleCoordsPadLatUpdate}
						Info={t('general.hint.units.coordsPadLat')}
					/>
					<ToggleRowControlSegmented
						label={t('coordsForceNE')}
						buttonLabel={buttonLabel}
						boolValueActive={coordsForceNEActive}
						toggleOption={handleCoordsForceNEToggleOption}
						value={
							value?.coordsForceNE ??
							get(unitPrefs, [
								unitPrefsKey,
								'coordsForceNE',
							]) ??
							false
						}
						onUpdate={handleCoordsForceNEUpdate}
						Info={t('general.hint.units.coordsForceNE')}
					/>
					<InfoLabelRow
						label={t('coordsOrder')}
						Info={t('general.hint.units.coordsOrder')}
					>
						<ButtonHighlightMenuControl
							options={coordsOrderOpts}
							value={get(selectedCoordsOrderOpt, 'key')}
							setValue={handleCoordsOrderUpdate}
							anchorLabel={t(selectedCoordsOrderOpt?.label ?? '')}
							menuItemStyle={getCoordsOrderMenuItemStyle}
						/>
					</InfoLabelRow>
				</>
			)}
		</Fragment>
	);
};

export default ItemUnitPrefControl;
