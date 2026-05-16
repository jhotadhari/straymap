/**
 * External dependencies
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Icon, Menu, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { upperFirst, get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../../../../types';
import ListItemModalControl from '../../../../../components/generic/controls/ListItemModalControl';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import MenuItem from '../../../../../components/generic/MenuItem';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import { NumericRowControl } from '../../../../../components/generic/controls/NumericRowControls';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectUnitPrefs } from '../../selectors';
import { setUnitPrefs } from '../../generalSlice';
import { UnitPref } from '../../types';

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
	const [menuVisible, setMenuVisible] = useState(false);

	const opts = get(options, unitKey, []);
	const Info = get(hints, unitKey);

	return (
		<View style={{ marginBottom: 30 }}>
			<InfoRowControl
				label={upperFirst(t(unitKey))}
				style={{ marginTop: 0, marginBottom: 0 }}
				labelStyle={theme.fonts.titleLarge}
				Info={Info && 'string' === typeof Info ? t(Info) : Info}
			/>

			<InfoRowControl
				label={t('unit')}
				style={{ marginTop: 0, marginBottom: 0 }}
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
							<Text>
								{t(
									get(
										opts.find((opt) => opt.key === unitPref.unit),
										'label',
										''
									)
								)}
							</Text>
						</ButtonHighlight>
					}
				>
					{opts &&
						[...opts].map((opt) => (
							<MenuItem
								key={opt.key}
								onPress={() => {
									setMenuVisible(false);
									onChange({
										...unitPref,
										unit: opt.key,
									});
								}}
								title={t(opt.label)}
								active={opt.key === unitPref.unit}
							/>
						))}
				</Menu>
			</InfoRowControl>

			<NumericRowControl
				label={upperFirst(t('decimalPlace', { count: 0 }))}
				optKey={'round'}
				options={unitPref}
				setOptions={onChange}
				validate={(val) => val >= 0 && val <= 20}
				style={{ marginTop: 0, marginBottom: 0 }}
			/>
		</View>
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

export default UnitPrefControl;
