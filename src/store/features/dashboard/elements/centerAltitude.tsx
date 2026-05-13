/**
 * External dependencies
 */
import React, { FC, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Menu, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { upperFirst, get, set } from 'lodash-es';
import { GestureResponderEvent, TouchableHighlight, View } from 'react-native';
import convertUnits from 'convert-units';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import MenuItem from '../../../../components/generic/MenuItem';
import InfoRowControl from '../../../../components/generic/controls/InfoRowControl';
import { options as unitPrefControlOptions } from '../../general/components/controls/UnitPrefControl';
import { roundTo } from '../../../../lib/utilsGeneral';
import { NumericRowControl } from '../../../../components/generic/controls/NumericRowControls';
import { MapContext } from '../../../../Context';
import { styles as mdStyles } from '../../../../markdown/styles';
import { selectMapEventRate, selectUnitPrefs } from '../../general/selectors';
import { useAppSelector } from '../../../hooks';
import { DashboardElement, DashboardElementProps, DashboardItemOptionsBase } from '../types';
import { UnitPref } from '../../general/types';
import { selectHgtDirPath } from '../../baseMap/selectors';
import { selectDashboardStyle } from '../selectors';

const opts = [
	{
		key: 'default',
		label: 'useUnitPref',
	},
	...unitPrefControlOptions.heightDepth,
];

const ControlComponent: FC<DashboardElementProps> = ({
	item,
	// updateElement,
}) => {
	const hgtDirPath = useAppSelector(selectHgtDirPath);
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const { t } = useTranslation();
	const theme = useTheme();
	const [menuVisible, setMenuVisible] = useState(false);

	const activeOpt = opts.find(
		(opt) =>
			opt.key ===
			get(item, [
				'options',
				'unit',
				'key',
			])
	);

	const presetUnit = () => {
		if (!activeOpt) {
			const newEditElement = { ...item };
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
			// updateElement(newEditElement as DashboardItem);
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
								const newEditElement = { ...item };
								set(
									newEditElement,
									[
										'options',
										'unit',
										'key',
									],
									opt.key
								);
								// updateElement(newEditElement as DashboardItem);
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
					options={get(item, ['options', 'unit'], {})}
					setOptions={(newUnit) => {
						const newEditElement = { ...item };
						set(newEditElement, ['options', 'unit'], newUnit);
						// updateElement(newEditElement as DashboardItem);
					}}
					validate={(val) => val >= 0}
				/>
			)}
		</View>
	) : null;
};

interface Options extends DashboardItemOptionsBase {
	unitPref?: UnitPref;
}

const formatOutput = (altitudeM: number | null, unit: UnitPref): string => {
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

const DisplayComponent: FC<DashboardElementProps<Options>> = ({ item, style = {}, onPress }) => {
	const handlePress = useMemo(() => {
		if (onPress) {
			return (event: GestureResponderEvent) => onPress(item.key, event);
		}
	}, [
		onPress,
		item.key,
	]);

	const mapEventRate = useAppSelector(selectMapEventRate);
	const dashboardStyle = useAppSelector(selectDashboardStyle);
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const { currentMapEventRef } = useContext(MapContext);

	const unitPref = item?.options?.unitPref ?? get(unitPrefs, 'heightDepth');

	const fontSize = item?.options?.fontSize ?? dashboardStyle.fontSize;

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
		<TouchableHighlight onPress={handlePress}>
			<View
				style={{
					minWidth: get(item, ['style', 'minWidth'], undefined),
					...style,
				}}
			>
				<Text
					style={{
						fontSize,
					}}
				>
					{formatOutput(altitudeM, unitPref)}
				</Text>
			</View>
		</TouchableHighlight>
	);
};

const IconComponent: FC<{
	color: string;
	size: number;
}> = ({ color, size }) => {
	return (
		<MaterialIcons
			color={color}
			size={size}
			name="photo"
		/>
	);
	// return (
	// 	<Icon
	// 		source={'cog'}
	// 		size={size}
	// 		color={color}
	// 	/>
	// );
};

export default {
	key: 'centerAltitude',
	label: 'centerAltitude',
	DisplayComponent,
	ControlComponent,
	IconComponent,
	hasStyleControl: true,
	shouldSetHgtDirPath: true,
	defaultMinWidth: 75,
	responseInclude: { center: 2 },
} as DashboardElement<Options>;
