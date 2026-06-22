/**
 * External dependencies
 */
import React, { Fragment } from 'react';
import { StyleSheet } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { upperFirst, get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../../../../types';
import ListItemModalControl from '../../../../../components/generic/controls/ListItemModalControl';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import NumericRowControl from '../../../../../components/generic/controls/NumericRowControl';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectUnitPrefs } from '../../selectors';
import { setUnitPrefs } from '../../slice';
import { UnitPref } from '../../types';
import ListItemMenuControl from '../../../../../components/generic/controls/ListItemMenuControl';
import { sharedStyles } from '../../../../../sharedStyles';

export const options: { [value: string]: OptionBase[] } = {
	coordinates: [
		{
			key: 'dd',
			label: 'dd',
		},
		{
			key: 'dmm',
			label: 'dmm',
		},
		{
			key: 'dms',
			label: 'dms',
		},
	],
	distance: [
		{
			key: 'metric',
			label: 'metric',
		},
		{
			key: 'imperial',
			label: 'imperial',
		},
		{
			key: 'nautical',
			label: 'nautical',
		},
	],
	heightDepth: [
		{
			key: 'm',
			label: 'meter',
		},
		{
			key: 'ft',
			label: 'feet',
		},
		{
			key: 'fath',
			label: 'fathom',
		},
	],
	speed: [
		{
			key: 'kmh',
			label: 'km/h',
		},
		{
			key: 'mph',
			label: 'mph',
		},
		{
			key: 'knots',
			label: 'knots',
		},
		{
			key: 'bft',
			label: 'bft',
		},
		{
			key: 'ms',
			label: 'm/s',
		},
		{
			key: 'fs',
			label: 'f/s',
		},
	],
};

const hints = {
	heightDepth: 'general.hint.units.heightDepth',
};

const UnitControl = ({
	unitKey,
	unitPref,
	onChange,
}: {
	unitKey: string;
	unitPref: UnitPref;
	onChange: (newUnitPref: UnitPref) => void;
}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const opts = get(options, unitKey, []);
	const Info = get(hints, unitKey);

	return (
		<Fragment>
			<InfoRowControl
				label={upperFirst(t(unitKey))}
				style={styles.unitLabel}
				labelStyle={theme.fonts.titleLarge}
				Info={Info && 'string' === typeof Info ? t(Info) : Info}
			/>

			<InfoRowControl label={t('unit')}>
				<ListItemMenuControl
					listItemStyle={sharedStyles.listItem}
					options={opts}
					value={unitPref.unit}
					setValue={(newValue) => {
						onChange({
							...unitPref,
							unit: newValue,
						});
					}}
					anchorLabel={t(
						get(
							opts.find((opt) => opt.key === unitPref.unit),
							'label',
							''
						)
					)}
				/>
			</InfoRowControl>

			<NumericRowControl
				label={upperFirst(t('decimalPlace', { count: 0 }))}
				value={unitPref.round}
				onUpdate={(newValue) =>
					onChange({
						...unitPref,
						round: newValue,
					})
				}
				validate={(val) => val >= 0 && val <= 20}
				style={styles.decimalPlace}
			/>
		</Fragment>
	);
};

const UnitPrefControl = () => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const unitPrefs = useAppSelector(selectUnitPrefs);

	return (
		<ListItemModalControl
			anchorLabel={t('unitPref', { count: 0 })}
			anchorIcon={({ color }) => (
				<Icon
					source="alphabet-greek"
					size={25}
					color={color}
				/>
			)}
			header={t('unitPref', { count: 0 })}
			hasHeaderBackPress={true}
		>
			{Object.keys(unitPrefs).map((key) => (
				<UnitControl
					key={key}
					unitKey={key}
					unitPref={unitPrefs[key]}
					onChange={(newPref) => {
						dispatch(
							setUnitPrefs({
								...unitPrefs,
								[key]: newPref,
							})
						);
					}}
				/>
			))}
		</ListItemModalControl>
	);
};

const styles = StyleSheet.create({
	unitLabel: { marginTop: 0, marginBottom: -32 },
	decimalPlace: { marginTop: -24, marginBottom: 0 },
});

export default UnitPrefControl;
