/**
 * External dependencies
 */
import { FC, useMemo, Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Icon } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../hooks';
import { LineWithTags } from '../types';
import { selectUnitPrefs } from '../../general/selectors';
import { formatDistance, formatHeightDepth } from '../../../../lib/utils';

const Stat: FC<{
	value: number;
	unitPrefKey: string;
	iconSource?: string;
}> = ({ value, unitPrefKey, iconSource }) => {
	const unitPrefs = useAppSelector(selectUnitPrefs);
	const formatted = useMemo(() => {
		switch (unitPrefKey) {
			case 'distance':
				return formatDistance(value, {
					...unitPrefs[unitPrefKey]!,
					round: 0,
				});
			case 'heightDepth':
				return formatHeightDepth(value, {
					...unitPrefs[unitPrefKey]!,
					round: 0,
				});
		}
	}, [
		unitPrefs[unitPrefKey],
		value,
		unitPrefKey,
	]);
	return (
		formatted &&
		formatted.length > 0 && (
			<View style={styles.stat}>
				{iconSource && (
					<Icon
						source={iconSource}
						size={16}
					/>
				)}
				<Text>{formatted}</Text>
			</View>
		)
	);
};

const LineStats: FC<{
	line: LineWithTags;
}> = ({ line }) => {
	return (
		<Fragment>
			<Stat
				value={line.stats.length}
				unitPrefKey="distance"
			/>
			<Stat
				value={line.stats.uphill}
				unitPrefKey="heightDepth"
				iconSource="arrow-up"
			/>
			<Stat
				value={line.stats.downhill}
				unitPrefKey="heightDepth"
				iconSource="arrow-down"
			/>
		</Fragment>
	);
};

const styles = StyleSheet.create({
	stat: {
		flexDirection: 'row',
		alignItems: 'center',
		flexWrap: 'nowrap',
	},
});

export default LineStats;
