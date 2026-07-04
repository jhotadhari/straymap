/**
 * External dependencies
 */
import React, { FC } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ItemUnitPrefControl from '../../components/controls/ItemUnitPrefControl';
import ItemFontSizeControl from '../../components/controls/ItemFontSizeControl';
import ItemMinWidthControl from '../../components/controls/ItemMinWidthControl';
import ItemShowLabelControl from '../../components/controls/ItemShowLabelControl';
import ItemShowIconControl from '../../components/controls/ItemShowIconControl';
import { sharedStyles } from '../sharedDeps';

const Control: FC = () => {
	const { t } = useTranslation();
	return (
		<View style={sharedStyles.container}>
			<ItemUnitPrefControl
				buttonLabel={t('follow global setting')} // ???
				unitPrefsKey="coordinates"
			/>

			<ItemMinWidthControl
				buttonLabel={t('Use default')} // ???
			/>

			<ItemFontSizeControl
				buttonLabel={t('follow dashboard setting')} // ???
			/>

			<ItemShowLabelControl />

			<ItemShowIconControl />
		</View>
	);
};

export default Control;
