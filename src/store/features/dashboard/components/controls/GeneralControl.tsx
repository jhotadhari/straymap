/**
 * External dependencies
 */
import React, { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { List, useTheme } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { Style } from 'react-native-paper/lib/typescript/components/List/utils';

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

const ControlIcon: FC<{
	color: string;
	style: Style;
}> = (props) => (
	<View style={stylesGeneric.controlIcon}>
		<List.Icon
			{...props}
			icon="integrated-circuit-chip"
		/>
	</View>
);

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
	}, [
		expanded,
		uiStateKey,
	]);
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
					onUpdate={(newValue) => {
						dispatch(setMapEventRate(newValue));
					}}
					validate={(val) => val >= 0 && val <= 20000}
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
