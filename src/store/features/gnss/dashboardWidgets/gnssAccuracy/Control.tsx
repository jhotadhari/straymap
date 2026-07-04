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
import ItemShowLabelControl from '../../../dashboard/components/controls/ItemShowLabelControl';
import ItemShowIconControl from '../../../dashboard/components/controls/ItemShowIconControl';
import { sharedStyles } from '../../../dashboard/dashboardWidgets/sharedDeps';

const Control: FC = () => {
	const { t } = useTranslation();
	return (
		<View style={sharedStyles.container}>
			<ItemMinWidthControl buttonLabel={t('Use default')} />

			<ItemFontSizeControl buttonLabel={t('follow dashboard setting')} />

			<ItemShowLabelControl />

			<ItemShowIconControl />
		</View>
	);
};

export default Control;
