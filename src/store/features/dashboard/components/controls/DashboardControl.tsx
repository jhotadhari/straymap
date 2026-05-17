/**
 * External dependencies
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List, SegmentedButtons, useTheme } from 'react-native-paper';
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
import { NumericRowControl } from '../../../../../components/generic/controls/NumericRowControlsNew';
import { setMapEventRate } from '../../../general/generalSlice';
import { stylesGeneric } from '../../../baseMap/components/controls/layers/LayersControl';
import AlignmentControl from './AlignmentControl';
import { selectDashboardStyle, selectEditItem } from '../../selectors';
import { setDashboardStyle, setEditItemAccordingToPosition } from '../../dashboardSlice';
import { ControlContext } from '../../ControlContext';
import NewItemControl from './NewItemControl';
import InfoButton from '../../../../../components/generic/InfoButton';

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
	}, [
		expanded,
		uiStateKey,
	]);

	const ControlIcon: FC<{
		color: string;
		style: Style;
	}> = useMemo(
		() => (props) => (
			<View style={stylesGeneric.controlIcon}>
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
						theme={{
							colors: {
								secondaryContainer: theme.colors.primaryContainer,
								textColor: theme.colors.onPrimaryContainer,
							},
						}}
						buttons={[
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
						]}
					/>

					<AlignmentControl position={position} />

					<NumericRowControl
						label={t('dashboard.fontSize')}
						value={dashboardStyle?.fontSize}
						onUpdate={(newValue) => {
							dispatch(
								setDashboardStyle({
									position,
									style: {
										...dashboardStyle,
										fontSize: newValue,
									},
								})
							);
						}}
						validate={(val) => val > 0 && val <= 300}
						Info={t('dashboard.hint.fontSize')}
					/>

					<View
						style={{
							justifyContent: 'flex-end',
							flexDirection: 'row',
							marginBottom: 15,
						}}
					>
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
});

export default DashboardControl;
