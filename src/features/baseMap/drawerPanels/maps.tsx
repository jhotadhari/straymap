/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

/**
 * Internal dependencies
 */
import LayersControl from '../components/controls/layers/LayersControl';
import ProfilesControl from '../components/controls/profiles/ProfilesControl';
import { useAppDispatch } from '../../../store/hooks';
import { setUiItemKeys } from '../../ui/slice';
import DrawerPanelHeading from '../../drawers/components/DrawerPanelHeading';
import DrawerContext from '../../drawers/DrawerContext';
import { DrawerPanel } from '../../drawers/types';
import { DRAWER_HANDLE_SIZE, DRAWER_ICON_SIZE, itemStyles } from '../../drawers/constants';
import BaseMapIcon from '../components/BaseMapIcon';

const DisplayComponentScroll: FC<{
	scrollEnabled: boolean;
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
}> = ({ scrollEnabled: _scrollEnabled, setScrollEnabled }) => {
	const { t } = useTranslation();

	const { width, side } = useContext(DrawerContext);

	const dispatch = useAppDispatch();

	const openMapsSettings = useCallback(() => dispatch(setUiItemKeys(['maps'])), [dispatch]);

	return (
		<View style={itemStyles.item}>
			<DrawerPanelHeading
				title={t('ui.items.maps')}
				actionIcon="cog"
				onActionPress={openMapsSettings}
				actionAccessibilityLabel={t('drawers.openMapsSettings')}
				style={styles.header}
			/>

			<View style={styles.accControlWrapper}>
				<View style={itemStyles.itemRow}>
					<LayersControl
						setScrollEnabled={setScrollEnabled}
						width={width}
						reverseDraggableItem={'left' === side}
						uiStateKey={'DrawerMapLayersExpanded' + side}
						newLabel={t('addNew')}
						saveOnChange={true}
						saveOnUnmount={false}
					/>
				</View>
			</View>
			<View style={styles.accControlWrapper}>
				<View style={itemStyles.itemRow}>
					<ProfilesControl
						setScrollEnabled={setScrollEnabled}
						width={width}
						reverseDraggableItem={'left' === side}
						uiStateKey={'DrawerMapsforgeProfilesExpanded' + side}
						newLabel={t('addNew')}
						saveOnChange={true}
						saveOnUnmount={false}
					/>
				</View>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	header: {
		// Same 40dp row height as the previous settings button, so the
		// header keeps the exact same footprint (top/bottom offsets) and
		// the rows below stay aligned with the handle strip.
		height: 40,
		marginRight: 12,
		marginBottom: (DRAWER_HANDLE_SIZE - DRAWER_ICON_SIZE) / 2 + 4,
	},
	accControlWrapper: {
		marginLeft: -6,
	},
});

export default {
	key: 'maps',
	label: 'ui.items.maps',
	DisplayComponentScroll,
	IconComponent: BaseMapIcon,
} as DrawerPanel;
