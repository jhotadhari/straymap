/**
 * External dependencies
 */
import { FC, Fragment, useCallback, useContext } from 'react';
import { Icon, Text, useTheme } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';
import { pick, without } from 'lodash-es';

/**
 * Internal dependencies
 */
import InfoRowControl, {
	styles as stylesInfoRowControl,
} from '../../../../../components/generic/controls/InfoRowControl';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { styles as sharedStyles } from './sharedDeps';
import { iconSize } from '../../../drawers/constants';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
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

	const dispatch = useAppDispatch();

	const expanded = useAppSelector((state) => selectElementExpanded(state, uiStateKey));

	const handlePress = useCallback(() => {
		dispatch(
			setElementExpanded({
				key: uiStateKey,
				expanded: !expanded,
			})
		);
	}, [expanded]);

	const { line, route } = useContext(LineEditModalContext);

	const stats = (line?.id !== route?.line_id ? line?.stats : route?.stats) ?? {};

	return (
		<Fragment>
			<InfoRowControl
				label={'stats???'}
				// Info={Info}
			>
				<ButtonHighlight
					mode="outlined"
					compact={true}
					onPress={handlePress}
				>
					<View style={sharedStyles.buttonInner}>
						<Icon
							source="chart-box-outline"
							size={iconSize}
						/>
						<Text>{expanded ? '??? hide Stats' : '??? show Stats'}</Text>
					</View>
				</ButtonHighlight>
			</InfoRowControl>

			{expanded && line && (
				<View style={stylesInfoRowControl.container}>
					<View style={stylesInfoRowControl.label} />
					<View style={[stylesInfoRowControl.controlView, styles.dropdown]}>
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
