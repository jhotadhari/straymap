/**
 * External dependencies
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List, Text, useTheme } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { Style } from 'react-native-paper/lib/typescript/components/List/utils';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { setElementExpanded } from '../../../ui/uiSlice';
import { selectElementExpanded } from '../../../ui/selectors';
import { selectEditItem } from '../../selectors';
import { removeItemKey } from '../../dashboardSlice';
import * as elements from '../../elements';
import { get } from 'lodash-es';
import { DashboardElement } from '../../types';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import ItemStyleControl from './ItemStyleControl';

const ICON_SIZE = 24;

const ItemControl: FC<{}> = ({}) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const dispatch = useAppDispatch();

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

	// Force remount of all children on item key change.
	const [show, setShow] = useState(false);
	useEffect(() => {
		setShow(false);
		setTimeout(() => {
			if (editItem?.key) {
				setShow(true);
			}
		}, 1);
	}, [editItem?.key]);

	const { label, Control, Icon, hasStyleControl, defaultMinWidth } = useMemo(
		() =>
			editItem?.elementType
				? get(elements as { [itemKey: string]: DashboardElement }, editItem?.elementType)
				: {
						label: undefined,
						Control: undefined,
						Icon: undefined,
						hasStyleControl: undefined,
						defaultMinWidth: undefined,
					},
		[editItem?.elementType]
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

	return (
		editItem && (
			<List.Accordion
				title={sprintf('??? dashboard item: %s', t(label ?? ''))}
				left={ControlIcon}
				expanded={!notExpanded}
				onPress={handleAccordionPress}
				titleStyle={theme.fonts.bodyMedium}
			>
				{show && (
					<View style={styles.controls}>
						{__DEV__ && (
							<InfoRowControl label={'Key'}>
								<Text>{editItem.key}</Text>
							</InfoRowControl>
						)}

						{Control && <Control item={editItem} />}

						{hasStyleControl && <ItemStyleControl />}

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
									dispatch(
										removeItemKey({
											position,
											itemKey: editItem.key,
										})
									)
								}
							>
								{t('remove Item ???')}
							</ButtonHighlight>
						</View>
					</View>
				)}
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
