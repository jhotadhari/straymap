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
import { useTranslation } from 'react-i18next';

const Control: FC = () => {
	const { t } = useTranslation();
	return (
		<View>
			<ItemMinWidthControl
				buttonLabel={t('Use default')} // ???
			/>

			<ItemFontSizeControl
				buttonLabel={t('follow dashboard setting')} // ???
			/>
		</View>
	);
};

export default Control;
