/**
 * External dependencies
 */
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableHighlight, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../../store/hooks';
import { selectUnitPrefs } from '../../../general/selectors';
import { formatDistance } from '../../../../lib/formatting';
import { useFollowProgress } from '../../../lineFollow/hooks/useFollowProgress';
import useActivateDrawerItem from '../../../drawers/hooks/useActivateDrawerItem';

/**
 * Live "distance to destination" badge for the followed line's first
 * statistics row. Rendered as its own component so only this badge (not
 * every selected-lines row) re-renders on GNSS fixes. Falls back to the
 * "Following" text while no progress is available (GNSS off or no fix yet).
 *
 * Pressing it opens the follow-route drawer panel; when that panel isn't
 * assigned to any side, the activation offers the "add panel to a side"
 * modal instead.
 */
const FollowDistanceBadge: FC<{ lineId: number }> = ({ lineId }) => {
	const { t } = useTranslation();
	const theme = useTheme();
	const unitPrefs = useAppSelector(selectUnitPrefs);
	const progress = useFollowProgress(lineId);
	const activateFollowDrawerItem = useActivateDrawerItem('lineFollow');

	const value =
		progress?.distanceToDestination != null
			? formatDistance(progress.distanceToDestination, get(unitPrefs, ['distance']))
			: t('lineFollow.following');

	return (
		<TouchableHighlight
			onPress={() => activateFollowDrawerItem()}
			underlayColor="transparent"
			style={styles.touchable}
		>
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
		</TouchableHighlight>
	);
};

const styles = StyleSheet.create({
	touchable: {
		borderRadius: 12,
	},
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
