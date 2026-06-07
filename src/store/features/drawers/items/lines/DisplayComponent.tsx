/**
 * External dependencies
 */
import React, { Dispatch, FC, SetStateAction } from 'react';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { itemStyles } from '../../constants';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import SelectedLinesList from '../../../lines/components/SelectedLinesList';

const DisplayComponent: FC<{
	scrollEnabled: boolean;
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
}> = ({ scrollEnabled, setScrollEnabled }) => {
	const { t } = useTranslation();

	return (
		<View style={itemStyles.item}>
			<ButtonHighlight
				style={itemStyles.buttonRow}
				mode="outlined"
				onPress={() => {
					// ???
				}}
			>
				<Text>{t('???')}</Text>
			</ButtonHighlight>

			<SelectedLinesList/>
		</View>
	);
};

export default DisplayComponent;
