/**
 * External dependencies
 */
import { FC, useCallback, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectSideForKey } from '../../../drawers/selectors';
import { moveItemKey } from '../../../drawers/slice';
import { DrawerSide } from '../../../drawers/types';
import { OptionBase } from '../../../../types';
import OptionMenuRowControl from '../../../../components/generic/controls/OptionMenuRowControl';
import DrawersIcon from '../../../drawers/components/DrawersIcon';

export const MAPS_DRAWER_PANEL_KEY = 'maps';

const sideOptions: OptionBase[] = [
	{
		key: 'none',
		label: 'baseMap.drawerPanelSide.none',
	},
	{
		key: 'left',
		label: 'baseMap.drawerPanelSide.left',
	},
	{
		key: 'right',
		label: 'baseMap.drawerPanelSide.right',
	},
];

const MapsDrawerPanelSideControl: FC<{ style?: ViewStyle }> = ({ style }) => {
	const { t } = useTranslation();

	const theme = useTheme();

	const dispatch = useAppDispatch();

	const drawerSide = useAppSelector((state) => selectSideForKey(state, MAPS_DRAWER_PANEL_KEY));

	const value = useMemo(() => drawerSide ?? 'none', [drawerSide]);

	const handleUpdate = useCallback(
		(newValue: string) => {
			if (newValue === value) {
				return;
			}
			dispatch(
				moveItemKey({
					itemKey: MAPS_DRAWER_PANEL_KEY,
					side: 'none' === newValue ? 'available' : (newValue as DrawerSide),
					index: Infinity,
				})
			);
		},
		[dispatch, value]
	);

	return (
		<View style={[styles.row, style]}>
			<View style={styles.iconWrapper}>
				<DrawersIcon color={theme.colors.onBackground} />
			</View>

			<OptionMenuRowControl
				label={t('baseMap.drawerPanel')}
				Info={t('baseMap.hint.drawerPanel')}
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
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 15,
		paddingRight: 15,
		paddingTop: 15,
		paddingBottom: 15,
		marginLeft: 8,
	},
	iconWrapper: {
		marginRight: 10,
	},
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

export default MapsDrawerPanelSideControl;
