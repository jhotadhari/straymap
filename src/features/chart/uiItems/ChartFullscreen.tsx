/**
 * External dependencies
 */
import React, { FC, memo, useState } from 'react';
import { View, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../store/hooks';
import { selectFullscreenLineId } from '../selectors';
import { getChartSourceKey } from '../types';
import ChartContent from '../components/ChartContent';

/**
 * Standalone fullscreen chart UiItem — dedicated to a single line
 * (the one passed to openFullscreenChart). Independent from the
 * bottom drawer charts: settings live under chart:fullscreen:<id>.
 */
const ChartFullscreen: FC<{ style?: ViewStyle }> = ({ style }) => {
	const fullscreenLineId = useAppSelector(selectFullscreenLineId);

	const [settingsModalVisible, setSettingsModalVisible] = useState(false);

	if (typeof fullscreenLineId !== 'number') {
		return <View style={style} />;
	}

	return (
		<View style={style}>
			<ChartContent
				chartKey={getChartSourceKey.fullscreen(fullscreenLineId)}
				settingsModalVisible={settingsModalVisible}
				setSettingsModalVisible={setSettingsModalVisible}
				variant="fullscreen"
			/>
		</View>
	);
};

export default memo(ChartFullscreen);
