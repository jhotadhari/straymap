/**
 * External dependencies
 */
import React, { FC } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import { styles as mdStyles } from '../../../../../markdown/styles';
import { useAppSelector } from '../../../../hooks';
import { selectHgtDirPath } from '../../../baseMap/selectors';
import ItemFontSizeControl from '../../components/controls/ItemFontSizeControl';
import ItemMinWidthControl from '../../components/controls/ItemMinWidthControl';
import ItemUnitPrefControl from '../../components/controls/ItemUnitPrefControl';

const Control: FC = () => {
	const hgtDirPath = useAppSelector(selectHgtDirPath);

	const { t } = useTranslation();

	const theme = useTheme();

	return (
		<View>
			{!hgtDirPath && (
				<View
					style={{
						...get(mdStyles(theme), 'blockquote'),
						marginVertical: 10,
						paddingVertical: 10,
						marginLeft: 0,
						borderColor: theme.colors.errorContainer,
					}}
				>
					<Text>{t('hint.dashboard.missingHgtDirPath')}</Text>
				</View>
			)}

			<ItemUnitPrefControl
				buttonLabel={t('follow global setting')} // ???
				unitPrefsKey="heightDepth"
			/>

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
