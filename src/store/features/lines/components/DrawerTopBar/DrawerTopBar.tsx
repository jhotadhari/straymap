/**
 * External dependencies
 */
import { FC, useCallback, useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { handleSize, iconSize as handleIconSize, itemStyles } from '../../../drawers/constants';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import DrawerContext from '../../../drawers/DrawerContext';
import { useAppDispatch } from '../../../../hooks';
import { addUiItemKey } from '../../../ui/slice';

const DrawerTopBar: FC = () => {
	const { t } = useTranslation();

	// const theme = useTheme();

	const dispatch = useAppDispatch();

	const { side } = useContext(DrawerContext);

	const openLinesDirectory = useCallback(() => dispatch(addUiItemKey('linesDirectory')), []);

	return (
		<View>
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
						<Text>{t('???open lines directory')}</Text>
					</ButtonHighlight>

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
