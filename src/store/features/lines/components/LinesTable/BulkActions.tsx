/**
 * External dependencies
 */
import { Icon, useTheme } from 'react-native-paper';
import { FC, Fragment, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import Popover, { PopoverPlacement } from 'react-native-popover-view';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { iconSize } from '../../../drawers/constants';
import useBulkActions from '../../hooks/useBulkActions';
import { FooterContext } from './Context';
import PopoverMenuItems from '../../../../../components/generic/PopoverMenuItems';

//      show on map
//      remove from map
//      delete lines
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
		<Fragment>
			{Object.values(actions).map((action) =>
				action?.modalNode ? (
					<Fragment key={action.key}>{action.modalNode}</Fragment>
				) : undefined
			)}

			<Popover
				popoverStyle={popoverStyle}
				arrowSize={arrowSize}
				isVisible={menuVisible}
				placement={PopoverPlacement.TOP}
				onRequestClose={dismissMenu}
				from={anchor}
				animationConfig={animationConfig}
			>
				<ScrollView>
					{menuVisible && (
						<PopoverMenuItems
							options={Object.values(actions)}
							onPress={() => setMenuVisible(false)}
						/>
					)}
				</ScrollView>
			</Popover>
		</Fragment>
	);
};

const animationConfig = {
	duration: 0,
};
const arrowSize = { height: 0, width: 0 };

export default BulkActions;
