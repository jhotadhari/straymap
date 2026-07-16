/**
 * External dependencies
 */
import { FC, Fragment, useCallback, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';

/**
 * Internal dependencies
 */
import {
	DRAWER_HANDLE_SIZE,
	DRAWER_ICON_SIZE as handleIconSize,
	itemStyles,
} from '../../../drawers/constants';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import DrawerContext from '../../../drawers/DrawerContext';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { addUiItemKey } from '../../../ui/slice';
import useShowLinesStatsCbModal from '../../hooks/useShowStatsCbModal';
import useClearLinesCbModal from '../../hooks/useClearLinesCbModal';
import { selectSelected } from '../../selectors';

const styles = StyleSheet.create({
	item: {
		top: -(DRAWER_HANDLE_SIZE - handleIconSize) / 6,
	},
	flexRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		height: DRAWER_HANDLE_SIZE,
	},
	buttonRowReverse: {
		flexDirection: 'row-reverse',
	},
});

const styleItem = [
	itemStyles.item,
	styles.item,
];

const styleButtonRowSecond = [
	itemStyles.buttonRow,
	styles.flexRow,
	{ paddingLeft: 8 },
];

const DrawerTopBar: FC = () => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const { side } = useContext(DrawerContext);

	const openLinesBrowser = useCallback(
		() => dispatch(addUiItemKey('linesBrowser')),
		[
			dispatch,
		]
	);

	const selectedLines = useAppSelector(selectSelected);

	const lineIds = selectedLines;

	const {
		cb: handleStatsPressed,
		modalNode: statsModalNode,
		iconSource,
	} = useShowLinesStatsCbModal({ lineIds, showHeader: true });

	const { cb: handleClearLinesPressed, modalNode: clearLinesModalNode } = useClearLinesCbModal({
		lineIds,
	});

	const styleButtonRowFirst = useMemo(
		() => [
			itemStyles.buttonRow,
			styles.flexRow,
			'left' === side && styles.buttonRowReverse,
		],
		[side]
	);

	return (
		<View>
			{statsModalNode}
			{clearLinesModalNode}

			<View style={styleItem}>
				<View style={styleButtonRowFirst}>
					<ButtonHighlight
						mode="outlined"
						onPress={openLinesBrowser}
					>
						<Text>{t('lines.linesBrowser')}</Text>
					</ButtonHighlight>

					<ButtonHighlight
						mode="outlined"
						onPress={handleStatsPressed}
					>
						<Icon
							source={iconSource}
							size={20}
						/>
					</ButtonHighlight>
				</View>
			</View>

			<View style={styleItem}>
				<View style={styleButtonRowSecond}>
					{lineIds.length > 0 && (
						<Fragment>
							<Text>{sprintf(t('lines.linesCount'), lineIds.length)}</Text>

							<ButtonHighlight
								mode="outlined"
								onPress={handleClearLinesPressed}
							>
								<Icon
									source="map-minus"
									size={20}
								/>
							</ButtonHighlight>
						</Fragment>
					)}

					{lineIds.length === 0 && <Text>{t('lines.noLinesSelected')}</Text>}
				</View>
			</View>
		</View>
	);
};

export default DrawerTopBar;
