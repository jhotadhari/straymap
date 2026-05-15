/**
 * External dependencies
 */
import React, { FC, useEffect, useState } from 'react';
import { Menu, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { upperFirst, get, set } from 'lodash-es';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import MenuItem from '../../../../../components/generic/MenuItem';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import { options as unitPrefControlOptions } from '../../../general/components/controls/UnitPrefControl';
import { NumericRowControl } from '../../../../../components/generic/controls/NumericRowControls';
import { styles as mdStyles } from '../../../../../markdown/styles';
import { selectUnitPrefs } from '../../../general/selectors';
import { useAppSelector } from '../../../../hooks';
import { DashboardItem } from '../../types';
import { selectHgtDirPath } from '../../../baseMap/selectors';
import { Options } from './Display';

// const opts = [
// 	{
// 		key: 'default',
// 		label: 'useUnitPref',
// 	},
// 	...unitPrefControlOptions.heightDepth,
// ];

const Control: FC<{
	item: DashboardItem<Options>;
}> = ({
	item,
	// updateElement,
}) => {
	// const hgtDirPath = useAppSelector(selectHgtDirPath);
	// const unitPrefs = useAppSelector(selectUnitPrefs);

	const { t } = useTranslation();
	const theme = useTheme();
	// const [menuVisible, setMenuVisible] = useState(false);

	// const activeOpt = opts.find(
	// 	(opt) =>
	// 		opt.key ===
	// 		get(item, [
	// 			'options',
	// 			'unit',
	// 			'key',
	// 		])
	// );

	// const presetUnit = () => {
	// 	if (!activeOpt) {
	// 		const newEditElement = { ...item };
	// 		set(
	// 			newEditElement,
	// 			[
	// 				'options',
	// 				'unit',
	// 				'key',
	// 			],
	// 			'default'
	// 		);
	// 		set(
	// 			newEditElement,
	// 			[
	// 				'options',
	// 				'unit',
	// 				'round',
	// 			],
	// 			2
	// 		);
	// 		// updateElement(newEditElement as DashboardItem);
	// 	}
	// };
	// useEffect(() => presetUnit(), []);
	// useEffect(() => presetUnit(), [activeOpt]);

	return (
		<View>
			{/* {!hgtDirPath && (
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
			)} */}

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
			</InfoRowControl> */}

			{/* {activeOpt && 'default' !== activeOpt.key && (
				<NumericRowControl
					label={upperFirst(t('decimalPlace', { count: 0 }))}
					optKey={'round'}
					options={get(item, ['options', 'unit'], {})}
					setOptions={(newUnit) => {
						const newEditElement = { ...item };
						set(newEditElement, ['options', 'unit'], newUnit);
						// updateElement(newEditElement as DashboardItem);
					}}
					validate={(val) => val >= 0 && val <= 20 }
				/>
			)} */}
		</View>
	);
};

export default Control;
