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
import ItemShowLabelControl from '../../components/controls/ItemShowLabelControl';
import ItemShowIconControl from '../../components/controls/ItemShowIconControl';
import { sharedStyles } from '../sharedDeps';

const Control: FC = () => {
	const { t } = useTranslation();

	return (
		<View style={sharedStyles.container}>
			<ItemMinWidthControl
				buttonLabel={t('Use default')} // ???
			/>

			<ItemShowLabelControl />

			<ItemShowIconControl />
		</View>
	);
};

export default Control;
