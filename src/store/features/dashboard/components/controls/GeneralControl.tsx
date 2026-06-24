/**
 * External dependencies
 */
import React, { FC, ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { List, useTheme } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { Style } from 'react-native-paper/lib/typescript/components/List/utils';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { setElementExpanded } from '../../../ui/slice';
import { selectElementExpanded } from '../../../ui/selectors';
import { selectMapEventRate } from '../../../general/selectors';
import NumericRowControl from '../../../../../components/generic/controls/NumericRowControl';
import { setMapEventRate } from '../../../general/slice';
import { sharedStyles } from '../../../../../sharedStyles';

const ControlIcon: (props: { color: string; style: Style }) => ReactNode = (props) => (
	<View style={sharedStyles.controlIcon}>
		<List.Icon
			{...props}
			icon="integrated-circuit-chip"
		/>
	</View>
);

const validateMapEventRate = (val: number) => val > 0 && val <= 20000;

const GeneralControl: FC<{}> = () => {
	const { t } = useTranslation();
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const mapEventRate = useAppSelector(selectMapEventRate);

	const uiStateKey = 'dashboardControlGeneral';
	const expanded = useAppSelector((state) => selectElementExpanded(state, uiStateKey));
	const handleAccordionPress = useCallback(() => {
		dispatch(
			setElementExpanded({
				key: uiStateKey,
				expanded: !expanded,
			})
		);
	}, [expanded, uiStateKey]);

	const handleUpdateMapEventRate = useCallback(
		(newValue: number) => {
			dispatch(setMapEventRate(newValue));
		},
		[dispatch]
	);

	return (
		<List.Accordion
			title={'general advanced ... ???'}
			left={ControlIcon}
			expanded={expanded}
			onPress={handleAccordionPress}
			titleStyle={theme.fonts.bodyMedium}
		>
			<View style={styles.controls}>
				<NumericRowControl
					label={t('dashboard.updateRate')}
					value={mapEventRate ?? 40}
					onUpdate={handleUpdateMapEventRate}
					validate={validateMapEventRate}
					Info={t('dashboard.hint.updateRate')}
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

export default GeneralControl;
