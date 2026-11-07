/**
 * External dependencies
 */
import { FC, useCallback, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectSideForKey } from '../../../drawers/selectors';
import { moveItemKey } from '../../../drawers/slice';
import { DrawerSide } from '../../../drawers/types';
import { OptionBase } from '../../../../types';
import OptionMenuRowControl from '../../../../components/generic/controls/OptionMenuRowControl';

export const TRACKING_DRAWER_PANEL_KEY = 'tracking';

const sideOptions: OptionBase[] = [
	{
		key: 'none',
		label: 'gnss.drawerPanelSide.none',
	},
	{
		key: 'left',
		label: 'gnss.drawerPanelSide.left',
	},
	{
		key: 'right',
		label: 'gnss.drawerPanelSide.right',
	},
];

const TrackingDrawerPanelSideControl: FC<{ style?: ViewStyle }> = ({ style }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const drawerSide = useAppSelector((state) =>
		selectSideForKey(state, TRACKING_DRAWER_PANEL_KEY)
	);

	const value = useMemo(() => drawerSide ?? 'none', [drawerSide]);

	const handleUpdate = useCallback(
		(newValue: string) => {
			if (newValue === value) {
				return;
			}
			dispatch(
				moveItemKey({
					itemKey: TRACKING_DRAWER_PANEL_KEY,
					side: 'none' === newValue ? 'available' : (newValue as DrawerSide),
					index: Infinity,
				})
			);
		},
		[dispatch, value]
	);

	return (
		<View style={style}>
			<OptionMenuRowControl
				label={t('gnss.drawerPanel')}
				Info={t('gnss.hintDrawerPanel')}
				options={sideOptions}
				value={value}
				onUpdate={handleUpdate}
				style={styles.content}
				labelStyle={styles.labelStyle}
				anchorStyle={styles.anchorStyle}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
	},
	labelStyle: {
		width: 'auto',
	},
	anchorStyle: {
		alignSelf: 'flex-start',
		marginLeft: 'auto',
	},
});

export default TrackingDrawerPanelSideControl;
