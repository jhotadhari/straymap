/**
 * External dependencies
 */
import React, { FC } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ItemMinWidthControl from '../../../dashboard/components/controls/ItemMinWidthControl';
import ItemFontSizeControl from '../../../dashboard/components/controls/ItemFontSizeControl';
import { sharedStyles } from '../../../dashboard/dashboardWidgets/sharedDeps';

const Control: FC = () => {
	const { t } = useTranslation();
	return (
		<View style={sharedStyles.container}>
			<ItemMinWidthControl buttonLabel={t('dashboard.useDefault')} />

			<ItemFontSizeControl buttonLabel={t('dashboard.followDashboardSetting')} />
		</View>
	);
};

export default Control;
