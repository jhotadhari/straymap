/**
 * External dependencies
 */
import { FC, useCallback, useMemo } from 'react';
import { View, TouchableHighlight, Linking } from 'react-native';
import { useTheme, Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get, omit } from 'lodash-es';
import { sprintf } from 'sprintf-js';

/**
 * react-native-mapsforge-vtm dependencies
 */
import { LayerMapsforge } from 'react-native-mapsforge-vtm';

import FileSourceRowControl from '../../../../../../components/generic/controls/FileSourceRowControl';
import LoadingIndicator from '../../../../../../components/generic/LoadingIndicator';
import { MapsforgeProfile, RenderStylesCache } from '../../../types';
import { selectIsBusy } from '../../../../ui/selectors';
import { useAppDispatch, useAppSelector } from '../../../../../hooks';
import { selectMapsforgeProfileTemp } from '../../../selectors';
import { setMapsforgeProfileTemp, setRenderStylesCache } from '../../../baseMapSlice';
import { selectAppDirs } from '../../../../dirs/selectors';
import { getDirInfoCacheId } from '../../../../dirs/utils';
import { removeDirInfoCacheEntry } from '../../../../dirs/dirsSlice';

const extensions = ['xml'];

const ResetCacheButton: FC<{
	renderStylesCache: RenderStylesCache;
}> = ({ renderStylesCache }) => {
	const dispatch = useAppDispatch();
	const theme = useTheme();

	const profileTemp = useAppSelector(selectMapsforgeProfileTemp);

	const isBusy = useAppSelector(selectIsBusy);
	const appDirs = useAppSelector(selectAppDirs);

	const handlePress = useCallback(() => {
		if (profileTemp && null !== profileTemp.theme && 'string' === typeof profileTemp.theme) {
			dispatch(
				setRenderStylesCache({
					optionsMap: omit(renderStylesCache.optionsMap, profileTemp.theme),
					defaultsMap: omit(renderStylesCache.defaultsMap, profileTemp.theme),
				})
			);
		}
		dispatch(
			removeDirInfoCacheEntry(
				getDirInfoCacheId({
					navDirs: appDirs.mapstyles,
					extensions,
					recursive: true,
				})
			)
		);
	}, [
		profileTemp?.theme,
		appDirs?.mapstyles,
	]);

	return isBusy ? undefined : (
		<TouchableHighlight
			underlayColor={theme.colors.elevation.level3}
			onPress={handlePress}
			// style={{ borderRadius: theme.roundness }}
		>
			<Icon
				source="refresh"
				size={25}
			/>
		</TouchableHighlight>
	);
};

const themeInfoLinks = [
	{
		label: 'link.xmlRenderThemes',
		url: 'https://www.openandromaps.org/en/legend/elevate-mountain-hike-theme',
	},
	{
		label: 'link.xmlRenderThemesModify',
		url: 'https://github.com/mapsforge/mapsforge/blob/master/docs/Rendertheme.md',
	},
];
const styleThemeInfoLink = { marginTop: 10 };
const ThemeInfo: FC<{}> = () => {
	const { t } = useTranslation();
	const theme = useTheme();
	const styleThemeInfoLinkText = useMemo(() => ({ color: get(theme.colors, 'link') }), [theme]);
	return (
		<View>
			<Text>{t('baseMap.hint.mapsforgeProfileFile')}</Text>
			{themeInfoLinks.map((link) => (
				<View style={styleThemeInfoLink}>
					<Text>{t(link.label)}</Text>
					<Text
						style={styleThemeInfoLinkText}
						onPress={() => Linking.openURL(link.url)}
					>
						{link.url}
					</Text>
				</View>
			))}
		</View>
	);
};

const ThemeControl: FC<{
	renderStylesCache: RenderStylesCache;
}> = ({ renderStylesCache }) => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const profileTemp = useAppSelector(selectMapsforgeProfileTemp);

	const isBusy = useAppSelector(selectIsBusy);

	const appDirs = useAppSelector(selectAppDirs);

	const handleSelect = useCallback((selectedOpt?: string) => {
		dispatch(
			setMapsforgeProfileTemp(
				(profileTemp) =>
					({
						...(profileTemp ?? {}),
						theme: selectedOpt,
					}) as MapsforgeProfile
			)
		);
	}, []);

	const initialOptsMap = useMemo(
		() => ({
			[t('baseMap.builtInThemes') + ':']: [...LayerMapsforge.BUILT_IN_THEMES].map((key) => ({
				key,
				label: key,
			})),
		}),
		[t]
	);

	if (!appDirs?.mapstyles || !profileTemp) {
		return undefined;
	}

	return (
		<FileSourceRowControl
			AlternativeButton={isBusy ? () => <LoadingIndicator /> : undefined}
			label={t('baseMap.theme')}
			header={t('baseMap.selectTheme')}
			initialOptsMap={initialOptsMap}
			value={profileTemp?.theme}
			onSelect={handleSelect}
			After={<ResetCacheButton renderStylesCache={renderStylesCache} />}
			extensions={extensions}
			dirs={appDirs.mapstyles}
			Info={<ThemeInfo />}
			filesHeading={sprintf(t('filesIn'), '(.xml)')}
			noFilesHeading={sprintf(t('noFilesIn'), '(.xml)')}
		/>
	);
};

export default ThemeControl;
