/**
 * External dependencies
 */
import React, { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List, SegmentedButtons, useTheme } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { Style } from 'react-native-paper/lib/typescript/components/List/utils';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { setElementExpanded } from '../../../ui/slice';
import { selectElementExpanded } from '../../../ui/selectors';
import NumericRowControl from '../../../../../components/generic/controls/NumericRowControl';
import { sharedStyles } from '../../../../../sharedStyles';
import AlignmentControl from './AlignmentControl';
import { selectDashboardStyle, selectEditItem } from '../../selectors';
import { setDashboardStyle, setEditItemAccordingToPosition } from '../../slice';
import { ControlContext } from '../../ControlContext';
import NewItemControl from './NewItemControl';

const validateFontSize = (val: number) => val > 0 && val <= 300;

const DashboardControl: FC = () => {
	const { t } = useTranslation();
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const { position: editItemPosition, item } = useAppSelector(selectEditItem);
	useEffect(() => {
		if (item?.key) {
			setPosition(editItemPosition);
		}
	}, [editItemPosition, item?.key]);

	const [position, setPosition_] = useState(editItemPosition);

	const setPosition = useCallback(
		(newPosition: string) => {
			setPosition_(newPosition);

			if (!item?.key || (item?.key && editItemPosition != newPosition)) {
				dispatch(setEditItemAccordingToPosition(newPosition));
			}
		},
		[
			item?.key,
			editItemPosition,
			position,
		]
	);

	const dashboardStyle = useAppSelector((state) => selectDashboardStyle(state, position));

	const uiStateKey = 'dashboardControl' + position;
	const expanded = useAppSelector((state) => selectElementExpanded(state, uiStateKey));
	const handleAccordionPress = useCallback(() => {
		dispatch(
			setElementExpanded({
				key: uiStateKey,
				expanded: !expanded,
			})
		);
	}, [expanded, uiStateKey]);

	const handleUpdateFontSize = useCallback(
		(newValue: number) => {
			dispatch(
				setDashboardStyle({
					position,
					style: {
						...dashboardStyle,
						fontSize: newValue,
					},
				})
			);
		},
		[
			dispatch,
			position,
			dashboardStyle,
		]
	);

	const ControlIcon: (props: { color: string; style: Style }) => ReactNode = useCallback(
		(props) => (
			<View style={sharedStyles.controlIcon}>
				<List.Icon
					{...props}
					icon={
						'top' === position
							? 'arrow-up-bold-box-outline'
							: 'arrow-down-bold-box-outline'
					}
				/>
			</View>
		),
		[position]
	);

	const segmentedButtonsTheme = useMemo(
		() => ({
			colors: {
				secondaryContainer: theme.colors.primaryContainer,
				textColor: theme.colors.onPrimaryContainer,
			},
		}),
		[theme.colors.primaryContainer, theme.colors.onPrimaryContainer]
	);

	const positionButtons = useMemo(
		() => [
			{
				value: 'bottom',
				label: t('bottom'),
				icon: 'arrow-down',
			},
			{
				value: 'top',
				label: t('top'),
				icon: 'arrow-up',
			},
		],
		[t]
	);

	return (
		<ControlContext.Provider
			value={{
				position,
			}}
		>
			<List.Accordion
				title={t('dashboard.dashboard')}
				left={ControlIcon}
				expanded={expanded}
				onPress={handleAccordionPress}
				titleStyle={theme.fonts.bodyMedium}
			>
				<View style={styles.controls}>
					<SegmentedButtons
						value={position}
						onValueChange={setPosition}
						theme={segmentedButtonsTheme}
						buttons={positionButtons}
					/>

					<AlignmentControl position={position} />

					<NumericRowControl
						label={t('dashboard.fontSize')}
						value={dashboardStyle?.fontSize}
						onUpdate={handleUpdateFontSize}
						validate={validateFontSize}
						Info={t('dashboard.hint.fontSize')}
					/>

					<View style={styles.newItemRow}>
						{/* <InfoButton
							label={t('dashboard.dashboardItem', { count: 0 })}
							headerPlural={true}
							backgroundBlur={false}
							Info={t('dashboard.hint.items')}
							buttonProps={{
								style: { marginTop: 0, marginBottom: 0 },
								icon: 'information-variant',
								mode: 'outlined',
								iconColor: theme.colors.primary,
							}}
						/> */}

						<NewItemControl />
					</View>
				</View>
			</List.Accordion>
		</ControlContext.Provider>
	);
};

const styles = StyleSheet.create({
	controls: {
		marginBottom: 25,
		paddingRight: 32,
		gap: 16,
	},
	newItemRow: {
		justifyContent: 'flex-end',
		flexDirection: 'row',
		marginBottom: 15,
	},
});

export default DashboardControl;
