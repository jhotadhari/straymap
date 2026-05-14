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
import { removeItemKey, setDashboardStyle } from '../../dashboardSlice';
import * as elements from '../../elements';
import { get } from 'lodash-es';
import { DashboardElement } from '../../types';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import InfoButton from '../../../../../components/generic/InfoButton';

const ICON_SIZE = 24;

const ItemControl: FC<{}> = ({}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const dashboardStyle = useAppSelector(selectDashboardStyle);
	const { position, editItem } = useAppSelector(selectEditItem);

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
						style,
						styles.icon,
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
				title={ sprintf(
					'??? dashboard item: %s',
					t( label ?? '' )
				) }
				left={ControlIcon}
				expanded={!notExpanded}
				onPress={handleAccordionPress}
				titleStyle={theme.fonts.bodyMedium}
			>
				<View style={styles.controls}>
					<Text>{editItem.key}</Text>


					{ControlComponent && <ControlComponent item={editItem} />}

					{/* style component */}


					{/* has linebreak after component */}


					<View
						style={{
							justifyContent: 'flex-end',
							flexDirection: 'row',
						}}
					>
						<ButtonHighlight
							icon="delete-outline"
							mode="outlined"
							onPress={() =>
								dispatch( removeItemKey({
									position,
									itemKey: editItem.key,
								}) )
							}
						>
							{t('remove Item ???')}
						</ButtonHighlight>
					</View>

				</View>
			</List.Accordion>
		)
	);
};

const styles = StyleSheet.create({
	controls: {
		// maxWidth: '70%',
		marginBottom: 25,
		paddingRight: 16,
	},
	icon: {
		marginRight: -16,
		height: 40,
		width: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default ItemControl;
