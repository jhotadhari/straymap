/**
 * External dependencies
 */
import { FC } from 'react';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import ItemMinWidthControl from '../../components/controls/ItemMinWidthControl';
import ItemFontSizeControl from '../../components/controls/ItemFontSizeControl';
import ItemShowLabelControl from '../../components/controls/ItemShowLabelControl';
import ItemShowIconControl from '../../components/controls/ItemShowIconControl';
import { useTranslation } from 'react-i18next';
import { sharedStyles } from '../sharedDeps';

const Control: FC = () => {
	const { t } = useTranslation();
	return (
		<View style={sharedStyles.container}>
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
