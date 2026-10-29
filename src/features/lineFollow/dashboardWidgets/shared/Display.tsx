/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { Text } from 'react-native-paper';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { DashboardWidgetProps } from '../../../dashboard/types';
import useItemStyle from '../../../dashboard/hooks/useItemStyle';
import ElementFrame from '../../../dashboard/components/ElementFrame';
import { useAppSelector } from '../../../../store/hooks';
import { selectFollowingLineId } from '../../selectors';
import { useFollowProgress } from '../../hooks/useFollowProgress';
import { formatDistance, formatHeightDepth } from '../../../../lib/formatting';
import { selectUnitPrefs } from '../../../general/selectors';

export interface FollowStatOptions {
	statField:
		'distanceToDestination' | 'distanceCovered' | 'climbToDestination' | 'descentToDestination';
}

const DISTANCE_FIELDS = new Set(['distanceToDestination', 'distanceCovered']);

/**
 * Shared display for the follow-mode dashboard widgets. Renders a single
 * live progress stat for the followed line, or '-' when no line is being
 * followed (or the geometry / GNSS fix isn't available yet).
 */
const Display: FC<DashboardWidgetProps<FollowStatOptions>> = ({ item, style = {}, onPress }) => {
	const { fontSize, minWidth, textAlign, showLabel, showIcon } = useItemStyle(item);
	const unitPrefs = useAppSelector(selectUnitPrefs);

	const followingLineId = useAppSelector(selectFollowingLineId);
	const progress = useFollowProgress(followingLineId);

	const statField = item?.options?.statField ?? 'distanceToDestination';

	const statValue = useMemo(() => {
		if (!progress) {
			return null;
		}
		const value = progress[statField];
		if (value == null) {
			return null;
		}
		if (DISTANCE_FIELDS.has(statField)) {
			return formatDistance(value, get(unitPrefs, ['distance']));
		}
		return formatHeightDepth(value, get(unitPrefs, ['heightDepth']));
	}, [
		progress,
		statField,
		unitPrefs,
	]);

	const textStyle = useMemo(() => ({ fontSize, textAlign }), [fontSize, textAlign]);

	return (
		<ElementFrame
			item={item}
			style={style}
			minWidth={minWidth}
			fontSize={fontSize}
			showLabel={showLabel}
			showIcon={showIcon}
			textAlign={textAlign}
			onPress={onPress}
		>
			<Text style={textStyle}>{statValue ?? '-'}</Text>
		</ElementFrame>
	);
};

export default Display;
