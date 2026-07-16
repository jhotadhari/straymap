/**
 * External dependencies
 */
import { Icon, useTheme } from 'react-native-paper';
import { FC, Fragment, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Popover, { PopoverPlacement } from 'react-native-popover-view';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { DRAWER_ICON_SIZE } from '../../../drawers/constants';
import useBulkActions from './useBulkActions';
import { FooterContext } from './Context';
import PopoverMenuItems from '../../../../components/generic/wrapper/PopoverMenuItems';

//      show on map
//      remove from map
//      delete lines
//      add tags
//      remove tags
//      show stats

const BulkActions: FC = () => {
	const theme = useTheme();

	const { checkedIds } = useContext(FooterContext);

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
		dismissMenu,
	]);

	const actions = useBulkActions();

	const actionList = useMemo(() => Object.values(actions), [actions]);

	const anchorRef = useRef<View>(null);

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
			{actionList.map((action) =>
				action?.modalNode ? (
					<Fragment key={action.key}>{action.modalNode}</Fragment>
				) : undefined
			)}

			<ButtonHighlight
				ref={anchorRef}
				mode="text"
				compact={true}
				disabled={!checkedIds.length}
				onPress={handleButtonPress}
			>
				<Icon
					source={'square-edit-outline'}
					size={DRAWER_ICON_SIZE}
					color={checkedIds.length ? undefined : theme.colors.onSurfaceDisabled}
				/>
			</ButtonHighlight>

			<Popover
				popoverStyle={popoverStyle}
				arrowSize={arrowSize}
				isVisible={menuVisible}
				placement={PopoverPlacement.TOP}
				onRequestClose={dismissMenu}
				from={anchorRef as React.RefObject<React.Component<{}, {}, any>>}
				animationConfig={animationConfig}
			>
				<ScrollView>
					{menuVisible && (
						<PopoverMenuItems
							options={actionList}
							onPress={dismissMenu}
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
