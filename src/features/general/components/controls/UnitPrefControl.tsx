/**
 * External dependencies
 */
import React, { Fragment, useCallback, useMemo } from 'react';
import { StyleSheet, TextProps } from 'react-native';
import { Divider, Icon, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { upperFirst, get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../../../types';
import ListItemModalControl from '../../../../components/generic/wrapper/ListItemModalControl';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import NumericRowControl from '../../../../components/generic/controls/NumericRowControl';
import ToggleRowControl from '../../../../components/generic/controls/ToggleRowControl';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectUnitPrefs } from '../../selectors';
import { setUnitPrefs } from '../../slice';
import { UnitPref } from '../../types';
import { sharedStyles } from '../../../../sharedStyles';
import ButtonHighlightMenuControl from '../../../../components/generic/wrapper/ButtonHighlightMenuControl';

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
	coordsOrder: [
		{
			key: 'lat_lng',
			label: 'lat_lng',
		},
		{
			key: 'lng_lat',
			label: 'lng_lat',
		},
		{
			key: 'lat',
			label: 'lat',
		},
		{
			key: 'lng',
			label: 'lng',
		},
	],
};

const hints = {
	heightDepth: 'general.hint.units.heightDepth',
};

const validateDecimalPlace = (val: number) => val >= 0 && val <= 20;

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

	const handleUnitChange = useCallback(
		(newValue: string) => {
			onChange({
				...unitPref,
				unit: newValue,
			});
		},
		[onChange, unitPref]
	);

	const handleRoundUpdate = useCallback(
		(newValue: number) => {
			onChange({
				...unitPref,
				round: newValue,
			});
		},
		[onChange, unitPref]
	);

	const handleCoordsPadLngToggle = useCallback(() => {
		onChange({
			...unitPref,
			coordsPadLng: !unitPref.coordsPadLng,
		});
	}, [onChange, unitPref]);

	const handleCoordsPadLatToggle = useCallback(() => {
		onChange({
			...unitPref,
			coordsPadLat: !unitPref.coordsPadLat,
		});
	}, [onChange, unitPref]);

	const handleCoordsForceNEToggle = useCallback(() => {
		onChange({
			...unitPref,
			coordsForceNE: !unitPref.coordsForceNE,
		});
	}, [onChange, unitPref]);

	const handleCoordsOrderChange = useCallback(
		(newValue: string) => {
			if (
				[
					'lat_lng',
					'lng_lat',
					'lat',
					'lng',
				].includes(newValue as string)
			) {
				onChange({
					...unitPref,
					coordsOrder: newValue as UnitPref['coordsOrder'],
				});
			}
		},
		[onChange, unitPref]
	);

	const labelStyle: TextProps['style'] = useMemo(
		() => [
			theme.fonts.titleLarge,
			{
				width: '100%',
			},
		],
		[theme]
	);

	return (
		<Fragment>
			<InfoLabelRow
				label={upperFirst(t(unitKey))}
				labelStyle={labelStyle}
				Info={Info && 'string' === typeof Info ? t(Info) : Info}
			/>

			<InfoLabelRow
				label={t('unit')}
				Info={t('general.hint.units.unit')}
			>
				<ButtonHighlightMenuControl
					options={opts}
					value={unitPref.unit}
					setValue={handleUnitChange}
					anchorLabel={t(
						get(
							opts.find((opt) => opt.key === unitPref.unit),
							'label',
							''
						)
					)}
				/>
			</InfoLabelRow>

			<NumericRowControl
				label={upperFirst(t('decimalPlace', { count: 0 }))}
				value={unitPref.round}
				onUpdate={handleRoundUpdate}
				validate={validateDecimalPlace}
				Info={t('general.hint.units.decimalPlaces')}
			/>

			{'coordinates' === unitKey && (
				<>
					<ToggleRowControl
						label={t('coordsPadLng')}
						value={unitPref.coordsPadLng ?? false}
						onToggle={handleCoordsPadLngToggle}
						Info={t('general.hint.units.coordsPadLng')}
						innerStyle={sharedStyles.alignStart}
					/>
					<ToggleRowControl
						label={t('coordsPadLat')}
						value={unitPref.coordsPadLat ?? false}
						onToggle={handleCoordsPadLatToggle}
						Info={t('general.hint.units.coordsPadLat')}
						innerStyle={sharedStyles.alignStart}
					/>
					<ToggleRowControl
						label={t('coordsForceNE')}
						value={unitPref.coordsForceNE ?? false}
						onToggle={handleCoordsForceNEToggle}
						Info={t('general.hint.units.coordsForceNE')}
						innerStyle={sharedStyles.alignStart}
					/>
					<InfoLabelRow
						label={t('coordsOrder')}
						Info={t('general.hint.units.coordsOrder')}
					>
						<ButtonHighlightMenuControl
							options={get(options, 'coordsOrder', [])}
							value={unitPref.coordsOrder ?? 'lat_lng'}
							setValue={handleCoordsOrderChange}
							anchorLabel={t(
								get(
									get(options, 'coordsOrder', []).find(
										(opt) => opt.key === (unitPref.coordsOrder ?? 'lat_lng')
									),
									'label',
									''
								)
							)}
						/>
					</InfoLabelRow>
				</>
			)}
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
		>
			{Object.keys(unitPrefs).map((key, idx) => (
				<Fragment key={key}>
					{idx !== 0 && (
						<Divider
							bold={true}
							style={styles.divider}
						/>
					)}
					<UnitControl
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
				</Fragment>
			))}
		</ListItemModalControl>
	);
};

const styles = StyleSheet.create({
	divider: { marginVertical: 8 },
});

export default UnitPrefControl;
