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


const ItemMinWidthControl = (
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
			<NumericRowControl
				label={t('minWidth')}
				optKey={'minWidth'}
				options={get(item, 'style', {})}
				setOptions={(newStyle) => {
					const newEditElement = {
						...item,
						style: newStyle,
					};
					// updateElement(newEditElement as DashboardItem);
				}}
				validate={(val) => val >= 0}
				Info={t('hint.dashboard.item.minWidth')}
			/>
		</View>
	);
};

export default ItemMinWidthControl;
