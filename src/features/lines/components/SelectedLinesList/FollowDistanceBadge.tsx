/**
 * External dependencies
 */
import React, { FC } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../../store/hooks';
import { selectUnitPrefs } from '../../../general/selectors';
import { formatDistance } from '../../../../lib/formatting';
import { useFollowProgress } from '../../../lineFollow/hooks/useFollowProgress';

/**
 * Live "distance to destination" badge for the followed line's first
 * statistics row. Rendered as its own component so only this badge (not
 * every selected-lines row) re-renders on GNSS fixes.
 */
const FollowDistanceBadge: FC<{ lineId: number }> = ({ lineId }) => {
	const theme = useTheme();
	const unitPrefs = useAppSelector(selectUnitPrefs);
	const progress = useFollowProgress(lineId);

	if (progress?.distanceToDestination == null) {
		return null;
	}

	const value = formatDistance(progress.distanceToDestination, get(unitPrefs, ['distance']));

	return (
		<View style={[styles.pill, { backgroundColor: theme.colors.primaryContainer }]}>
			<Icon
				source="flag-checkered"
				size={14}
				color={theme.colors.onPrimaryContainer}
			/>
			<Text
				style={[styles.text, { color: theme.colors.onPrimaryContainer }]}
				numberOfLines={1}
			>
				{value}
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	pill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: 6,
		paddingVertical: 1,
		borderRadius: 12,
	},
	text: {
		fontSize: 12,
	},
});

export default FollowDistanceBadge;
