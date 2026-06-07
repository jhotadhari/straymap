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

const DisplayComponent: FC<{
	scrollEnabled: boolean;
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
}> = ({ scrollEnabled, setScrollEnabled }) => {
	const { t } = useTranslation();

	return (
		<View style={itemStyles.item}>
			<View style={itemStyles.buttonRow}>
				<Text>bla lines</Text>
			</View>
		</View>
	);
};

export default DisplayComponent;