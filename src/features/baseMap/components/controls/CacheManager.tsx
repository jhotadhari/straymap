/**
 * External dependencies
 */
import { useCallback, useMemo, useState } from 'react';
import { View, TouchableHighlight, StyleSheet } from 'react-native';
import { List, useTheme, Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import InfoRowControl from '../../../../components/generic/controls/InfoRowControl';
import LoadingIndicator from '../../../../components/generic/LoadingIndicator';
import { FsModule } from '../../../../nativeModules';
import { LayerConfig } from '../../types';
import { selectElementExpanded } from '../../../ui/selectors';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { setElementExpanded } from '../../../ui/slice';
import { selectAppDirs } from '../../../dirs/selectors';
import useCacheDirsInfo from '../../../dirs/hooks/useCacheDirsInfo';
import { CacheDir, CacheSubDir } from '../../../dirs/types';
import { getHillshadingCacheDirChild, resolveCacheDirBase, stringifyProp } from '../../utils';
import { selectLayers } from '../../selectors';
import { sharedStyles } from '../../../../sharedStyles';

const CacheRow = ({
	cacheDir,
	cache,
	findLayers,
	updateCacheDirs,
}: {
	cacheDir: CacheDir;
	cache: CacheSubDir;
	findLayers: (pathFull: string) => LayerConfig[];
	updateCacheDirs: () => void;
}) => {
	const [deleting, setDeleting] = useState(false);

	const { t } = useTranslation();

	const theme = useTheme();

	const pathFull = useMemo(
		() => [cacheDir.path, cache.basename].join('/'),
		[cache.basename, cacheDir.path]
	);

	const cacheLayers = useMemo(() => findLayers(pathFull), [pathFull, findLayers]);

	const styleBasename = useMemo(
		() => [styles.basename, { color: theme.colors.surfaceVariant }],
		[theme]
	);

	const styleDeleteAction = useMemo(() => ({ borderRadius: theme.roundness }), [theme]);

	const handleDeletePress = useCallback(() => {
		setDeleting(true);
		FsModule.deleteDir(pathFull).finally(() => {
			setDeleting(false);
			updateCacheDirs();
		});
	}, [pathFull, updateCacheDirs]);

	return (
		<InfoRowControl
			key={cache.basename}
			label={cache.readableSize}
			labelStyle={styles.cacheLabel}
		>
			<View style={styles.cacheRow}>
				<View style={styles.cacheInfo}>
					<View style={sharedStyles.flexRow}>
						<Text style={styleBasename}>{cache.basename}</Text>
					</View>

					<Text style={styles.layersText}>
						{cacheLayers.length
							? t('baseMap.layer', { count: cacheLayers.length }) + ': '
							: t('baseMap.noLayerUseCache')}
						{cacheLayers.length
							? cacheLayers.map((layer) => layer.name).join(', ')
							: ''}
					</Text>
				</View>

				{!deleting && (
					<TouchableHighlight
						underlayColor={theme.colors.elevation.level3}
						onPress={handleDeletePress}
						style={styleDeleteAction}
					>
						<Icon
							source="delete-outline"
							size={25}
						/>
					</TouchableHighlight>
				)}

				{deleting && <LoadingIndicator />}
			</View>
		</InfoRowControl>
	);
};

const uiStateKey = 'cacheManagerExpanded';

const renderAccordionIcon = (props: { color: string; style: object }) => (
	<View style={sharedStyles.controlIcon}>
		<List.Icon
			{...props}
			icon="content-save-outline"
		/>
	</View>
);

const CacheManager = () => {
	const dispatch = useAppDispatch();

	const theme = useTheme();

	const layers = useAppSelector((state) => selectLayers(state, { temp: true }));

	const appDirs = useAppSelector(selectAppDirs);

	const internalCacheDir = useMemo(
		() => get(appDirs, ['internalCacheDirs', 0], undefined),
		[appDirs]
	);

	const findLayers = useCallback(
		(pathFull: string) =>
			[...layers].filter((layer) => {
				let cacheDirBase = get(layer, ['options', 'cacheDirBase'], undefined);
				if (undefined === cacheDirBase) {
					return false;
				}
				cacheDirBase = resolveCacheDirBase(cacheDirBase, internalCacheDir);
				let cacheDirChild = '';
				switch (layer?.type) {
					case 'hillshading':
						cacheDirChild = getHillshadingCacheDirChild(layer.options);
						break;
					case 'online-raster-xyz':
						cacheDirChild = stringifyProp(get(layer, ['options', 'url'], ''));
						break;
				}
				return [cacheDirBase, cacheDirChild].join('/') === pathFull;
			}),
		[layers, internalCacheDir]
	);

	const expanded = useAppSelector((state) => selectElementExpanded(state, uiStateKey));

	const { updateCacheDirs, cacheDirs } = useCacheDirsInfo(expanded);

	const handleAccordionPress = useCallback(() => {
		if (!expanded) {
			updateCacheDirs();
		}
		dispatch(
			setElementExpanded({
				key: uiStateKey,
				expanded: !expanded,
			})
		);
	}, [
		dispatch,
		expanded,
		updateCacheDirs,
	]);

	return (
		<List.Accordion
			title={'Cache Manager'} // ??? translation
			left={renderAccordionIcon}
			expanded={expanded}
			onPress={handleAccordionPress}
			titleStyle={theme.fonts.bodyMedium}
		>
			<View style={styles.controls}>
				{cacheDirs.length === 0 && <LoadingIndicator />}

				{cacheDirs.map((cacheDir: CacheDir) => {
					return (
						<View
							key={cacheDir.path}
							style={styles.cacheDirRow}
						>
							<InfoRowControl
								label={internalCacheDir === cacheDir.path ? 'Internal' : 'External'}
							>
								<Text>{cacheDir.path}</Text>
							</InfoRowControl>

							{[...cacheDir.caches].map((cache: CacheSubDir) => (
								<CacheRow
									key={cache.basename}
									cache={cache}
									cacheDir={cacheDir}
									findLayers={findLayers}
									updateCacheDirs={updateCacheDirs}
								/>
							))}
						</View>
					);
				})}
			</View>
		</List.Accordion>
	);
};

const styles = StyleSheet.create({
	controls: {
		marginBottom: 24,
		paddingRight: 24,
		gap: 16,
	},
	cacheLabel: {
		marginLeft: 16,
		marginRight: -16,
	},
	cacheRow: {
		flexDirection: 'row',
		gap: 8,
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	cacheInfo: {
		flexShrink: 1,
		flexGrow: 1,
	},
	basename: {
		width: 1,
		flexShrink: 1,
		flexGrow: 1,
	},
	layersText: {
		marginTop: 5,
	},
	cacheDirRow: {
		marginLeft: -12,
		gap: 16,
	},
});

export default CacheManager;
