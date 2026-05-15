/**
 * External dependencies
 */
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import ItemMinWidthControl from '../../components/controls/ItemMinWidthControl';

const Control: FC = () => {

	const { t } = useTranslation();

	return (
		<View>
			<ItemMinWidthControl
				buttonLabel={t('Use default')} // ???
			/>
		</View>
	);
};

export default Control;
