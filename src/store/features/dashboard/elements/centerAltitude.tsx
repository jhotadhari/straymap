/**
 * External dependencies
 */
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Menu, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { upperFirst, get, set } from 'lodash-es';
import { View } from 'react-native';
import convertUnits from 'convert-units';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import MenuItem from '../../../../components/generic/MenuItem';
import InfoRowControl from '../../../../components/generic/controls/InfoRowControl';
import { options as unitPrefControlOptions } from '../../general/components/controls/UnitPrefControl';
import { TFunction } from 'i18next';
import { roundTo } from '../../../../lib/utilsGeneral';
import { NumericRowControl } from '../../../../components/generic/controls/NumericRowControls';
import { MapContext } from '../../../../Context';
import { styles as mdStyles } from '../../../../markdown/styles';
import { selectMapEventRate } from '../../general/selectors';
import { useAppSelector } from '../../../hooks';
import {
	DashboardDisplayComponentProps,
	DashboardElementConf,
} from '../../dashboard/types';
import { UnitPref } from '../../general/types';
import { selectHgtDirPath } from '../../baseMap/selectors';

const opts = [
	{
		key: 'default',
		label: 'useUnitPref',
	},
	...unitPrefControlOptions.heightDepth,
];

const ControlComponent = ({
	editElement,
	updateElement,
	unitPrefs,
}: {
	editElement: null | DashboardElementConf;
	updateElement: (newElement: DashboardElementConf) => void;
	unitPrefs?: { [value: string]: UnitPref };
}) => {
	const hgtDirPath = useAppSelector(selectHgtDirPath);

	const { t } = useTranslation();
	const theme = useTheme();
	const [menuVisible, setMenuVisible] = useState(false);

	const activeOpt = opts.find(
		(opt) =>
			opt.key ===
			get(editElement, [
				'options',
				'unit',
				'key',
			])
	);

	const presetUnit = () => {
		if (!activeOpt) {
			const newEditElement = { ...editElement };
			set(
				newEditElement,
				[
					'options',
					'unit',
					'key',
				],
				'default'
			);
			set(
				newEditElement,
				[
					'options',
					'unit',
					'round',
				],
				2
			);
			updateElement(newEditElement as DashboardElementConf);
		}
	};
	useEffect(() => presetUnit(), []);
	useEffect(() => presetUnit(), [activeOpt]);

	return activeOpt ? (
		<View>
			{!hgtDirPath && (
				<View
					style={{
						...get(mdStyles(theme), 'blockquote'),
						marginVertical: 10,
						paddingVertical: 10,
						marginLeft: 0,
						borderColor: theme.colors.errorContainer,
					}}
				>
					<Text>{t('hint.dashboard.missingHgtDirPath')}</Text>
				</View>
			)}

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
							<Text>{t(get(activeOpt, 'label', ''))}</Text>
						</ButtonHighlight>
					}
				>
					{[...opts].map((opt) => (
						<MenuItem
							key={opt.key}
							onPress={() => {
								setMenuVisible(false);
								const newEditElement = { ...editElement };
								set(
									newEditElement,
									[
										'options',
										'unit',
										'key',
									],
									opt.key
								);
								updateElement(newEditElement as DashboardElementConf);
							}}
							title={t(opt.label)}
							active={activeOpt ? opt.key === activeOpt.key : false}
							style={
								'default' === activeOpt.key &&
								unitPrefs &&
								unitPrefs?.heightDepth?.unit === opt.key
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

			{activeOpt && 'default' !== activeOpt.key && (
				<NumericRowControl
					label={upperFirst(t('decimalPlace', { count: 0 }))}
					optKey={'round'}
					options={get(editElement, ['options', 'unit'], {})}
					setOptions={(newUnit) => {
						const newEditElement = { ...editElement };
						set(newEditElement, ['options', 'unit'], newUnit);
						updateElement(newEditElement as DashboardElementConf);
					}}
					validate={(val) => val >= 0}
				/>
			)}
		</View>
	) : null;
};

const formatOutput = (
	altitudeM: number | null,
	unit: UnitPref,
	t: TFunction<'translation', undefined>
): string => {
	if (null === altitudeM) {
		return '-';
	}
	switch (unit.unit) {
		case 'ft':
			return roundTo(convertUnits(altitudeM).from('m').to('ft'), unit.round) + ' ft';
		case 'fath':
			return roundTo(altitudeM * 0.5468066492, unit.round) + ' fathom';
		default:
			return roundTo(altitudeM, unit.round) + ' m';
	}
};

const DisplayComponent = ({
	dashboardElement,
	style = {},
	unitPrefs,
	dashboardStyle,
}: DashboardDisplayComponentProps) => {
	const mapEventRate = useAppSelector(selectMapEventRate);

	const { t } = useTranslation();

	const { currentMapEventRef } = useContext(MapContext);

	const unit =
		'default' ===
		get(
			dashboardElement,
			[
				'options',
				'unit',
				'key',
			],
			'default'
		)
			? {
					...get(unitPrefs, 'heightDepth'),
					key: get(unitPrefs, ['heightDepth', 'unit']),
				}
			: {
					...get(dashboardElement, ['options', 'unit']),
					unit: get(dashboardElement, [
						'options',
						'unit',
						'key',
					]),
				};

	let fontSize = get(dashboardElement, ['style', 'fontSize'], 'default');
	fontSize = 'default' === fontSize ? dashboardStyle.fontSize : fontSize;

	const [altitudeM, setAltitudeM] = useState<number | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		intervalRef.current = setInterval(() => {
			setAltitudeM(currentMapEventRef?.current?.center?.alt || null);
		}, mapEventRate);
		return () => {
			intervalRef.current && clearInterval(intervalRef.current);
		};
	}, [mapEventRate]);

	return (
		<View
			style={{
				minWidth: get(dashboardElement, ['style', 'minWidth'], undefined),
				...style,
			}}
		>
			<Text
				style={{
					fontSize,
				}}
			>
				{formatOutput(altitudeM, unit, t)}
			</Text>
		</View>
	);
};

export default {
	key: 'centerAltitude',
	label: 'centerAltitude',
	DisplayComponent,
	ControlComponent,
	hasStyleControl: true,
	shouldSetHgtDirPath: true,
	defaultMinWidth: 75,
	responseInclude: { center: 2 },
};
