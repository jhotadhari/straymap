/**
 * External dependencies
 */
import React, { FC, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Icon, Menu, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { upperFirst, get, set } from 'lodash-es';
import { GestureResponderEvent, TouchableHighlight, View } from 'react-native';
import formatcoords from 'formatcoords';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import MenuItem from '../../../../components/generic/MenuItem';
import InfoRowControl from '../../../../components/generic/controls/InfoRowControl';
import { NumericRowControl } from '../../../../components/generic/controls/NumericRowControls';
import { options as unitPrefControlOptions } from '../../general/components/controls/UnitPrefControl';
import { MapContext } from '../../../../Context';
import { useAppSelector } from '../../../hooks';
import { selectMapEventRate, selectUnitPrefs } from '../../general/selectors';
import {
	DashboardElementProps,
	DashboardElement,
	DashboardItemOptionsBase,
} from '../types';
import { UnitPref } from '../../general/types';
import { selectDashboardStyle } from '../selectors';

const opts = [
	{
		key: 'default',
		label: 'useUnitPref',
	},
	...unitPrefControlOptions.coordinates,
];

const ControlComponent: FC<DashboardElementProps> = ({
	item,
	// updateElement,
}) => {
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
				4
			);
			// updateElement(newEditElement as DashboardItem);	// ???
		}
	};
	useEffect(() => presetUnit(), []);
	useEffect(() => presetUnit(), [activeOpt]);

	return (
		<View>
			{/* <InfoRowControl
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
								// updateElement(newEditElement as DashboardItem);	// ???
							}}
							title={t(opt.label)}
							active={activeOpt ? opt.key === activeOpt.key : false}
							style={
								'default' === activeOpt.key &&
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
			</InfoRowControl> */}

			{/* {activeOpt && 'default' !== activeOpt.key && ( */}
				<NumericRowControl
					label={upperFirst(t('decimalPlace', { count: 0 }))}
					optKey={'round'}
					options={get(item, ['options', 'unit'], {})}
					setOptions={(newUnit) => {
						// const newEditElement = { ...item };
						// set(newEditElement, ['options', 'unit'], newUnit);
						// // updateElement(newEditElement as DashboardItem);	// ???
					}}
					validate={(val) => val >= 0}
				/>
			{/* )} */}
		</View>
	);
};

interface Options extends DashboardItemOptionsBase {
	unitPref?: UnitPref;
}

const DisplayComponent: FC<DashboardElementProps<Options>> = ({ item, style = {}, onPress }) => {
	const handlePress = useMemo(() => {
		if (onPress) {
			return (event: GestureResponderEvent) => onPress(item.key, event);
		}
	}, [
		onPress,
		item.key,
	]);

	const dashboardStyle = useAppSelector(selectDashboardStyle);
	const unitPrefs = useAppSelector(selectUnitPrefs);
	const { currentMapEventRef } = useContext(MapContext);

	const mapEventRate = useAppSelector(selectMapEventRate);

	const [centerLng, setCenterLng] = useState<number | undefined>(undefined);
	const [centerLat, setCenterLat] = useState<number | undefined>(undefined);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	useEffect(() => {
		intervalRef.current = setInterval(() => {
			setCenterLng(currentMapEventRef?.current?.center?.lng);
			setCenterLat(currentMapEventRef?.current?.center?.lat);
		}, mapEventRate);
		return () => {
			intervalRef.current && clearInterval(intervalRef.current);
		};
	}, []);

	const unitPref = item?.options?.unitPref ?? get(unitPrefs, 'coordinates');

	const fontSize = item?.options?.fontSize ?? dashboardStyle.fontSize;

	return (
		<TouchableHighlight onPress={handlePress}>
			<View
				style={{
					minWidth: get(item, ['style', 'minWidth'], undefined),
					...style,
				}}
			>
				{undefined !== centerLng && undefined !== centerLat && (
					<Text
						style={{
							fontSize,
						}}
					>
						{formatcoords({
							lng: centerLng,
							lat: centerLat,
						}).format(
							get(
								{
									// https://www.npmjs.com/package/formatcoords#user-content-formatting
									dd: 'f',
									dmm: 'Ff',
									dms: 'FFf',
								},
								unitPref.unit,
								'f'
							),
							{
								decimalPlaces: unitPref.round,
							}
						)}
					</Text>
				)}
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
			name="compass-calibration"
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
	key: 'centerCoordinates',
	label: 'centerCoordinates',
	DisplayComponent,
	ControlComponent,
	IconComponent,
	hasStyleControl: true,
	defaultMinWidth: 200,
	responseInclude: { center: 2 },
} as DashboardElement<Options>;
