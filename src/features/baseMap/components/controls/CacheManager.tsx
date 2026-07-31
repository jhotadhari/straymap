/**
 * External dependencies
 */
import { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { List, useTheme, Text, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import LoadingIndicator from '../../../../components/generic/primitives/LoadingIndicator';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { FsModule } from '../../../../nativeModules';
import { LayerConfig } from '../../types';
import { selectElementExpanded } from '../../../ui/selectors';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { setElementExpanded } from '../../../ui/slice';
import { selectAppDirs } from '../../../dirs/selectors';
import useCacheDirsInfo from '../../../dirs/hooks/useCacheDirsInfo';
import { CacheDir, CacheSubDir } from '../../../dirs/types';
import {
	getHillshadingCacheDirChild,
	getLayerLabel,
	resolveCacheDirBase,
	stringifyProp,
} from '../../utils';
import { selectHgtDirPath, selectLayers } from '../../selectors';
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

	const appHgtDirPath = useAppSelector(selectHgtDirPath);

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

	const handleDeletePress = useCallback(() => {
		setDeleting(true);
		FsModule.deleteDir(pathFull).finally(() => {
			setDeleting(false);
			updateCacheDirs();
		});
	}, [pathFull, updateCacheDirs]);

	const { nestedIconColor, ...buttonProps } = useButtonProps({
		mode: 'text',
		style: styles.deleteAction,
	});

	return (
		<InfoLabelRow
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
							? cacheLayers
									.map((layer) => {
										const result = getLayerLabel(layer, {
											fallback: 'baseMap.label',
											appHgtDirPath,
										});
										return result ? t(result.key, result.params ?? {}) : '';
									})
									.join(', ')
							: ''}
					</Text>
				</View>

				{!deleting && (
					<ButtonHighlight
						{...buttonProps}
						compact
						onPress={handleDeletePress}
					>
						<Icon
							source="delete-outline"
							size={25}
							color={nestedIconColor}
						/>
					</ButtonHighlight>
				)}

				{deleting && <LoadingIndicator />}
			</View>
		</InfoLabelRow>
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

	const { t } = useTranslation();

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

	const [isSweeping, setIsSweeping] = useState(false);
	const handleSweep = useCallback(() => {
		setIsSweeping(true);
		const unusedPaths: string[] = [];
		cacheDirs.forEach((cacheDir: CacheDir) => {
			cacheDir.caches.forEach((cache: CacheSubDir) => {
				const pathFull = [cacheDir.path, cache.basename].join('/');
				if (findLayers(pathFull).length === 0) {
					unusedPaths.push(pathFull);
				}
			});
		});
		Promise.all(unusedPaths.map((path) => FsModule.deleteDir(path)))
			.finally(() => {
				setIsSweeping(false);
				updateCacheDirs();
			});
	}, [cacheDirs, findLayers, updateCacheDirs]);

	const buttonProps = useButtonProps({
		disabled: isSweeping,
	});

	return (
		<List.Accordion
			title={t('baseMap.cacheManager')}
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
							<InfoLabelRow
								label={internalCacheDir === cacheDir.path ? 'Internal' : 'External'}
							>
								<Text style={styles.cacheHeader}>{cacheDir.path}</Text>
							</InfoLabelRow>

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

				<View style={sharedStyles.modalControls}>
					{isSweeping ? <LoadingIndicator /> : <View />}

					<ButtonHighlight
						{...buttonProps}
						icon={'delete-sweep-outline'}
						onPress={handleSweep}
					>
						{t('baseMap.sweepCaches')}
					</ButtonHighlight>
				</View>
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
	cacheHeader: {
		paddingRight: 12,
	},
	cacheRow: {
		flexDirection: 'row',
		gap: 8,
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	cacheInfo: {
		flex: 1,
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
		marginBottom: 16,
	},
	deleteAction: {
		marginRight: -8,
	},
});

export default CacheManager;
