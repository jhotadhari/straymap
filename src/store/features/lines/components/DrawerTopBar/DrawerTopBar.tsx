/**
 * External dependencies
 */
import { FC, Fragment, useCallback, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import {
	DRAWER_HANDLE_SIZE,
	DRAWER_ICON_SIZE as handleIconSize,
	itemStyles,
} from '../../../drawers/constants';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import DrawerContext from '../../../drawers/DrawerContext';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { addUiItemKey } from '../../../ui/slice';
import useShowStatsCbModal from '../../hooks/useShowStatsCbModal';
import { selectSelected } from '../../selectors';
import { sprintf } from 'sprintf-js';

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
	linesInfoRow: {
		marginHorizontal: 8,
		flexDirection: 'row',
		gap: 16,
	},
});

const styleItem = [
	itemStyles.item,
	styles.item,
];
const styleButtonRowSecond = [
	itemStyles.buttonRow,
	styles.flexRow,
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

	const { lineIds, hiddenCount } = useMemo(() => {
		const lineIds = selectedLines.map((a) => a.id);
		const hiddenCount = selectedLines.filter((a) => !a.visible).length;
		return {
			lineIds,
			hiddenCount,
		};
	}, [selectedLines]);

	const {
		cb: handleStatsPressed,
		modalNode: statsModalNode,
		iconSource,
	} = useShowStatsCbModal({ lineIds });

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
					<View style={styles.linesInfoRow}>
						{lineIds.length > 0 && (
							<Fragment>
								<Text>{sprintf(t('lines.linesCount'), lineIds.length)}</Text>

								{hiddenCount > 0 && (
									<Text>{sprintf(t('lines.linesHidden'), hiddenCount)}</Text>
								)}
							</Fragment>
						)}

						{lineIds.length === 0 && <Text>{t('lines.noLinesSelected')}</Text>}
					</View>
				</View>
			</View>
		</View>
	);
};

export default DrawerTopBar;
