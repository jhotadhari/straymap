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
import { selectMapUpdateInterval } from '../../../general/selectors';
import NumericRowControl from '../../../../../components/generic/controls/NumericRowControl';
import { setMapUpdateInterval } from '../../../general/slice';
import { sharedStyles } from '../../../../../sharedStyles';

const ControlIcon: (props: { color: string; style: Style }) => ReactNode = (props) => (
	<View style={sharedStyles.controlIcon}>
		<List.Icon
			{...props}
			icon="integrated-circuit-chip"
		/>
	</View>
);

const validateMapUpdateInterval = (val: number) => val >= 10 && val <= 20000;

// ??? is that ever used anywhere?

const GeneralControl: FC<{}> = () => {
	const { t } = useTranslation();
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const mapUpdateInterval = useAppSelector(selectMapUpdateInterval);

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
		dispatch,
		expanded,
		uiStateKey,
	]);

	const handleUpdateMapUpdateInterval = useCallback(
		(newValue: number) => {
			dispatch(setMapUpdateInterval(newValue));
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
					value={mapUpdateInterval ?? 40}
					onUpdate={handleUpdateMapUpdateInterval}
					validate={validateMapUpdateInterval}
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
