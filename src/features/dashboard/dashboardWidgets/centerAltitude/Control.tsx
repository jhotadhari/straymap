/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import { StyleSheet, View } from 'react-native';

/**
 * Internal dependencies
 */
import { styles as mdStyles } from '../../../../markdown/styles';
import { useAppSelector } from '../../../../store/hooks';
import { selectHgtDirPath } from '../../../baseMap/selectors';
import ItemFontSizeControl from '../../components/controls/ItemFontSizeControl';
import ItemMinWidthControl from '../../components/controls/ItemMinWidthControl';
import ItemUnitPrefControl from '../../components/controls/ItemUnitPrefControl';
import { sharedStyles } from '../sharedDeps';

const Control: FC = () => {
	const hgtDirPath = useAppSelector(selectHgtDirPath);

	const { t } = useTranslation();

	const theme = useTheme();

	const styleBlockquote = useMemo(
		() => [
			get(mdStyles(theme), 'blockquote'),
			styles.blockquote,
			{ borderColor: theme.colors.errorContainer },
		],
		[theme]
	);

	return (
		<View style={sharedStyles.container}>
			{!hgtDirPath && (
				<View style={styleBlockquote}>
					<Text>{t('dashboard.hint.missingHgtDirPath')}</Text>
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

const styles = StyleSheet.create({
	blockquote: {
		marginVertical: 10,
		paddingVertical: 10,
		marginLeft: 0,
	},
});

export default Control;
