/**
 * External dependencies
 */
import { FC } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { useButtonProps, useDestructiveColor } from '../../../../compose/useButtonProps';
import { DRAWER_ICON_SIZE } from '../../../drawers/constants';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import useCenterRecordingPosition from '../../hooks/useCenterRecordingPosition';

/**
 * Recording-line button shown in the routes browser and the lines drawer
 * panel instead of the add/remove-from-map toggle. Centers the map on the
 * last GNSS position (zooming to 10 when the current zoom is below 10) and
 * opens the tracking drawer panel. Rendered only for the recording row, so
 * GNSS-fix re-renders stay confined to one row.
 */
const RecordingCenterButton: FC = () => {
	const destructiveColor = useDestructiveColor();
	const centerOnRecording = useCenterRecordingPosition();

	const buttonProps = useButtonProps({ mode: 'text' });

	return (
		<ButtonHighlight
			{...buttonProps}
			compact={true}
			onPress={centerOnRecording}
		>
			<View style={styles.indicatorBox}>
				<Icon
					source="circle"
					size={16}
					color={destructiveColor}
				/>
			</View>
		</ButtonHighlight>
	);
};

const styles = StyleSheet.create({
	indicatorBox: {
		width: DRAWER_ICON_SIZE,
		height: DRAWER_ICON_SIZE,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default RecordingCenterButton;
