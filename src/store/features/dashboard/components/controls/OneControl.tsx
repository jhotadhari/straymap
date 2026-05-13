/**
 * External dependencies
 */
import React, { FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { List, useTheme } from 'react-native-paper';
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
import { selectDashboardStyle } from '../../selectors';
import { setDashboardStyle } from '../../dashboardSlice';

const OneControl: FC<{
	position: string;
}> = ({ position }) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const dashboardStyle = useAppSelector(selectDashboardStyle);

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
				<View style={{ opacity: 0.5 }}>
					<List.Icon
						{...props}
						icon="view-dashboard"
					/>
				</View>

				<View
					style={{
						position: 'absolute',
						zIndex: 9,
					}}
				>
					<List.Icon
						{...props}
						icon={'top' === position ? 'arrow-up' : 'arrow-down'}
					/>
				</View>
			</View>
		),
		[position]
	);

	return (
		<List.Accordion
			title={sprintf('%s dashboard ... ???', position)}
			left={ControlIcon}
			expanded={expanded}
			onPress={handleAccordionPress}
			titleStyle={theme.fonts.bodyMedium}
		>
			<View style={styles.controls}>
				<AlignmentControl />

				<NumericRowControl
					label={t('fontSize')}
					optKey={'fontSize'}
					options={dashboardStyle}
					setOptions={({ fontSize }) => {
						dispatch(
							setDashboardStyle({
								...dashboardStyle,
								fontSize,
							})
						);
					}}
					validate={(val) => val >= 0}
					Info={t('hint.dashboard.fontSize')}
				/>
			</View>
		</List.Accordion>
	);
};

const styles = StyleSheet.create({
	controls: {
		maxWidth: '70%',
		marginBottom: 25,
	},
});

export default OneControl;
