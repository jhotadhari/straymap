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
import { sharedStyles } from '../sharedDeps';

const Control: FC = () => {
	const { t } = useTranslation();
	return (
		<View style={sharedStyles.container}>
			<ItemUnitPrefControl
				buttonLabel={t('dashboard.followGlobalSetting')}
				unitPrefsKey="coordinates"
			/>

			<ItemMinWidthControl buttonLabel={t('dashboard.useDefault')} />

			<ItemFontSizeControl buttonLabel={t('dashboard.followDashboardSetting')} />
		</View>
	);
};

export default Control;
