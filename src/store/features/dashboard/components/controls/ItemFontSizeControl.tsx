/**
 * External dependencies
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List, Menu, Text, useTheme } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { Style } from 'react-native-paper/lib/typescript/components/List/utils';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { setElementExpanded } from '../../../ui/uiSlice';
import { selectElementExpanded } from '../../../ui/selectors';
import { selectDashboardStyle, selectEditItem } from '../../selectors';
import { removeItemKey } from '../../dashboardSlice';
import * as elements from '../../elements';
import { get, isNumber, set } from 'lodash-es';
import { DashboardItem } from '../../types';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import MenuItem from '../../../../../components/generic/MenuItem';
import { NumericRowControl } from '../../../../../components/generic/controls/NumericRowControls';

const ICON_SIZE = 24;

const StyleControlFontSize = (
	{
		// editItem,
		// updateElement,
	}: {
		// editItem: null | DashboardItem;
		// updateElement: (newElement: DashboardItem) => void;
	}
) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const { position, item } = useAppSelector(selectEditItem);

	const [menuVisible, setMenuVisible] = useState(false);

	const [numVal, setNumVal] = useState(
		isNumber(get(item, ['style', 'fontSize']))
			? get(item, ['style', 'fontSize'])
			: theme.fonts.bodyMedium.fontSize
	);

	const opts = [
		{
			key: 'default',
			label: 'default',
		},
		{
			key: 'custom',
			label: 'custom',
		},
	];

	const activeOpt =
		'default' === get(item, ['style', 'fontSize'])
			? opts.find((opt) => opt.key === 'default')
			: opts.find((opt) => opt.key === 'custom');

	return (
		<View>
			<InfoRowControl
				label={t('fontSize')}
				Info={t('hint.dashboard.item.fontSize')}
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
									['style', 'fontSize'],
									'default' === opt.key ? opt.key : numVal
								);
								// updateElement(newEditElement as DashboardItem);
							}}
							title={t(opt.label)}
							active={activeOpt ? opt.key === activeOpt.key : false}
						/>
					))}
				</Menu>
			</InfoRowControl>

			{activeOpt && 'custom' === activeOpt.key && (
				<NumericRowControl
					optKey={'fontSize'}
					options={get(item, 'style', {})}
					setOptions={(newStyle) => {
						const newEditElement = {
							...item,
							style: newStyle,
						};
						// updateElement(newEditElement as DashboardItem);
						setNumVal(newStyle['fontSize']);
					}}
					validate={(val) => val > 0}
				/>
			)}
		</View>
	);
};

const ItemFontSizeControl = (
	{
		// editItem,
		// updateElement,
	}: {
		// editItem: null | DashboardItem;
		// updateElement: (newElement: DashboardItem) => void;
	}
) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const { position, item } = useAppSelector(selectEditItem);

	const presetStyle = () => {
		if (!item?.style) {
			const newEditElement = {
				...item,
				style: {
					fontSize: 'default',
					minWidth: get(elements, [item?.elementType || '', 'defaultMinWidth'], 75),
				},
			};
			// updateElement(newEditElement as DashboardItem);
		}
	};
	useEffect(() => presetStyle(), []);
	useEffect(() => presetStyle(), [item?.style]);

	return (
		<View>
			<StyleControlFontSize />
		</View>
	);
};

export default ItemFontSizeControl;
