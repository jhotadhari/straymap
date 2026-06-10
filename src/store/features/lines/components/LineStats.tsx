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
import { LineStats as LineStatsType } from '../types';
import { selectUnitPrefs } from '../../general/selectors';
import { formatDistance, formatHeightDepth } from '../../../../lib/formatting';

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
	stats: LineStatsType;
}> = ({ stats }) => {
	return (
		<Fragment>
			{stats?.length && (
				<Stat
					value={stats.length}
					unitPrefKey="distance"
				/>
			)}
			{stats?.uphill && (
				<Stat
					value={stats.uphill}
					unitPrefKey="heightDepth"
					iconSource="arrow-up"
				/>
			)}
			{stats?.downhill && (
				<Stat
					value={stats.downhill}
					unitPrefKey="heightDepth"
					iconSource="arrow-down"
				/>
			)}
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
