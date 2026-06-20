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
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import LoadingIndicator from '../../../../../components/generic/LoadingIndicator';
import { FsModule } from '../../../../../nativeModules';
import { LayerConfig } from '../../types';
import { selectElementExpanded } from '../../../ui/selectors';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { setElementExpanded } from '../../../ui/slice';
import { selectAppDirs } from '../../../dirs/selectors';
import useCacheDirsInfo from '../../../dirs/hooks/useCacheDirsInfo';
import { CacheDir, CacheSubDir } from '../../../dirs/types';
import { getHillshadingCacheDirChild, stringifyProp } from '../../utils';
import { selectLayers } from '../../selectors';

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

	const pathFull = useMemo(() => [cacheDir.path, cache.basename].join('/'), []);

	const cacheLayers = useMemo(() => findLayers(pathFull), [pathFull, findLayers]);

	return (
		<InfoRowControl
			key={cache.basename}
			label={cache.readableSize}
			labelStyle={{
				marginLeft: 16,
				marginRight: -16,
			}}
		>
			<View
				style={{
					flexDirection: 'row',
					gap: 8,
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<View
					style={{
						flexShrink: 1,
						flexGrow: 1,
					}}
				>
					<View
						style={{
							flexDirection: 'row',
						}}
					>
						<Text
							style={{
								color: theme.colors.surfaceVariant,
								width: 1,
								flexShrink: 1,
								flexGrow: 1,
							}}
						>
							{cache.basename}
						</Text>
					</View>

					<Text style={{ marginTop: 5 }}>
						{cacheLayers.length
							? t('baseMap.layer', { count: cacheLayers.length }) + ': '
							: t('baseMap.noLayerUseCache')}
						{cacheLayers.length
							? [...cacheLayers].map((layer) => layer.name).join(', ')
							: ''}
					</Text>
				</View>

				{!deleting && (
					<TouchableHighlight
						underlayColor={theme.colors.elevation.level3}
						onPress={() => {
							setDeleting(true);
							FsModule.deleteDir(pathFull).finally(() => {
								setDeleting(false);
								updateCacheDirs();
							});
						}}
						style={{ borderRadius: theme.roundness }}
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
				cacheDirBase = 'internal' === cacheDirBase ? internalCacheDir : cacheDirBase;
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

	return (
		<List.Accordion
			title={'Cache Manager'} // ??? translation
			left={(props) => (
				<View
					style={{
						marginLeft: 7,
						marginRight: -7,
						justifyContent: 'center',
					}}
				>
					<List.Icon
						{...props}
						icon="content-save-outline"
					/>
				</View>
			)}
			expanded={expanded}
			onPress={() => {
				if (!expanded) {
					updateCacheDirs();
				}
				dispatch(
					setElementExpanded({
						key: uiStateKey,
						expanded: !expanded,
					})
				);
			}}
			titleStyle={theme.fonts.bodyMedium}
		>
			<View style={styles.controls}>
				{cacheDirs.length == 0 && <LoadingIndicator />}

				{[...cacheDirs].map((cacheDir: CacheDir) => {
					return (
						<View
							key={cacheDir.path}
							style={{
								marginLeft: -12,
								gap: 16,
							}}
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
});

export default CacheManager;
