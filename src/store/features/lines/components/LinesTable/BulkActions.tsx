/**
 * External dependencies
 */
import { Icon, useTheme } from 'react-native-paper';
import { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { iconSize } from '../../../drawers/constants';
import { useTranslation } from 'react-i18next';
import Popover, { PopoverPlacement } from 'react-native-popover-view';
import { ScrollView } from 'react-native';
import MenuItem from '../../../../../components/generic/MenuItem';
import { MenuActionOption } from '../../../../../types';
import useBulkActions from '../../hooks/useBulkActions';
import { FooterContext } from './Context';
import PopoverMenuItems from '../../../../../components/generic/PopoverMenuItems';

//      show on map
//      remove from map
//  ??? delete line
//  ??? add tags
//  ??? remove tags
//  ??? show stats

const BulkActions: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const { checkedIds, linesCount, setOnMapIdsTemp, setCheckedIds, lineIds } =
		useContext(FooterContext);

	const [menuVisible, setMenuVisible] = useState(false);
	const dismissMenu = useCallback(() => {
		setMenuVisible(false);
	}, []);

	const handleButtonPress = useCallback(() => {
		if (menuVisible) {
			dismissMenu();
		} else {
			setMenuVisible(true);
		}
	}, [
		menuVisible,
	]);

	const actions = useBulkActions();

	const anchor = useMemo(
		() => (
			<ButtonHighlight
				mode="text"
				compact={true}
				disabled={!checkedIds.length}
				onPress={handleButtonPress}
			>
				<Icon
					source={'square-edit-outline'}
					size={iconSize}
					color={checkedIds.length ? undefined : theme.colors.onSurfaceDisabled}
				/>
			</ButtonHighlight>
		),
		[
			theme,
			checkedIds,
			handleButtonPress,
		]
	);

	const popoverStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			borderWidth: 1,
			borderColor: theme.colors.outline,
			minWidth: 150,
		}),
		[theme]
	);

	return (
		<Popover
			popoverStyle={popoverStyle}
			arrowSize={arrowSize}
			isVisible={menuVisible}
			placement={PopoverPlacement.TOP}
			onRequestClose={dismissMenu}
			from={anchor}
			// animationConfig={{
			// 	duration: 0,
			// }}
		>
			<ScrollView>
				{menuVisible && <PopoverMenuItems
                    options={Object.values(actions)}
                    onPress={() =>setMenuVisible(false)}
                /> }
			</ScrollView>
		</Popover>
	);
};

const arrowSize = { height: 0, width: 0 };

export default BulkActions;
