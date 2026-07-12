/**
 * External dependencies
 */
import React, { FC } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ItemUnitPrefControl from '../../../dashboard/components/controls/ItemUnitPrefControl';
import ItemFontSizeControl from '../../../dashboard/components/controls/ItemFontSizeControl';
import ItemMinWidthControl from '../../../dashboard/components/controls/ItemMinWidthControl';
import { sharedStyles } from '../../../dashboard/dashboardWidgets/sharedDeps';

const Control: FC = () => {
	const { t } = useTranslation();
	return (
		<View style={sharedStyles.container}>
			<ItemUnitPrefControl
				buttonLabel={t('follow global setting')}
				unitPrefsKey="coordinates"
			/>

			<ItemMinWidthControl buttonLabel={t('Use default')} />

			<ItemFontSizeControl buttonLabel={t('follow dashboard setting')} />
		</View>
	);
};

export default Control;
