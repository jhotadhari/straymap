/**
 * External dependencies
 */
import React, { FC, useContext } from 'react';

/**
 * Internal dependencies
 */
import BottomDrawerContext from '../../bottomDrawer/BottomDrawerContext';
import ChartContent from './ChartContent';

/**
 * Bottom drawer host for ChartContent: the active chart key and the
 * settings modal visibility come from the drawer context. Everything
 * else (data, settings, viewport logic) lives in ChartContent, which
 * the fullscreen UiItem reuses independently.
 */
const ChartDisplay: FC = () => {
	const { activeItemKey, settingsModalVisible, setSettingsModalVisible } =
		useContext(BottomDrawerContext);

	if (!activeItemKey) {
		return undefined;
	}

	return (
		<ChartContent
			chartKey={activeItemKey}
			settingsModalVisible={settingsModalVisible}
			setSettingsModalVisible={setSettingsModalVisible}
			variant="drawer"
		/>
	);
};

export default ChartDisplay;
