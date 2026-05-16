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
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { setElementExpanded } from '../../../ui/uiSlice';
import { selectElementExpanded } from '../../../ui/selectors';
import { selectEditItem, selectItemsCount } from '../../selectors';
import { moveItem, removeItemKey } from '../../dashboardSlice';
import * as elements from '../../elements';
import { get } from 'lodash-es';
import { DashboardElement } from '../../types';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import { ControlContext } from '../../ControlContext';

const ICON_SIZE = 24;

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
				? get(elements as { [itemKey: string]: DashboardElement }, item?.elementType)
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
					style={[
						style,
						styles.icon,
					]}
					pointerEvents="box-none"
				>
					<Icon
						size={ICON_SIZE}
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
		[position, item?.key]
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
		[position, item?.key]
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
		[position, item?.key]
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

	return (
		item && (
			<ControlContext.Provider
				value={{
					position,
				}}
			>
				<List.Accordion
					// title={t('dashboard.dashboardItem')}
					title={sprintf(t('dashboard.dashboardItem') + ': %s', t(label ?? ''))}
					left={ControlIcon}
					expanded={!notExpanded}
					onPress={handleAccordionPress}
					titleStyle={theme.fonts.bodyMedium}
				>
					<View
						style={
							undefined === accuHeight
								? undefined
								: {
										minHeight: accuHeight,
									}
						}
					>
						{show && (
							<View
								style={styles.controls}
								onLayout={handleLayout}
							>
								{__DEV__ && (
									<InfoRowControl label={'Key'}>
										<Text>{item.key}</Text>
									</InfoRowControl>
								)}

								{Control && <Control item={item} />}

								<View
									style={{
										justifyContent: 'space-between',
										flexDirection: 'row',
										// marginTop: 20,
									}}
								>
									<ButtonHighlight
										mode="outlined"
										onPress={0 === idx ? undefined : handleMoveLeft}
										disabled={0 === idx}
									>
										<IconPaper
											source={'chevron-left'}
											size={20}
										/>
									</ButtonHighlight>

									<ButtonHighlight
										mode="outlined"
										onPress={
											itemsCount - 1 === idx ? undefined : handleMoveRight
										}
										disabled={itemsCount - 1 === idx}
									>
										<IconPaper
											source={'chevron-right'}
											size={20}
										/>
									</ButtonHighlight>

									<ButtonHighlight
										icon="delete-outline"
										mode="outlined"
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
});

export default ItemControl;
