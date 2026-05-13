/**
 * External dependencies
 */
import React, { FC, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, List, Text, useTheme } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { Style } from 'react-native-paper/lib/typescript/components/List/utils';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { setElementExpanded } from '../../../ui/uiSlice';
import { selectElementExpanded } from '../../../ui/selectors';
import { selectMapEventRate } from '../../../general/selectors';
import { NumericRowControl } from '../../../../../components/generic/controls/NumericRowControls';
import { setMapEventRate } from '../../../general/generalSlice';
import { stylesGeneric } from '../../../baseMap/components/controls/layers/LayersControl';
import AlignmentControl from './AlignmentControl';
import { selectDashboardStyle, selectEditItem } from '../../selectors';
import { setDashboardStyle } from '../../dashboardSlice';
import * as elements from '../../elements';
import { get } from 'lodash-es';
import { DashboardElement } from '../../types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const ICON_SIZE = 24;



const ItemControl: FC<{}> = ({}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const dashboardStyle = useAppSelector(selectDashboardStyle);
	const editItem = useAppSelector(selectEditItem);

	const uiStateKey = 'dashboardControlItem';
	const notExpanded = useAppSelector((state) => selectElementExpanded(state, uiStateKey));
	const handleAccordionPress = useCallback(() => {
		dispatch(
			setElementExpanded({
				key: uiStateKey,
				expanded: !notExpanded,
			})
		);
	}, [
		notExpanded,
		uiStateKey,
	]);

	const { label, ControlComponent, IconComponent, hasStyleControl, defaultMinWidth } = useMemo(
		() =>
			editItem?.elementType
				? get(elements as { [itemKey: string]: DashboardElement }, editItem?.elementType)
				: {
						label: undefined,
						ControlComponent: undefined,
						IconComponent: undefined,
						hasStyleControl: undefined,
						defaultMinWidth: undefined,
					},
		[editItem?.elementType]
	);

	useEffect(() => {
		console.log('debug ControlComponent', ControlComponent); // debug
	}, [ControlComponent]);

	const ControlIcon = useCallback(
		({ color, style }: { color: string; style: Style }) => {
			return !IconComponent ? undefined : (
				<View
					style={[
						stylesCopyPaper.item,
						style,
					]}
					pointerEvents="box-none"
				>
					<IconComponent
						size={ICON_SIZE}
						color={color}
					/>
				</View>
			);
		},
		[IconComponent]
	);

	return (
		editItem && (
			<List.Accordion
				title={'dashboard item ... ???'}
				left={ControlIcon}
				expanded={!notExpanded}
				onPress={handleAccordionPress}
				titleStyle={theme.fonts.bodyMedium}
			>
				<View style={styles.controls}>
					<Text>{editItem.key}</Text>

					{ControlComponent && <ControlComponent item={editItem} />}
				</View>
			</List.Accordion>
		)
	);
};

const styles = StyleSheet.create({
	controls: {
		maxWidth: '70%',
		marginBottom: 25,
	},

	// controlIcon:
	// {
	//     margin: number;
	//     height: number;
	//     width: number;
	//     alignItems: "center";
	//     justifyContent: "center";
	// }
});

const stylesCopyPaper = StyleSheet.create({
	item: {
		margin: 8,
		height: 40,
		width: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	itemV3: {
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default ItemControl;
