/**
 * External dependencies
 */
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableHighlight, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../../store/hooks';
import { selectUnitPrefs } from '../../../general/selectors';
import { formatDistance } from '../../../../lib/formatting';
import { selectRecordedDistanceM } from '../../../trackRecording/selectors';
import useCenterRecordingPosition from '../../hooks/useCenterRecordingPosition';
import { RECORDED_LINE_COLOR } from '../../../../constants';

/**
 * Badge for the track-recording line's first statistics row — red,
 * matching the recording line colour, so the row reads as a system line
 * in both states:
 *
 * - Recording: shows the recorded distance formatted in the user's unit
 *   preference, falling back to the "Recording" text while no distance is
 *   available yet.
 * - Paused (recording stopped): shows the "Paused" label without the icon.
 *
 * Pressing it centers the map on the last recorded point (falling back to
 * the last GNSS fix) and opens the location drawer panel — the activation
 * offers the "add panel to a side" modal when that panel isn't assigned
 * to any side.
 *
 * Rendered as its own component so only this badge (not every
 * selected-lines row) re-renders as recorded points append.
 */
// `lineId` stays in the props for the caller's sake (the badge belongs to
// that row) but is no longer needed: the distance lives in Redux.
const RecordingDistanceBadge: FC<{ lineId: number; isPaused?: boolean }> = ({
	isPaused = false,
}) => {
	const { t } = useTranslation();
	const unitPrefs = useAppSelector(selectUnitPrefs);
	const centerOnRecording = useCenterRecordingPosition();

	// Incrementally accumulated in the trackRecording slice — no geometry
	// query / rescan here.
	const distanceM = useAppSelector(selectRecordedDistanceM);

	const value = isPaused
		? t('lines.paused')
		: distanceM
			? formatDistance(distanceM, get(unitPrefs, ['distance']))
			: t('lines.recording');

	return (
		<TouchableHighlight
			onPress={() => centerOnRecording()}
			underlayColor="transparent"
			style={styles.touchable}
		>
			<View style={[styles.pill, { backgroundColor: RECORDED_LINE_COLOR }]}>
				{!isPaused && (
					<Icon
						source="sigma"
						size={14}
						color={styles.foreground.color}
					/>
				)}
				<Text
					style={[styles.text, styles.foreground]}
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
	foreground: {
		color: '#FFFFFF',
	},
});

export default RecordingDistanceBadge;
