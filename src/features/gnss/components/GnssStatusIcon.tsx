/**
 * External dependencies
 */
import { FC } from 'react';
import { TextStyle } from 'react-native';

/**
 * Internal dependencies
 */
import { TrackingDrawerIcon } from '../../trackRecording/drawerPanels/trackingDrawerItem';
import { DRAWER_ICON_SIZE } from '../../../constants';

const GnssStatusIcon: FC<{
	color?: TextStyle['color'];
	style?: TextStyle;
	size?: number;
}> = ({ color, style, size = DRAWER_ICON_SIZE }) => (
	<TrackingDrawerIcon
		color={color}
		size={size}
		style={style}
	/>
);

export default GnssStatusIcon;
