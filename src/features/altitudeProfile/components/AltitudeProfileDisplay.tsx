/**
 * External dependencies
 */
import React, { FC, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import BottomDrawerContext from '../../bottomDrawer/BottomDrawerContext';
import { useAppSelector } from '../../../store/hooks';
import { selectPathCoords } from '../../routing/selectors';
import { queryLinePathCoords } from '../../lines/db/queryFns';
import { getProfileSourceFromKey } from '../types';
import { useProfileItemLabels } from '../hooks/useProfileItemLabels';

const AltitudeProfileDisplay: FC = () => {
	const theme = useTheme();

	const { activeItemKey } = useContext(BottomDrawerContext);

	const source = useMemo(() => getProfileSourceFromKey(activeItemKey), [activeItemKey]);

	const profileLabels = useProfileItemLabels();

	const routingCoords = useAppSelector(selectPathCoords);

	const lineId = source?.type === 'line' ? source.lineId : undefined;
	const { data: lineCoords } = useQuery({
		queryKey: ['linePathCoords', lineId],
		queryFn: queryLinePathCoords,
		enabled: lineId !== undefined,
	});

	const coordinates: number[][] | undefined =
		source?.type === 'routing' ? routingCoords : (lineCoords ?? undefined);

	const label = useMemo(
		() => (activeItemKey ? (profileLabels[activeItemKey] ?? activeItemKey) : ''),
		[activeItemKey, profileLabels]
	);

	return (
		<View style={styles.container}>
			<Text style={[styles.text, { color: theme.colors.onBackground }]}>{label}</Text>
			<Text style={[styles.text, { color: theme.colors.onBackground }]}>
				{coordinates === undefined ? '…' : `${coordinates.length} coordinates`}
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16,
	},
	text: {
		textAlign: 'center',
	},
});

export default AltitudeProfileDisplay;
