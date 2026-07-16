/**
 * External dependencies
 */
import { FC, Fragment, useCallback, useContext } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { pick, without } from 'lodash-es';

/**
 * Internal dependencies
 */
import InfoLabelRow, {
	styles as stylesInfoLabelRow,
} from '../../../../components/generic/infoWrapper/InfoLabelRow';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { sharedStyles } from './sharedDeps';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectElementExpanded } from '../../../ui/selectors';
import { setElementExpanded } from '../../../ui/slice';
import { LineEditModalContext } from './Context';
import LineStats from '../LineStats';
import { STATS_FIELDS } from '../../types';

const statsRows = [
	['length'],
	[
		'uphill',
		'downhill',
	],
	[
		'minZ',
		'maxZ',
	],
];
// In case there are more stats, just append all missing.
const missingKeys = without([...STATS_FIELDS] as string[], ...statsRows.flat());
if (missingKeys.length) {
	statsRows.push(missingKeys);
}

const uiStateKey = 'LineEditModalStats';

const RowStats: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const expanded = useAppSelector((state) => selectElementExpanded(state, uiStateKey));

	const handlePress = useCallback(() => {
		dispatch(
			setElementExpanded({
				key: uiStateKey,
				expanded: !expanded,
			})
		);
	}, [dispatch, expanded]);

	const { line, route } = useContext(LineEditModalContext);

	const stats = (line?.id !== route?.line_id ? line?.stats : route?.stats) ?? {};

	return (
		<Fragment>
			<InfoLabelRow
				label={t('lines.stats')}
				Info={t('lines.hintStats')}
			>
				<ButtonHighlight
					mode="outlined"
					compact={true}
					onPress={handlePress}
					icon="chart-box-outline"
					contentStyle={sharedStyles.buttonContent}
					labelStyle={sharedStyles.buttonLabel}
					textColor={theme.colors.onBackground}
				>
					<View>
						<Text>{expanded ? t('lines.hideStats') : t('lines.showStats')}</Text>
					</View>
				</ButtonHighlight>
			</InfoLabelRow>

			{expanded && line && (
				<View style={stylesInfoLabelRow.container}>
					<View style={stylesInfoLabelRow.label} />
					<View style={[stylesInfoLabelRow.controlView, styles.dropdown]}>
						{statsRows.map((keys, idx) => (
							<View
								key={idx}
								style={styles.dropdownRow}
							>
								<LineStats
									stats={pick(stats, keys)}
									round={0}
								/>
							</View>
						))}
					</View>
				</View>
			)}
		</Fragment>
	);
};

const styles = StyleSheet.create({
	dropdown: {
		gap: 8,
	},
	dropdownRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
});

export default RowStats;
