/**
 * External dependencies
 */
import { FC, useCallback, useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { useMap } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectGnssPosition } from '../../../gnss/selectors';
import { setUiItemKeys } from '../../../ui/slice';
import { AppContext } from '../../../../Context';
import { DRAWER_ICON_SIZE } from '../../../drawers/constants';
import { useButtonProps, useDestructiveColor } from '../../../../compose/useButtonProps';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import useActivateDrawerItem from '../../../drawers/hooks/useActivateDrawerItem';

/**
 * Recording-line button shown in the routes browser and the lines drawer
 * panel instead of the add/remove-from-map toggle. Centers the map on the
 * last GNSS position (zooming to 10 when the current zoom is below 10) and
 * opens the tracking drawer panel. Rendered only for the recording row, so
 * GNSS-fix re-renders stay confined to one row.
 */
const RecordingCenterButton: FC = () => {
	const dispatch = useAppDispatch();
	const { mapViewNativeNodeHandle } = useContext(AppContext);
	const { flyTo, getPosition } = useMap(mapViewNativeNodeHandle);
	const gnssPosition = useAppSelector(selectGnssPosition);
	const destructiveColor = useDestructiveColor();
	const activateTrackingDrawerItem = useActivateDrawerItem('tracking');

	const buttonProps = useButtonProps({ mode: 'text' });

	const handlePress = useCallback(async () => {
		if (!gnssPosition) {
			return;
		}
		// Close the routes browser so the re-centered map is visible.
		dispatch(setUiItemKeys([]));

		// Open the tracking drawer panel alongside the fly-to.
		activateTrackingDrawerItem();

		let zoom = 0;
		try {
			const pos = await getPosition();
			zoom = pos?.zoomLevel ?? 0;
		} catch {
			// Zoom unknown — fall back to just centering.
		}

		const center: [number, number] = [gnssPosition.lng, gnssPosition.lat];
		if (zoom < 10) {
			await flyTo({ center, zoomLevel: 10 });
		} else {
			await flyTo({ center });
		}
	}, [
		dispatch,
		gnssPosition,
		getPosition,
		flyTo,
		activateTrackingDrawerItem,
	]);

	return (
		<ButtonHighlight
			{...buttonProps}
			compact={true}
			onPress={handlePress}
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
