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
import { handleSize, iconSize as handleIconSize, itemStyles } from '../../../drawers/constants';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import DrawerContext from '../../../drawers/DrawerContext';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { addUiItemKey } from '../../../ui/slice';
import useShowStatsCbModal from '../../hooks/useShowStatsCbModal';
import { selectSelected } from '../../selectors';
import { sprintf } from 'sprintf-js';

const DrawerTopBar: FC = () => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const { side } = useContext(DrawerContext);

	const openLinesDirectory = useCallback(() => dispatch(addUiItemKey('linesDirectory')), []);

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

	return (
		<View>
			{statsModalNode}

			<View
				style={[
					itemStyles.item,
					styles.item,
				]}
			>
				<View
					style={[
						itemStyles.buttonRow,
						styles.flexRow,
						'left' === side && {
							flexDirection: 'row-reverse',
						},
					]}
				>
					<ButtonHighlight
						mode="outlined"
						onPress={openLinesDirectory}
					>
						{/* ??? translation */}
						<Text>{t('lines directory')}</Text>
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

			<View
				style={[
					itemStyles.item,
					styles.item,
				]}
			>
				<View
					style={[
						itemStyles.buttonRow,
						styles.flexRow,
						// 'left' === side && {
						// 	flexDirection: 'row-reverse',
						// },
					]}
				>
					<View
						style={[
							{
								marginHorizontal: 8,
								flexDirection: 'row',
								gap: 16,
							},
						]}
					>
						{lineIds.length > 0 && (
							<Fragment>
								{/* ??? translation */}
								<Text>{sprintf(t('%s lines'), lineIds.length)}</Text>

								{/* ??? translation */}
								{hiddenCount > 0 && (
									<Text>{sprintf(t('%s hidden'), hiddenCount)}</Text>
								)}
							</Fragment>
						)}

						{/* ??? translation */}
						{lineIds.length === 0 && <Text>{t('no lines selected')}</Text>}
					</View>
				</View>
			</View>
		</View>
	);
};
const styles = StyleSheet.create({
	item: {
		top: -(handleSize - handleIconSize) / 6,
	},
	flexRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		height: handleSize,
	},
});

export default DrawerTopBar;
