/**
 * External dependencies
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List, Text, useTheme } from 'react-native-paper';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Style } from 'react-native-paper/lib/typescript/components/List/utils';
import { sprintf } from 'sprintf-js';
import { Icon as IconPaper } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { setElementExpanded } from '../../../ui/slice';
import { selectElementExpanded } from '../../../ui/selectors';
import { selectEditItem, selectItemsCount } from '../../selectors';
import { moveItem, removeItemKey } from '../../slice';
import { get } from 'lodash-es';
import { DashboardWidget } from '../../types';
import { featureRegistry } from '../../../FeatureRegistry';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import { ControlContext } from '../../ControlContext';
import { DASHBOARD_ICON_SIZE } from '../../../../constants';
import ItemShowLabelControl from './ItemShowLabelControl';
import ItemShowIconControl from './ItemShowIconControl';
import { useButtonProps } from '../../../../compose/useButtonProps';

const ItemControl: FC<{}> = ({}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const { position, item, idx } = useAppSelector(selectEditItem);

	const itemsCount = useAppSelector((state) => selectItemsCount(state, position));

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
		dispatch,
		notExpanded,
		uiStateKey,
	]);

	// Force remount of all children on item key change.
	const [show, setShow] = useState(false);
	useEffect(() => {
		setShow(false);
		setTimeout(() => {
			if (item?.key) {
				setShow(true);
			}
		}, 1);
	}, [item?.key]);

	const { label, Control, Icon } = useMemo(
		() =>
			item?.elementType
				? get(
						featureRegistry.getDashboardWidgets() as {
							[itemKey: string]: DashboardWidget;
						},
						item?.elementType
					)
				: {
						label: undefined,
						Control: undefined,
						Icon: undefined,
					},
		[item?.elementType]
	);

	const ControlIcon = useCallback(
		({ color, style }: { color: string; style: Style }) => {
			return !Icon ? undefined : (
				<View
					style={[style, styles.icon]}
					pointerEvents="box-none"
				>
					<Icon
						size={DASHBOARD_ICON_SIZE}
						color={color}
					/>
				</View>
			);
		},
		[Icon]
	);

	const handleRemove = useCallback(
		() =>
			item?.key &&
			dispatch(
				removeItemKey({
					position,
					itemKey: item.key,
				})
			),
		[
			dispatch,
			position,
			item?.key,
		]
	);
	const handleMoveLeft = useCallback(
		() =>
			item?.key &&
			dispatch(
				moveItem({
					itemKey: item.key,
					direction: 'left',
				})
			),
		[
			dispatch,

			item?.key,
		]
	);
	const handleMoveRight = useCallback(
		() =>
			item?.key &&
			dispatch(
				moveItem({
					itemKey: item.key,
					direction: 'right',
				})
			),
		[
			dispatch,

			item?.key,
		]
	);

	const [accuHeight, setAccuHeight] = useState<number | undefined>(undefined);
	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			const { layout } = event.nativeEvent;
			if (!accuHeight || layout.height > accuHeight) {
				setAccuHeight(layout.height);
			}
		},
		[accuHeight]
	);
	useEffect(() => {
		if (!item?.key) {
			setAccuHeight(undefined);
		}
	}, [item?.key]);

	const styleAccordionContent = useMemo(
		() => (undefined === accuHeight ? undefined : { minHeight: accuHeight }),
		[accuHeight]
	);

	const { nestedIconColor: nestedIconColorLeft, ...buttonPropsLeft } = useButtonProps({
		mode: 'outlined',
		disabled: 0 === idx,
	});

	const { nestedIconColor: nestedIconColorRight, ...buttonPropsRight } = useButtonProps({
		mode: 'outlined',
		disabled: itemsCount - 1 === idx,
	});

	const buttonPropsRemove = useButtonProps({
		mode: 'outlined',
	});

	const controlContextValue = useMemo(
		() => ({ position }),
		[position]
	);

	return (
		item && (
			<ControlContext.Provider value={controlContextValue}>
				<List.Accordion
					title={sprintf(t('dashboard.dashboardItem') + ': %s', t(label ?? ''))}
					left={ControlIcon}
					expanded={!notExpanded}
					onPress={handleAccordionPress}
					titleStyle={theme.fonts.bodyMedium}
				>
					<View style={styleAccordionContent}>
						{show && (
							<View
								style={styles.controls}
								onLayout={handleLayout}
							>
								{__DEV__ && (
									<InfoLabelRow label={'Key'}>
										<Text>{item.key}</Text>
									</InfoLabelRow>
								)}

								{Control && <Control item={item} />}

								<ItemShowLabelControl
									buttonLabel={t('dashboard.followDashboardSetting')}
								/>
								<ItemShowIconControl
									buttonLabel={t('dashboard.followDashboardSetting')}
								/>

								<View style={styles.actionsRow}>
									<ButtonHighlight
										{...buttonPropsLeft}
										onPress={0 === idx ? undefined : handleMoveLeft}
									>
										<IconPaper
											source={'chevron-left'}
											size={20}
											color={nestedIconColorLeft}
										/>
									</ButtonHighlight>

									<ButtonHighlight
										{...buttonPropsRight}
										onPress={
											itemsCount - 1 === idx ? undefined : handleMoveRight
										}
									>
										<IconPaper
											source={'chevron-right'}
											size={20}
											color={nestedIconColorRight}
										/>
									</ButtonHighlight>

									<ButtonHighlight
										{...buttonPropsRemove}
										icon="delete-outline"
										onPress={handleRemove}
									>
										{t('remove')}
									</ButtonHighlight>
								</View>
							</View>
						)}
					</View>
				</List.Accordion>
			</ControlContext.Provider>
		)
	);
};

const styles = StyleSheet.create({
	controls: {
		marginBottom: 25,
		paddingRight: 32,
		gap: 16,
	},
	icon: {
		marginRight: -16,
		height: 40,
		width: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	actionsRow: {
		justifyContent: 'space-between',
		flexDirection: 'row',
	},
});

export default ItemControl;
