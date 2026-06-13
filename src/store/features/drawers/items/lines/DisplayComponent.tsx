/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction, useCallback } from 'react';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { itemStyles } from '../../constants';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import SelectedLinesList from '../../../lines/components/SelectedLinesList';
import { useAppDispatch } from '../../../../hooks';
import { addUiItemKey } from '../../../ui/slice';

const DisplayComponent: FC<{
	scrollEnabled: boolean;
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
}> = ({ scrollEnabled, setScrollEnabled }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const openLinesDirectory = useCallback(() => dispatch(addUiItemKey('linesDirectory')), []);

	return (
		<View style={itemStyles.item}>
			<ButtonHighlight
				style={itemStyles.buttonRow}
				mode="outlined"
				onPress={openLinesDirectory}
			>
				<Text>{t('???open lines directory')}</Text>
			</ButtonHighlight>

			<SelectedLinesList />
		</View>
	);
};

export default DisplayComponent;
