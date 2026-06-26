/**
 * External dependencies
 */
import { get, pick } from 'lodash-es';
import { FC, useCallback, useMemo } from 'react';
import {
	LayerBitmapTile,
	LayerBitmapTileProps,
	LayerMBTilesBitmap,
	LayerMapsforge,
	LayerMapsforgeProps,
	LayerHillshading,
	LayerHillshadingProps,
	LayerMapsforgeResponse,
	LayerMBTilesBitmapResponse,
} from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import {
	LayerConfig,
	LayerConfigOptionsOnlineRasterXYZ,
	LayerConfigOptionsRasterMBtiles,
	LayerConfigOptionsMapsforge,
	LayerConfigOptionsHillshading,
} from '../types';
import { getHillshadingCacheDirChild, stringifyProp } from '../utils';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { selectLayers, selectMapsforgeProfiles } from '../selectors';
import { selectAppDirs } from '../../dirs/selectors';
import { setLayerInfos } from '../slice';

const BaseMap: FC<{}> = () => {
	const appDirs = useAppSelector(selectAppDirs);

	const internalCacheDir = useMemo(
		() => get(appDirs, ['internalCacheDirs', 0], undefined),
		[appDirs]
	);

	const dispatch = useAppDispatch();

	const handleLayerChange = useCallback(
		(
			key: string,
			response: LayerMapsforgeResponse | LayerMBTilesBitmapResponse // ??? should handle other layer types as well.
		) => {
			dispatch(
				setLayerInfos((layerInfos) => ({
					...layerInfos,
					[key]: pick(response, [
						'attribution',
						'description',
						'comment',
						'createdBy',
					]),
				}))
			);
		},
		[dispatch]
	);

	const handleLayerCreateOrChangeFactory = useCallback(
		(key: string) => (response: LayerMapsforgeResponse | LayerMBTilesBitmapResponse) =>
			handleLayerChange(key, response),
		[handleLayerChange]
	);

	const layers = useAppSelector((state) => selectLayers(state, { temp: false }));

	const layersReverse = useMemo(() => [...layers].reverse(), [layers]);

	const profiles = useAppSelector((state) => selectMapsforgeProfiles(state, { temp: false }));

	return (
		<>
			{layersReverse.map((layer: LayerConfig) => {
				if (layer.type && layer.visible) {
					let cacheDirBase;
					switch (layer.type) {
						case 'online-raster-xyz':
							cacheDirBase =
								'internal' ===
								(layer.options as LayerConfigOptionsOnlineRasterXYZ)?.cacheDirBase
									? internalCacheDir
									: ((layer.options as LayerConfigOptionsOnlineRasterXYZ)
											?.cacheDirBase as LayerConfigOptionsOnlineRasterXYZ['cacheDirBase']);
							return (
								<LayerBitmapTile
									key={layer.key}
									zoomMin={
										(layer.options as LayerConfigOptionsOnlineRasterXYZ).zoomMin
									}
									zoomMax={
										(layer.options as LayerConfigOptionsOnlineRasterXYZ).zoomMax
									}
									enabledZoomMin={
										(layer.options as LayerConfigOptionsOnlineRasterXYZ)
											.enabledZoomMin
									}
									enabledZoomMax={
										(layer.options as LayerConfigOptionsOnlineRasterXYZ)
											.enabledZoomMax
									}
									url={get(layer.options, 'url', '')}
									alpha={
										(layer.options as LayerConfigOptionsOnlineRasterXYZ).alpha
									}
									cacheSize={
										(layer.options as LayerConfigOptionsOnlineRasterXYZ)
											.cacheSize
									}
									cacheDirChild={stringifyProp(
										(layer.options as LayerConfigOptionsOnlineRasterXYZ).url ||
											''
									)}
									cacheDirBase={
										(cacheDirBase ??
											'/') as LayerBitmapTileProps['cacheDirBase']
									} // if `/`, will fallback to java getReactApplicationContext().getCacheDir();
								/>
							);
						case 'raster-MBtiles':
							return (
								<LayerMBTilesBitmap
									key={layer.key}
									mapFile={
										(layer.options as LayerConfigOptionsRasterMBtiles).mapFile
									}
									enabledZoomMin={
										(layer.options as LayerConfigOptionsRasterMBtiles)
											.enabledZoomMin
									}
									enabledZoomMax={
										(layer.options as LayerConfigOptionsRasterMBtiles)
											.enabledZoomMax
									}
									onCreate={handleLayerCreateOrChangeFactory(layer.key)}
									onChange={handleLayerCreateOrChangeFactory(layer.key)}
								/>
							);
						case 'mapsforge':
							if (profiles.length > 0) {
								let profile = profiles.find(
									(prof) =>
										prof.key ===
										(layer.options as LayerConfigOptionsMapsforge).profile
								);
								profile = profile || profiles[0];
								return (
									<LayerMapsforge
										key={layer.key}
										enabledZoomMin={
											(layer.options as LayerConfigOptionsMapsforge)
												.enabledZoomMin
										}
										enabledZoomMax={
											(layer.options as LayerConfigOptionsMapsforge)
												.enabledZoomMax
										}
										mapFile={
											(layer.options as LayerConfigOptionsMapsforge).mapFile
										}
										renderTheme={
											profile.theme as LayerMapsforgeProps['renderTheme']
										}
										renderStyle={profile.renderStyle || undefined}
										renderOverlays={profile.renderOverlays}
										hasBuildings={profile.hasBuildings}
										hasLabels={profile.hasLabels}
										onCreate={handleLayerCreateOrChangeFactory(layer.key)}
										onChange={handleLayerCreateOrChangeFactory(layer.key)}
									/>
								);
							}
							return null;
						case 'hillshading':
							cacheDirBase =
								'internal' ===
								(layer.options as LayerConfigOptionsHillshading)?.cacheDirBase
									? internalCacheDir
									: ((layer.options as LayerConfigOptionsHillshading)
											?.cacheDirBase as LayerConfigOptionsHillshading['cacheDirBase']);
							return (
								<LayerHillshading
									key={layer.key}
									hgtDirPath={
										(layer.options as LayerConfigOptionsHillshading).hgtDirPath
									}
									zoomMin={
										(layer.options as LayerConfigOptionsHillshading).zoomMin
									}
									zoomMax={
										(layer.options as LayerConfigOptionsHillshading).zoomMax
									}
									enabledZoomMin={
										(layer.options as LayerConfigOptionsHillshading)
											.enabledZoomMin
									}
									enabledZoomMax={
										(layer.options as LayerConfigOptionsHillshading)
											.enabledZoomMax
									}
									magnitude={
										(layer.options as LayerConfigOptionsHillshading).magnitude
									}
									cacheSize={
										(layer.options as LayerConfigOptionsHillshading).cacheSize
									}
									cacheDirChild={getHillshadingCacheDirChild(
										layer.options as LayerConfigOptionsHillshading
									)}
									cacheDirBase={
										(cacheDirBase ??
											'/') as LayerHillshadingProps['cacheDirBase']
									} // if ``, will fallback to cache dbname;
									shadingAlgorithm={
										(layer.options as LayerConfigOptionsHillshading)
											.shadingAlgorithm
									}
									shadingAlgorithmOptions={
										(layer.options as LayerConfigOptionsHillshading)
											.shadingAlgorithmOptions
									}
								/>
							);
					}
				}
				return null;
			})}
		</>
	);
};

export default BaseMap;
